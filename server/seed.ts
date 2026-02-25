import { faker } from "@faker-js/faker";
import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Environment variable loading logic
const envPaths = [
  path.join(process.cwd(), ".env"),
  path.join(__dirname, ".env"),
  path.join(__dirname, "..", ".env"),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    console.log(`✅ Loaded .env from: ${p}`);
    break;
  }
}

dotenv.config();

// Database connection using your Supabase/Railway string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
});

const NUM_USERS = 50;
const NUM_EVENTS = 100;

const seedDatabase = async () => {
  console.log(`--- Connection Check ---`);
  console.log(`Target DB: ${process.env.DATABASE_URL?.split("@")[1]}`);
  console.log(`-----------------------`);

  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    console.log("--- Cleaning existing data...");
    const tables = [
      "notifications",
      "invites",
      "rsvps",
      "user_preferences",
      "event_tags",
      "email_queue",
      "events",
      "tags",
      "users",
    ];

    for (const table of tables) {
      await client.query(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);
    }

    // Keeping your requested path exactly as is
    const tagsPath = path.join(__dirname, "src", "data", "tags.json");
    if (!fs.existsSync(tagsPath))
      throw new Error(`tags.json not found at ${tagsPath}`);

    const fileContent = JSON.parse(fs.readFileSync(tagsPath, "utf8"));
    const defaultTags = fileContent.defaultTags;

    await client.query(
      `
      INSERT INTO tags (name) 
      SELECT name FROM UNNEST($1::text[]) AS name 
      ON CONFLICT (name) DO NOTHING;
    `,
      [defaultTags],
    );

    const tagIds = (await client.query("SELECT id FROM tags")).rows.map(
      (r) => r.id,
    );
    console.log(`--- Seeded ${tagIds.length} tags.`);

    const userIds: number[] = [];
    for (let i = 1; i <= NUM_USERS; i++) {
      const res = await client.query(
        `
    INSERT INTO users (
      email, password, username, bio, role, is_verified, 
      wants_notifications, digest_frequency
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          faker.internet.email().toLowerCase() + i,
          "$2a$10$abcdefghijklmnopqrstuvwxyza.123456",
          faker.internet.username().toLowerCase() + i,
          faker.person.bio(),
          i === 1 ? "admin" : "user",
          true, // is_verified
          true, // Setting to true so notifications actually trigger for them
          faker.helpers.arrayElement(["daily", "weekly", "never"]), // Randomizing frequencies
        ],
      );
      userIds.push(res.rows[0].id);
    }
    console.log(`--- Seeded ${userIds.length} users.`);

    for (const uId of userIds) {
      const picks = faker.helpers.arrayElements(tagIds, { min: 2, max: 4 });
      for (const tId of picks) {
        await client.query(
          "INSERT INTO user_preferences (user_id, tag_id) VALUES ($1, $2)",
          [uId, tId],
        );
      }
    }
    console.log("--- Seeded user preferences.");

    const eventIds: number[] = [];
    for (let i = 0; i < NUM_EVENTS; i++) {
      const authorId = faker.helpers.arrayElement(userIds);
      const isPast = faker.datatype.boolean(0.2);
      const date = isPast ? faker.date.recent() : faker.date.future();

      const res = await client.query(
        `
        INSERT INTO events (title, description, event_datetime, max_attendees, location, address, author_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          faker.company.catchPhrase(),
          faker.lorem.paragraph(),
          date,
          faker.number.int({ min: 10, max: 100 }),
          `(${faker.location.longitude()}, ${faker.location.latitude()})`,
          faker.location.streetAddress(),
          authorId,
          isPast ? "expired" : "active", // Matches your DB check constraint
        ],
      );
      const eventId = res.rows[0].id;
      eventIds.push(eventId);

      const eventPicks = faker.helpers.arrayElements(tagIds, {
        min: 1,
        max: 3,
      });
      for (const tId of eventPicks) {
        await client.query(
          "INSERT INTO event_tags (event_id, tag_id) VALUES ($1, $2)",
          [eventId, tId],
        );
      }
    }
    console.log(`--- Seeded ${NUM_EVENTS} events with tags.`);

    for (const eId of eventIds) {
      const attendees = faker.helpers.arrayElements(userIds, {
        min: 1,
        max: 5,
      });
      for (const uId of attendees) {
        // Find the author of this specific event to avoid self-RSVP
        const eventAuthor = (
          await client.query("SELECT author_id FROM events WHERE id = $1", [
            eId,
          ])
        ).rows[0].author_id;
        if (uId === eventAuthor) continue;

        await client.query(
          `
          INSERT INTO rsvps (user_id, event_id, status) 
          VALUES ($1, $2, 'accepted') ON CONFLICT DO NOTHING`, // Lowercase to match your DB CHECK
          [uId, eId],
        );
      }
    }

    await client.query("COMMIT");
    console.log("🚀 SUCCESS: Database fully seeded with realistic data!");
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ FAILED:", error);
  } finally {
    if (client) client.release();
    process.exit();
  }
};

seedDatabase();
