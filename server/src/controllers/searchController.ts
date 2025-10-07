import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const unifiedSearch = async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== "string" || q.trim() === "") {
    return res.status(200).json({ events: [], users: [] });
  }

  const searchTerm = `%${q.trim()}%`;

  try {
    const eventsResult = await pool.query(
      `SELECT 
                id, title, event_datetime, address
             FROM events 
             WHERE 
                (title ILIKE $1 OR description ILIKE $1) AND status != 'canceled'
             ORDER BY event_datetime DESC
             LIMIT 50`,
      [searchTerm]
    );

    const usersResult = await pool.query(
      `SELECT 
                id, username 
             FROM users 
             WHERE 
                username ILIKE $1 AND is_verified = true
             LIMIT 20`,
      [searchTerm]
    );

    res.json({
      events: eventsResult.rows,
      users: usersResult.rows,
    });
  } catch (error) {
    console.error("Error performing unified search:", error);
    res.status(500).json({ message: "Internal Server Error during search" });
  }
};

export default { unifiedSearch };
