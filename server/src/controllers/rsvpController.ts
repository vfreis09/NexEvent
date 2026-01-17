import { Request, Response } from "express";
const pool = require("../config/dbConfig");
import { updateEventStatus } from "../utils/eventService";

const createRsvp = async (req: Request, res: Response): Promise<void> => {
  const { id: eventId } = req.params;
  const { status } = req.body;

  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!userId || !userEmail) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const eventResult = await pool.query(
      `SELECT id, title, max_attendees, number_of_attendees, author_id FROM events WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const event = eventResult.rows[0];

    const updateAttendeesCount = async (): Promise<number> => {
      const result = await pool.query(
        `SELECT COUNT(*) FROM rsvps WHERE event_id = $1 AND status = 'Accepted'`,
        [eventId]
      );
      const attendeesCount = parseInt(result.rows[0].count, 10);

      await pool.query(
        `UPDATE events SET number_of_attendees = $1 WHERE id = $2`,
        [attendeesCount, eventId]
      );

      return attendeesCount;
    };

    if (status === "Accepted" && event.max_attendees !== null) {
      const currentAttendees = await updateAttendeesCount();
      if (currentAttendees >= event.max_attendees) {
        res.status(400).json({ message: "Event is full" });
        return;
      }
    }

    const existingRsvp = await pool.query(
      `SELECT status FROM rsvps WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    const previousStatus = existingRsvp.rows[0]?.status;

    await pool.query(
      `INSERT INTO rsvps (user_id, event_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id)
       DO UPDATE SET status = EXCLUDED.status`,
      [userId, eventId, status]
    );

    await updateAttendeesCount();

    if (status !== previousStatus) {
      const message = `${userEmail} has RSVP'd as "${status}" to your event "${event.title}".`;

      await pool.query(
        `INSERT INTO notifications (user_id, message, event_id)
         VALUES ($1, $2, $3)`,
        [event.author_id, message, eventId]
      );
    }

    res.status(200).json({ message: "RSVP updated successfully" });
  } catch (err) {
    console.error("Error updating RSVP:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getRsvps = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const rsvps = await pool.query(
      `SELECT u.username, r.status FROM rsvps r
           JOIN users u ON r.user_id = u.id
           WHERE r.event_id = $1`,
      [id]
    );

    res.status(200).json(rsvps.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getSingleRsvp = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const rsvp = await pool.query(
      `SELECT status FROM rsvps WHERE event_id = $1 AND user_id = $2`,
      [id, userId]
    );

    const event = await pool.query(`SELECT id FROM events WHERE id = $1`, [id]);

    if (!event.rows.length) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!rsvp.rows.length) {
      return res.status(200).json({ status: null });
    }

    res.status(200).json({
      status: rsvp.rows[0].status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getEventsRsvpedByUser = async (req: Request, res: Response) => {
  const { username } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const filterType = req.query.type as string;
  const offset = (page - 1) * limit;

  try {
    const userResult = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;
    const now = new Date();

    let whereClause = `r.user_id = $1`;
    let queryParams: any[] = [userId];
    let orderByClause = `ORDER BY e.event_datetime DESC`;

    if (filterType === "upcoming") {
      whereClause += ` AND r.status = 'accepted' AND e.event_datetime >= $2 AND e.status != 'canceled'`;
      queryParams.push(now);
      orderByClause = `ORDER BY e.event_datetime ASC`;
    } else if (filterType === "past") {
      whereClause += ` AND (e.event_datetime < $2 OR e.status = 'canceled' OR r.status = 'declined')`;
      queryParams.push(now);
      orderByClause = `ORDER BY e.event_datetime DESC`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(e.id)
       FROM rsvps r
       JOIN events e ON r.event_id = e.id
       WHERE ${whereClause}`,
      queryParams
    );
    const totalEvents = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalEvents / limit);
    const limitIdx = queryParams.length + 1;
    const offsetIdx = queryParams.length + 2;
    queryParams.push(limit, offset);

    const eventsResult = await pool.query(
      `SELECT e.*, u.username AS author_username
       FROM rsvps r
       JOIN events e ON r.event_id = e.id
       JOIN users u ON e.author_id = u.id
       WHERE ${whereClause}
       ${orderByClause}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      queryParams
    );

    await Promise.all(
      eventsResult.rows.map((event: any) => updateEventStatus(event.id))
    );

    res.json({
      events: eventsResult.rows,
      pagination: {
        totalEvents,
        totalPages,
        currentPage: page,
        limit: limit,
      },
    });
  } catch (error) {
    console.error(`Error fetching RSVP events for ${username}:`, error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const rsvpController = {
  createRsvp,
  getRsvps,
  getSingleRsvp,
  getEventsRsvpedByUser,
};

export default rsvpController;
