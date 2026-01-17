import { Request, Response } from "express";
const pool = require("../config/dbConfig");

const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      `SELECT 
        notifications.*,
        invites.status AS invite_status
      FROM notifications
      LEFT JOIN invites ON notifications.invite_id = invites.id
      WHERE notifications.user_id = $1
        AND (
          notifications.invite_id IS NULL
          OR (notifications.invite_id IS NOT NULL AND notifications.is_read = false)
        )
      ORDER BY notifications.is_read ASC, notifications.created_at DESC
      LIMIT 20;`,
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
    const result = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res.status(500).json({ message: "Failed to update notification" });
  }
};

const markAllAsRead = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).send("Unauthorized");

  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all as read:", err);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
};

export default {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
};
