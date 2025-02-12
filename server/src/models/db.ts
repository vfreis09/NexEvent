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
        max_attendees INT DEFAULT NULL,
        location POINT,
        author_id INTEGER REFERENCES users(id),
        status VARCHAR(10) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        CONSTRAINT status_check CHECK (status IN ('active', 'full', 'expired'))
      );

      CREATE TABLE IF NOT EXISTS rsvps (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      event_id INT REFERENCES events(id) ON DELETE CASCADE,
      status VARCHAR(10) CHECK (status IN ('Accepted', 'Declined')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
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
