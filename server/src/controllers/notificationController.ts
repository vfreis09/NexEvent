import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT 5;`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export default {
  getNotifications,
};
