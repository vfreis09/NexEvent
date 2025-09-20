import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, role, created_at, is_verified, visibility
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
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
  try {
    const result = await pool.query(
      `SELECT id, title, description, event_datetime, location, status, created_at 
       FROM events 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, date, location, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           date = COALESCE($3, date),
           location = COALESCE($4, location),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING id, title, description, date, location, status`,
      [title, description, date, location, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
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
       RETURNING id, title, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event canceled", event: result.rows[0] });
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
