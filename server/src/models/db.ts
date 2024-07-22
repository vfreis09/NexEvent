const pool = require("../config/dbConfig");

const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        bio TEXT,
        role VARCHAR(10) DEFAULT 'standard',
        contact TEXT,
        visibility VARCHAR(7) DEFAULT 'public'
    )
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Users table created successfully or already exists.");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
};

export default initDb;
