import { Request, Response } from "express";
const pool = require("../config/dbConfig");

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
      `SELECT u.name, r.status FROM rsvps r
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

const rsvpController = {
  createRsvp,
  getRsvps,
  getSingleRsvp,
};

export default rsvpController;
