import dotenv from "dotenv";
import path from "path";
const { Pool } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
