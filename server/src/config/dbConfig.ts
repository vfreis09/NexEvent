import dotenv from "dotenv";

dotenv.config();

const { Pool } = require("pg");

export const pool = new Pool({
  user: process.env.USER,
  host: "pgsql",
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: 5432,
});

module.exports = pool;
