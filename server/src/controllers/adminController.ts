import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  if (limit <= 0 || page <= 0) {
    return res.status(400).json({ message: "Invalid page or limit value." });
  }

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM users`);
    const totalEvents = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalEvents / limit);

    const result = await pool.query(
      `SELECT id, email, username, role, created_at, is_verified, visibility
       FROM users 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      users: result.rows,
      pagination: {
        totalEvents,
        totalPages,
        currentPage: page,
        limit: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching paginated users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["user", "admin", "banned"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, username, role",
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getStats = async (req: Request, res: Response) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const events = await pool.query("SELECT COUNT(*) FROM events");
    const rsvps = await pool.query("SELECT COUNT(*) FROM rsvps");

    const totals = {
      total_users: parseInt(users.rows[0].count, 10),
      total_events: parseInt(events.rows[0].count, 10),
      total_rsvps: parseInt(rsvps.rows[0].count, 10),
    };

    const eventsPerMonth = await pool.query(`
      SELECT TO_CHAR(event_datetime, 'YYYY-MM') AS month, COUNT(*)::int AS total
      FROM events
      WHERE event_datetime >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `);

    const eventStatus = await pool.query(`
      SELECT status, COUNT(*)::int AS total
      FROM events
      GROUP BY status
    `);

    res.json({
      totals,
      events_per_month: eventsPerMonth.rows,
      event_status: eventStatus.rows,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getEvents = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  if (limit <= 0 || page <= 0) {
    return res.status(400).json({ message: "Invalid page or limit value." });
  }

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM events`);
    const totalEvents = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalEvents / limit);

    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.event_datetime, e.location, e.status, e.created_at, u.username AS author_username
       FROM events e
       JOIN users u ON e.author_id = u.id
       ORDER BY e.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      events: result.rows,
      pagination: {
        totalEvents,
        totalPages,
        currentPage: page,
        limit: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching paginated events:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, eventDateTime, location, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           event_datetime = COALESCE($3, event_datetime), -- Use event_datetime from your schema
           location = COALESCE($4, location),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING id, title, description, event_datetime, location, status, author_id`,
      [title, description, eventDateTime, location, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const updatedEvent = result.rows[0];
    const userResult = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [updatedEvent.author_id]
    );

    res.json({
      ...updatedEvent,
      author_username: userResult.rows[0]?.username,
    });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const cancelEvent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE events 
       SET status = 'canceled'
       WHERE id = $1
       RETURNING id, title, status, author_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const canceledEvent = result.rows[0];
    const userResult = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [canceledEvent.author_id]
    );

    res.json({
      message: "Event canceled",
      event: {
        ...canceledEvent,
        author_username: userResult.rows[0]?.username,
      },
    });
  } catch (err) {
    console.error("Error canceling event:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteEvent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM events
       WHERE id = $1
       RETURNING id, title`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted", event: result.rows[0] });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const adminController = {
  getUsers,
  updateUserRole,
  getStats,
  getEvents,
  updateEvent,
  cancelEvent,
  deleteEvent,
};

export default adminController;
