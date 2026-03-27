import { faker } from "@faker-js/faker";
import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
});

const NUM_USERS = 50;
const NUM_EVENTS = 100;

const REAL_LOCATIONS = [
  // USA
  { city: "New York, NY", lat: 40.7128, lng: -74.006, country: "USA" },
  { city: "Los Angeles, CA", lat: 34.0522, lng: -118.2437, country: "USA" },
  { city: "Chicago, IL", lat: 41.8781, lng: -87.6298, country: "USA" },
  { city: "Houston, TX", lat: 29.7604, lng: -95.3698, country: "USA" },
  { city: "Phoenix, AZ", lat: 33.4484, lng: -112.074, country: "USA" },
  { city: "San Francisco, CA", lat: 37.7749, lng: -122.4194, country: "USA" },
  { city: "Miami, FL", lat: 25.7617, lng: -80.1918, country: "USA" },
  { city: "Seattle, WA", lat: 47.6062, lng: -122.3321, country: "USA" },
  { city: "Boston, MA", lat: 42.3601, lng: -71.0589, country: "USA" },
  { city: "Austin, TX", lat: 30.2672, lng: -97.7431, country: "USA" },

  // Europe
  { city: "London, UK", lat: 51.5074, lng: -0.1278, country: "UK" },
  { city: "Paris, France", lat: 48.8566, lng: 2.3522, country: "France" },
  { city: "Berlin, Germany", lat: 52.52, lng: 13.405, country: "Germany" },
  { city: "Madrid, Spain", lat: 40.4168, lng: -3.7038, country: "Spain" },
  { city: "Rome, Italy", lat: 41.9028, lng: 12.4964, country: "Italy" },
  {
    city: "Amsterdam, Netherlands",
    lat: 52.3676,
    lng: 4.9041,
    country: "Netherlands",
  },
  { city: "Barcelona, Spain", lat: 41.3851, lng: 2.1734, country: "Spain" },
  { city: "Vienna, Austria", lat: 48.2082, lng: 16.3738, country: "Austria" },

  // Asia
  { city: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, country: "Japan" },
  { city: "Singapore", lat: 1.3521, lng: 103.8198, country: "Singapore" },
  { city: "Hong Kong", lat: 22.3193, lng: 114.1694, country: "Hong Kong" },
  {
    city: "Seoul, South Korea",
    lat: 37.5665,
    lng: 126.978,
    country: "South Korea",
  },
  { city: "Dubai, UAE", lat: 25.2048, lng: 55.2708, country: "UAE" },
  {
    city: "Bangkok, Thailand",
    lat: 13.7563,
    lng: 100.5018,
    country: "Thailand",
  },

  // Oceania
  {
    city: "Sydney, Australia",
    lat: -33.8688,
    lng: 151.2093,
    country: "Australia",
  },
  {
    city: "Melbourne, Australia",
    lat: -37.8136,
    lng: 144.9631,
    country: "Australia",
  },
  {
    city: "Auckland, New Zealand",
    lat: -36.8485,
    lng: 174.7633,
    country: "New Zealand",
  },

  // South America
  {
    city: "São Paulo, Brazil",
    lat: -23.5505,
    lng: -46.6333,
    country: "Brazil",
  },
  {
    city: "Rio de Janeiro, Brazil",
    lat: -22.9068,
    lng: -43.1729,
    country: "Brazil",
  },
  {
    city: "Buenos Aires, Argentina",
    lat: -34.6037,
    lng: -58.3816,
    country: "Argentina",
  },
  { city: "Lima, Peru", lat: -12.0464, lng: -77.0428, country: "Peru" },

  // Canada
  { city: "Toronto, Canada", lat: 43.6532, lng: -79.3832, country: "Canada" },
  {
    city: "Vancouver, Canada",
    lat: 49.2827,
    lng: -123.1207,
    country: "Canada",
  },
  { city: "Montreal, Canada", lat: 45.5017, lng: -73.5673, country: "Canada" },
];

const getRandomLocationNearCity = () => {
  const baseLocation = faker.helpers.arrayElement(REAL_LOCATIONS);

  const latOffset = (Math.random() - 0.5) * 0.02;
  const lngOffset = (Math.random() - 0.5) * 0.02;

  return {
    lat: baseLocation.lat + latOffset,
    lng: baseLocation.lng + lngOffset,
    city: baseLocation.city,
  };
};

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
          true,
          true,
          faker.helpers.arrayElement(["daily", "weekly", "never"]),
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

      const location = getRandomLocationNearCity();
      const streetAddress = faker.location.streetAddress();

      const res = await client.query(
        `
        INSERT INTO events (title, description, event_datetime, max_attendees, location, address, author_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          faker.company.catchPhrase(),
          faker.lorem.paragraph(),
          date,
          faker.number.int({ min: 10, max: 100 }),
          `(${location.lng}, ${location.lat})`,
          `${streetAddress}, ${location.city}`,
          authorId,
          isPast ? "expired" : "active",
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
        const eventAuthor = (
          await client.query("SELECT author_id FROM events WHERE id = $1", [
            eId,
          ])
        ).rows[0].author_id;
        if (uId === eventAuthor) continue;

        await client.query(
          `
          INSERT INTO rsvps (user_id, event_id, status) 
          VALUES ($1, $2, 'accepted') ON CONFLICT DO NOTHING`,
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
