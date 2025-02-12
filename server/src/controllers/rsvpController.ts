import { Request, Response } from "express";
const pool = require("../config/dbConfig");
import { updateEventStatus } from "../utils/eventService";

const createRsvp = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, status } = req.body;

  try {
    const event = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (!event.rows.length) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const { max_attendees } = event.rows[0];

    const updateAttendeesCount = async (id: string): Promise<number> => {
      const result = await pool.query(
        `SELECT COUNT(*) FROM rsvps WHERE event_id = $1 AND status = 'Accepted'`,
        [id]
      );
      const attendeesCount = parseInt(result.rows[0].count, 10);

      await pool.query(
        `UPDATE events SET number_of_attendees = $1 WHERE id = $2`,
        [attendeesCount, id]
      );

      return attendeesCount;
    };

    if (status === "Accepted" && max_attendees !== null) {
      const currentAttendees = await updateAttendeesCount(id);
      if (currentAttendees >= max_attendees) {
        res
          .status(400)
          .json({ message: "Maximum number of attendees reached" });
        return;
      }
    }

    await pool.query(
      `INSERT INTO rsvps (user_id, event_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, event_id) 
           DO UPDATE SET status = EXCLUDED.status`,
      [userId, id, status]
    );

    await updateAttendeesCount(id);
    await updateEventStatus(Number(id));

    res.status(200).json({ message: "RSVP updated successfully" });
  } catch (err) {
    console.error(err);
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

    const event = await pool.query(
      `SELECT COUNT(*) AS attendee_count, max_attendees 
         FROM rsvps 
         INNER JOIN events ON rsvps.event_id = events.id
         WHERE events.id = $1
         GROUP BY max_attendees`,
      [id]
    );

    if (!event.rows.length) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { attendee_count, max_attendees } = event.rows[0];
    const isEventFull = attendee_count >= max_attendees;

    if (!rsvp.rows.length) {
      return res.status(404).json({
        message: "RSVP not found",
        isEventFull,
      });
    }

    res.status(200).json({
      status: rsvp.rows[0].status,
      isEventFull,
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
