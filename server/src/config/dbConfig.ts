import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// This is the function your app.ts is looking for
const initDb = async () => {
  await pool.query("SELECT NOW()");
};

export default initDb;
