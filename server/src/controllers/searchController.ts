import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const unifiedSearch = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== "string" || q.trim() === "") {
    return res.status(200).json({
      events: {
        results: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      },
      users: {
        results: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      },
    });
  }

  const searchTerm = `%${q.trim()}%`;
  const eventPage = parseInt(req.query.eventPage as string) || 1;
  const eventLimit = parseInt(req.query.eventLimit as string) || 10;
  const eventOffset = (eventPage - 1) * eventLimit;
  const userPage = parseInt(req.query.userPage as string) || 1;
  const userLimit = parseInt(req.query.userLimit as string) || 10;
  const userOffset = (userPage - 1) * userLimit;

  try {
    const [eventCountResult, eventsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM events 
         WHERE (title ILIKE $1 OR description ILIKE $1) AND status != 'canceled'`,
        [searchTerm]
      ),
      pool.query(
        `SELECT 
            id, title, event_datetime, address
         FROM events 
         WHERE 
            (title ILIKE $1 OR description ILIKE $1) AND status != 'canceled'
         ORDER BY event_datetime DESC
         LIMIT $2 OFFSET $3`,
        [searchTerm, eventLimit, eventOffset]
      ),
    ]);

    const totalEventItems = parseInt(eventCountResult.rows[0].count, 10);
    const totalEventPages = Math.ceil(totalEventItems / eventLimit);

    const [userCountResult, usersResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM users 
         WHERE username ILIKE $1 AND is_verified = true`,
        [searchTerm]
      ),

      pool.query(
        `SELECT 
            id, username 
         FROM users 
         WHERE 
            username ILIKE $1 AND is_verified = true
         ORDER BY username ASC
         LIMIT $2 OFFSET $3`,
        [searchTerm, userLimit, userOffset]
      ),
    ]);

    const totalUserItems = parseInt(userCountResult.rows[0].count, 10);
    const totalUserPages = Math.ceil(totalUserItems / userLimit);

    res.json({
      events: {
        results: eventsResult.rows,
        pagination: {
          currentPage: eventPage,
          totalPages: totalEventPages,
          totalItems: totalEventItems,
        },
      },
      users: {
        results: usersResult.rows,
        pagination: {
          currentPage: userPage,
          totalPages: totalUserPages,
          totalItems: totalUserItems,
        },
      },
    });
  } catch (error) {
    console.error("Error performing unified search:", error);
    res.status(500).json({ message: "Internal Server Error during search" });
  }
};

export default { unifiedSearch };
