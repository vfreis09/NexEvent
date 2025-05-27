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

const markNotificationAsRead = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const notificationId = parseInt(req.params.id);

  if (!userId || isNaN(notificationId)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res.status(500).json({ message: "Failed to update notification" });
  }
};

export default {
  getNotifications,
  markNotificationAsRead,
};
