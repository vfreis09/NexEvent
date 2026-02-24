import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Create the connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Verifies the database connection.
 * This is exported as the default to match your app.ts import.
 */
const initDb = async () => {
  // We call pool.query directly to ensure the object exists and works
  await pool.query("SELECT NOW()");
};

export default initDb;
