import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const createEvent = async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }
  const { title, description, eventDateTime } = req.body;
  const authorId = req.session.user.id;
  try {
    const result = await pool.query(
      "INSERT INTO events (title, description, event_datetime, author_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, eventDateTime, authorId]
    );
    res.status(201).json(result.rows[0]);
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
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEventById =  async(req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT * 
       FROM events
       WHERE events.id = $1`,
      [id]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const eventController = {
  createEvent,
  getEvents,
  getEventById,
};

export default eventController;
