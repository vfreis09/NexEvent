import { Request, Response } from "express";
const pool = require("../config/dbConfig");
import { updateEventStatus } from "../utils/eventService";
import emailServices from "../utils/emailService";

const createEvent = async (req: Request, res: Response) => {
  if (!req.cookies?.token) {
    return res.status(401).send("Unauthorized");
  }
  const { title, description, eventDateTime, location, max_attendees } =
    req.body;

  const maxAttendees =
    max_attendees === "" ? null : parseInt(max_attendees, 10);

  if (!location) {
    return res.status(400).json({ message: "Location is required." });
  }

  const [longitude, latitude] = location.split(" ").map(Number);
  if (isNaN(longitude) || isNaN(latitude)) {
    return res.status(400).json({ message: "Invalid location format." });
  }

  const locationPoint = `(${longitude}, ${latitude})`;

  const authorId = req.user?.id;

  try {
    const result = await pool.query(
      "INSERT INTO events (title, description, event_datetime, location, author_id, max_attendees) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, eventDateTime, locationPoint, authorId, maxAttendees]
    );
    const event = result.rows[0];

    await updateEventStatus(event.id);

    //return response before sending email notifications
    res.status(201).json(event);

    const users = await pool.query(
      "SELECT email FROM users WHERE is_verified = true"
    );

    for (const user of users.rows) {
      await emailServices.sendEventCreationEmail(
        user.email,
        event.title,
        event.id
      );
    }
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEvents = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events ORDER BY created_at DESC"
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    // Update event statuses before sending to client
    await Promise.all(
      result.rows.map((event: any) => updateEventStatus(event.id))
    );

    const updatedResult = await pool.query(
      "SELECT * FROM events ORDER BY created_at DESC"
    );

    res.json(updatedResult.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEventById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT * 
       FROM events
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
  const { title, description, eventDateTime, location, max_attendees } =
    req.body;

  const maxAttendees =
    max_attendees === "" ? null : parseInt(max_attendees, 10);

  if (!location) {
    return res.status(400).json({ message: "Location is required." });
  }

  const [longitude, latitude] = location.split(" ").map(Number);
  if (isNaN(longitude) || isNaN(latitude)) {
    return res.status(400).json({ message: "Invalid location format." });
  }

  const locationPoint = `(${longitude}, ${latitude})`;

  const authorId = req.user?.id;

  try {
    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, event_datetime = $3, location = $4, max_attendees = $5 
       WHERE id = $6 AND author_id = $7 
       RETURNING *`,
      [
        title,
        description,
        eventDateTime,
        locationPoint,
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
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
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

const deleteEvent = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const authorId = req.user?.id;

  try {
    const result = await pool.query(
      "DELETE FROM events WHERE id = $1 AND author_id = $2 RETURNING *",
      [id, authorId]
    );

    if (result.rows.length > 0) {
      res.json({ message: "Event deleted successfully" });
    } else {
      res.status(404).json({ message: "Event not found or not authorized" });
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const eventController = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};

export default eventController;
