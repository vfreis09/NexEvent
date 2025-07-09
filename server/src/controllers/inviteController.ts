import { Request, Response } from "express";
const pool = require("../config/dbConfig");
import emailServices from "../utils/emailService";

const sendInvite = async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.id);
  const { identifier } = req.body;
  const invitedBy = req.user?.id;

  try {
    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({ message: "Identifier is required." });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    const eventCheck = await pool.query(
      "SELECT * FROM events WHERE id = $1 AND author_id = $2",
      [eventId, invitedBy]
    );

    if (eventCheck.rowCount === 0) {
      return res.status(403).json({ message: "You are not the event owner." });
    }

    const event = eventCheck.rows[0];

    const userRes = await pool.query(
      "SELECT id, email FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1",
      [normalizedIdentifier]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const invitedUser = userRes.rows[0];

    if (invitedUser.id === invitedBy) {
      return res.status(400).json({ message: "You cannot invite yourself." });
    }

    const duplicateCheck = await pool.query(
      "SELECT * FROM invites WHERE event_id = $1 AND invited_user_id = $2",
      [eventId, invitedUser.id]
    );

    if (duplicateCheck.rowCount > 0) {
      return res.status(409).json({ message: "User already invited." });
    }

    const inviteInsert = await pool.query(
      "INSERT INTO invites (event_id, invited_user_id, invited_by) VALUES ($1, $2, $3) RETURNING id",
      [eventId, invitedUser.id, invitedBy]
    );
    const inviteId = inviteInsert.rows[0].id;

    const inviterRes = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [invitedBy]
    );
    const inviterUsername = inviterRes.rows[0]?.username || "someone";

    const notificationMessage = `You’ve been invited to "${event.title}" by ${inviterUsername}.`;

    await pool.query(
      "INSERT INTO notifications (user_id, event_id, invite_id, message) VALUES ($1, $2, $3, $4)",
      [invitedUser.id, eventId, inviteId, notificationMessage]
    );

    await emailServices.sendInviteEmail(
      invitedUser.email,
      event.title,
      eventId
    );

    return res.status(201).json({ message: "User invited successfully." });
  } catch (err) {
    console.error("Error sending invite:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getInvitesForEvents = async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.id);
  const requesterId = req.user?.id;

  try {
    const eventRes = await pool.query(
      "SELECT * FROM events WHERE id = $1 AND author_id = $2",
      [eventId, requesterId]
    );

    if (eventRes.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view invites for this event." });
    }

    const invitesRes = await pool.query(
      `
      SELECT invites.id, users.username, invites.status, invites.created_at
      FROM invites
      JOIN users ON users.id = invites.invited_user_id
      WHERE invites.event_id = $1
      ORDER BY invites.created_at DESC
      `,
      [eventId]
    );

    return res.status(200).json(invitesRes.rows);
  } catch (err) {
    console.error("Error fetching invites:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const respondToInvite = async (req: Request, res: Response) => {
  const inviteId = parseInt(req.params.inviteId);
  const rawStatus = req.body.status;
  const userId = req.user?.id;

  if (!userId || isNaN(inviteId)) {
    return res.status(400).json({ message: "Invalid request." });
  }

  const normalizedStatus = rawStatus?.toLowerCase();
  const validStatuses = ["accepted", "declined"];
  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  try {
    const inviteRes = await pool.query(
      "SELECT * FROM invites WHERE id = $1 AND invited_user_id = $2",
      [inviteId, userId]
    );

    if (inviteRes.rowCount === 0) {
      return res.status(404).json({ message: "Invite not found." });
    }

    const invite = inviteRes.rows[0];

    if (normalizedStatus === "accepted") {
      await pool.query("UPDATE invites SET status = $1 WHERE id = $2", [
        normalizedStatus,
        inviteId,
      ]);
    } else {
      await pool.query("UPDATE invites SET status = NULL WHERE id = $1", [
        inviteId,
      ]);
    }

    const [eventRes, userRes] = await Promise.all([
      pool.query("SELECT title, author_id FROM events WHERE id = $1", [
        invite.event_id,
      ]),
      pool.query("SELECT username FROM users WHERE id = $1", [userId]),
    ]);

    const event = eventRes.rows[0];
    const username = userRes.rows[0]?.username || "A user";

    const creatorMessage = `${username} has ${normalizedStatus} your invite for "${event.title}".`;

    await pool.query(
      "INSERT INTO notifications (user_id, event_id, message) VALUES ($1, $2, $3)",
      [event.author_id, invite.event_id, creatorMessage]
    );

    return res.status(200).json({ message: `Invite ${normalizedStatus}.` });
  } catch (err) {
    console.error("Error responding to invite:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const inviteController = {
  sendInvite,
  getInvitesForEvents,
  respondToInvite,
};

export default inviteController;
