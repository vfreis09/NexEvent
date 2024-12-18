const pool = require("../config/dbConfig");

const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        bio TEXT,
        role VARCHAR(5) DEFAULT 'user',
        contact TEXT,
        visibility VARCHAR(7) DEFAULT 'public'
      );
      
      CREATE TABLE IF NOT EXISTS events(
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        event_datetime TIMESTAMP NOT NULL,
        number_of_attendees INT DEFAULT 0,
        location POINT,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Users table created successfully or already exists.");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
};

export default initDb;
