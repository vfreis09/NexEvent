import { faker } from "@faker-js/faker";
import { Pool, PoolClient, QueryResult } from "pg";

type UserData = [
  string, // email
  string, // password
  string, // username
  string, // bio
  string, // role
  string, // contact
  string, // visibility
  boolean, // is_verified
  boolean, // wants_notifications
  string | null, // reset_token_hash
  Date | null // reset_token_expires
];

type EventData = [
  string, // title
  string, // description
  string, // event_datetime (ISO string)
  number, // number_of_attendees
  number | null, // max_attendees
  string, // location (POINT string)
  string, // address
  number, // author_id (FK)
  string // status
];

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

const NUM_USERS = 50;
const NUM_EVENTS = 1000;
const EVENTS_PER_RSVP = 5;
const EVENTS_PER_INVITE = 10;

const generateUser = (index: number): UserData => {
  return [
    faker.internet.email() + index,
    "$2a$10$abcdefghijklmnopqrstuvwxyza.123456",
    faker.internet.username() + index,
    faker.person.bio(),
    index === 1 ? "admin" : "user",
    faker.phone.number(),
    faker.helpers.arrayElement(["public", "private"]),
    true,
    faker.datatype.boolean(),
    null,
    null,
  ];
};

const generateEvent = (authorId: number): EventData => {
  const isPast = faker.datatype.boolean(0.1);
  let date: Date;
  let status: string;

  if (isPast) {
    date = faker.date.recent({ days: 180 });
    status = faker.helpers.arrayElement(["expired", "canceled"]);
  } else {
    date = faker.date.future({ years: 1 });
    status = faker.helpers.arrayElement(["active", "active", "active", "full"]);
  }

  const lat = faker.location.latitude({ min: 30, max: 45 });
  const lng = faker.location.longitude({ min: -110, max: -70 });

  const locationPoint = `(${lng}, ${lat})`;
  const maxAttendees = faker.number.int({ min: 10, max: 200 });
  const number_of_attendees =
    status === "full"
      ? maxAttendees
      : faker.number.int({ min: 0, max: maxAttendees - 1 });

  return [
    faker.commerce.productName() + " Gathering",
    faker.lorem.paragraphs(2),
    date.toISOString(),
    number_of_attendees,
    maxAttendees,
    locationPoint,
    faker.location.streetAddress(true),
    authorId,
    status,
  ];
};

const seedDatabase = async () => {
  console.log(
    `Attempting to connect to host: ${process.env.DB_HOST}:${process.env.DB_PORT}...`
  );

  let client: PoolClient | undefined;

  try {
    client = await pool.connect();

    console.log(
      `Starting seed process for ${NUM_USERS} users and ${NUM_EVENTS} events...`
    );
    await client.query("BEGIN");

    await client.query("TRUNCATE users RESTART IDENTITY CASCADE");
    console.log("--- Cleared existing data in all tables.");

    const userInsertPromises: Promise<QueryResult<any>>[] = [];
    for (let i = 1; i <= NUM_USERS; i++) {
      const userData = generateUser(i);
      const userQuery = `
                INSERT INTO users (email, password, username, bio, role, contact, visibility, is_verified, wants_notifications, reset_token_hash, reset_token_expires)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id;
            `;
      userInsertPromises.push(client.query(userQuery, userData as any[]));
    }

    const userResults = await Promise.all(userInsertPromises);
    const userIds: number[] = userResults.map((res) => res.rows[0].id);

    console.log(`--- Successfully created ${userIds.length} users.`);

    const eventInsertPromises: Promise<QueryResult<any>>[] = [];
    for (let i = 0; i < NUM_EVENTS; i++) {
      const randomCreatorId =
        userIds[faker.number.int({ min: 0, max: userIds.length - 1 })];
      const eventData = generateEvent(randomCreatorId);

      const eventQuery = `
                INSERT INTO events (title, description, event_datetime, number_of_attendees, max_attendees, location, address, author_id, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id;
            `;
      eventInsertPromises.push(client.query(eventQuery, eventData as any[]));
    }

    const eventResults = await Promise.all(eventInsertPromises);
    const eventIds: number[] = eventResults.map((res) => res.rows[0].id);

    console.log(`--- Successfully created ${NUM_EVENTS} events.`);

    const rsvpInsertPromises: Promise<QueryResult<any>>[] = [];
    const rsvpEvents = faker.helpers
      .shuffle(eventIds)
      .slice(0, Math.floor(NUM_EVENTS / EVENTS_PER_RSVP));

    for (const eventId of rsvpEvents) {
      const authorQuery = "SELECT author_id FROM events WHERE id = $1";
      const authorResult = await client.query(authorQuery, [eventId]);
      const authorId: number = authorResult.rows[0].author_id;

      const attendingUserIds = userIds
        .filter((id) => id !== authorId)
        .slice(0, faker.number.int({ min: 1, max: 5 }));

      for (const userId of attendingUserIds) {
        const rsvpQuery = `
                    INSERT INTO rsvps (user_id, event_id, status)
                    VALUES ($1, $2, 'Accepted')
                    ON CONFLICT (user_id, event_id) DO NOTHING;
                `;
        rsvpInsertPromises.push(client.query(rsvpQuery, [userId, eventId]));
      }
    }
    await Promise.all(rsvpInsertPromises);
    console.log(
      `--- Created RSVPs for ${rsvpInsertPromises.length} unique user-event pairs.`
    );

    const notificationInsertPromises: Promise<QueryResult<any>>[] = [];
    const inviteEvents = faker.helpers
      .shuffle(eventIds)
      .slice(0, Math.floor(NUM_EVENTS / EVENTS_PER_INVITE));

    for (const eventId of inviteEvents) {
      const eventAuthorId: number = (
        await client.query("SELECT author_id FROM events WHERE id = $1", [
          eventId,
        ])
      ).rows[0].author_id;

      const invitedUsers = userIds
        .filter((id) => id !== eventAuthorId)
        .slice(0, faker.number.int({ min: 1, max: 2 }));

      for (const invitedId of invitedUsers) {
        const inviteQuery = `
                    INSERT INTO invites (event_id, invited_user_id, invited_by, status)
                    VALUES ($1, $2, $3, 'pending')
                    RETURNING id;
                `;
        const inviteResult = await client.query(inviteQuery, [
          eventId,
          invitedId,
          eventAuthorId,
        ]);
        const inviteId: number = inviteResult.rows[0].id;

        const notificationQuery = `
                    INSERT INTO notifications (user_id, event_id, invite_id, message, is_read)
                    VALUES ($1, $2, $3, $4, FALSE);
                `;
        const message = `You have been invited to an event: ${faker.commerce.productName()}.`;
        notificationInsertPromises.push(
          client.query(notificationQuery, [
            invitedId,
            eventId,
            inviteId,
            message,
          ])
        );
      }
    }
    await Promise.all(notificationInsertPromises);
    console.log(
      `--- Created Invites and Notifications for ${inviteEvents.length} events.`
    );

    await client.query("COMMIT");
    console.log("Database seeding complete!");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Database seeding failed:", (error as Error).message);
  } finally {
    if (client) {
      client.release();
    }
  }
};

seedDatabase().catch(console.error);
