import { Request, Response } from "express";
const pool = require("../config/dbConfig");
import { updateEventStatus } from "../utils/eventService";
import emailServices from "../utils/emailService";

const createEvent = async (req: Request, res: Response) => {
  if (!req.cookies?.token) {
    return res.status(401).send("Unauthorized");
  }
  const {
    title,
    description,
    eventDateTime,
    location,
    max_attendees,
    address,
  } = req.body;

  const maxAttendees =
    max_attendees === "" ? null : parseInt(max_attendees, 10);

  if (!location) {
    return res.status(400).json({ message: "Location is required." });
  }

  const [longitude, latitude] = location.split(" ").map(Number);
  if (isNaN(longitude) || isNaN(latitude)) {
    return res.status(400).json({ message: "Invalid location format." });
  }

  // ✅ 1. PREVENT PAST/EXPIRED EVENTS
  const scheduledTime = new Date(eventDateTime);
  const now = new Date();

  // Allow a 60-second buffer to account for network/server lag.
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  if (scheduledTime < oneMinuteAgo) {
    return res.status(400).json({
      message:
        "Cannot create an event in the past. Please select a future date and time.",
    });
  }
  // END PAST EVENT CHECK

  const locationPoint = `(${longitude}, ${latitude})`;

  const authorId = req.user?.id;

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, event_datetime, location, address, author_id, max_attendees)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description,
        eventDateTime,
        locationPoint,
        address,
        authorId,
        maxAttendees,
      ]
    );
    const event = result.rows[0];

    await updateEventStatus(event.id);

    // 2. Send SUCCESS RESPONSE immediately (Crucial for rate-limit safety)
    res.status(201).json(event);

    // 3. ASYNCHRONOUS BACKGROUND TASK for emails (still prone to Mailtrap rate-limit errors in the console)
    (async () => {
      try {
        const users = await pool.query(
          "SELECT email FROM users WHERE is_verified = true"
        );

        for (const user of users.rows as { email: string }[]) {
          await emailServices
            .sendEventCreationEmail(user.email, event.title, event.id)
            .catch((e) => {
              // Logs the error but does not break the app flow
              console.error(
                `Failed to send creation email to ${user.email}:`,
                e.message
              );
            });
        }
        console.log("All event creation emails processed.");
      } catch (backgroundError) {
        console.error(
          "Critical background email process failure:",
          backgroundError
        );
      }
    })();
  } catch (error) {
    console.error("Error creating event (DB failure):", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const getEvents = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT events.*, users.username AS author_username
       FROM events
       JOIN users ON events.author_id = users.id
       WHERE events.status != 'canceled'
       ORDER BY events.event_datetime DESC, events.created_at DESC`
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    await Promise.all(
      result.rows.map((event: any) => updateEventStatus(event.id))
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEventById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT events.*, users.username AS author_username
       FROM events
       JOIN users ON events.author_id = users.id
       WHERE events.id = $1`,
      [id]
    );

    if (result.rows.length > 0) {
      await updateEventStatus(id);
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateEvent = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  let { title, description, eventDateTime, location, max_attendees, address } =
    req.body;

  const authorId = req.user?.id;

  try {
    const existingEventResult = await pool.query(
      `SELECT event_datetime, author_id, location, address
       FROM events 
       WHERE id = $1`,
      [id]
    );

    if (existingEventResult.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingEvent = existingEventResult.rows[0];

    if (existingEvent.author_id !== authorId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this event" });
    }

    const eventIsExpired = new Date(existingEvent.event_datetime) < new Date();

    if (eventIsExpired) {
      eventDateTime = existingEvent.event_datetime.toISOString();

      location = existingEvent.location;

      address = existingEvent.address;
    }

    const maxAttendees =
      max_attendees === "" ? null : parseInt(max_attendees, 10);

    let locationPoint: string;

    if (typeof location === "string") {
      const [longitude, latitude] = location.split(" ").map(Number);
      if (isNaN(longitude) || isNaN(latitude)) {
        return res.status(400).json({ message: "Invalid location format." });
      }
      locationPoint = `(${longitude}, ${latitude})`;
    } else if (typeof existingEvent.location === "string") {
      const [longitude, latitude] = location.split(" ").map(Number);
      if (isNaN(longitude) || isNaN(latitude)) {
        return res.status(400).json({ message: "Invalid location format." });
      }
      locationPoint = `(${longitude}, ${latitude})`;
    } else {
      return res
        .status(400)
        .json({ message: "Location data is missing or invalid." });
    }
    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, event_datetime = $3, location = $4, address = $5, max_attendees = $6
       WHERE id = $7 AND author_id = $8 
       RETURNING *`,
      [
        title,
        description,
        eventDateTime,
        locationPoint,
        address,
        maxAttendees,
        id,
        authorId,
      ]
    );

    if (result.rows.length > 0) {
      const updatedEvent = result.rows[0];

      await updateEventStatus(id);

      res.json(updatedEvent);

      const rsvpResult = await pool.query(
        `SELECT r.*, u.email FROM rsvps r
         JOIN users u ON r.user_id = u.id
         WHERE r.event_id = $1
         AND r.status = 'Accepted'
         AND u.is_verified = true
         AND u.wants_notifications = true`,
        [id]
      );

      for (const user of rsvpResult.rows) {
        try {
          await emailServices.sendEventUpdateEmail(
            user.email,
            updatedEvent.title,
            updatedEvent.id
          );

          const existingNotification = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = $1 AND event_id = $2
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.user_id, updatedEvent.id]
          );

          const message = `Event "${updatedEvent.title}" has been updated.`;

          if (
            existingNotification.rows.length > 0 &&
            !existingNotification.rows[0].is_read
          ) {
            await pool.query(
              `UPDATE notifications
               SET message = $1, created_at = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [message, existingNotification.rows[0].id]
            );
          } else {
            await pool.query(
              `INSERT INTO notifications (user_id, event_id, message)
               VALUES ($1, $2, $3)`,
              [user.user_id, updatedEvent.id, message]
            );
          }
        } catch (notifError) {
          console.error(
            `Failed to handle notification for ${user.email}:`,
            notifError
          );
        }
      }
    } else {
      return res
        .status(404)
        .json({ message: "Event not found or not authorized" });
    }
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const cancelEvent = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const authorId = req.user?.id;

  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = result.rows[0];

    if (event.author_id !== authorId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this event" });
    }

    if (event.status === "canceled") {
      return res.status(400).json({ error: "Event is already canceled" });
    }

    const updateResult = await pool.query(
      "UPDATE events SET status = $1 WHERE id = $2 RETURNING *",
      ["canceled", id]
    );

    const canceledEvent = updateResult.rows[0];

    const rsvpResult = await pool.query(
      `SELECT r.user_id, u.email
       FROM rsvps r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       AND r.status = 'Accepted'
       AND u.is_verified = true
       AND u.wants_notifications = true`,
      [id]
    );

    for (const user of rsvpResult.rows) {
      const message = `Event "${canceledEvent.title}" has been canceled.`;

      try {
        await emailServices.sendEventCancelationEmail(
          user.email,
          canceledEvent.title,
          canceledEvent.id
        );

        await pool.query(
          `INSERT INTO notifications (user_id, event_id, message)
           VALUES ($1, $2, $3)`,
          [user.user_id, canceledEvent.id, message]
        );
      } catch (notifError) {
        console.error(
          `Notification/email failed for ${user.email}:`,
          notifError
        );
      }
    }

    res.status(200).json(canceledEvent);
  } catch (error) {
    console.error("Error cancelling event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getEventsByAuthor = async (req: Request, res: Response) => {
  const { username } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const userResult = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    const eventsResult = await pool.query(
      `SELECT events.*, users.username AS author_username
       FROM events
       JOIN users ON events.author_id = users.id
       WHERE author_id = $1
       ORDER BY events.event_datetime DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    await Promise.all(
      eventsResult.rows.map((event: any) => updateEventStatus(event.id))
    );

    res.json(eventsResult.rows);
  } catch (err) {
    console.error("Error fetching events by author:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const eventController = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  getEventsByAuthor,
};

export default eventController;
