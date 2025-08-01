const pool = require("../config/dbConfig");

const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      bio TEXT,
      role VARCHAR(5) DEFAULT 'user',
      contact TEXT,
      visibility VARCHAR(7) DEFAULT 'public',
      is_verified BOOLEAN DEFAULT FALSE,
      wants_notifications BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events(
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      event_datetime TIMESTAMP NOT NULL,
      number_of_attendees INT DEFAULT 0,
      max_attendees INT DEFAULT NULL,
      location POINT,
      address TEXT,
      author_id INTEGER REFERENCES users(id),
      status VARCHAR(10) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT status_check CHECK (status IN ('active', 'full', 'expired', 'canceled'))
    );

    CREATE TABLE IF NOT EXISTS invites (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      invited_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_event_invite UNIQUE (event_id, invited_user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      invite_id INTEGER REFERENCES invites(id) ON DELETE CASCADE,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
