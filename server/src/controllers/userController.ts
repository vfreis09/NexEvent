import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import * as crypto from "crypto";
import emailServices from "../utils/emailService";

const pool = require("../config/dbConfig");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET as string | undefined;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not defined. Check your environment variables."
  );
}

const signup = async (req: Request, res: Response) => {
  const { email, username, password, wantsNotifications } = req.body;

  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password, username, wants_notifications) VALUES ($1, $2, $3, $4) RETURNING id, email, username`,
      [email, hashedPassword, username, wantsNotifications]
    );

    const user = result.rows[0];
    await emailServices.sendVerificationEmail(user.email, user.id);

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 3600000,
      })
      .status(201)
      .json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.log("Error in signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(500).json({ message: "Password field is missing" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 3600000,
      })
      .status(200)
      .json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUser = async (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.json({ isLoggedIn: false, user: null });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const userId = decoded.id;

    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (rows.length > 0) {
      return res.json({ isLoggedIn: true, user: rows[0] });
    } else {
      return res.json({ isLoggedIn: false, user: null });
    }
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.json({ isLoggedIn: false, user: null });
  }
};

const logout = async (req: Request, res: Response) => {
  res
    .clearCookie("token")
    .status(200)
    .json({ message: "Logged out successfully" });
};

const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both current and new password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const storedHash = result.rows[0].password;

    const isMatch = await bcrypt.compare(oldPassword, storedHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, username, bio, contact } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET email = $1, username = $2, bio = $3, contact = $4 WHERE id = $5 RETURNING *",
      [email, username, bio, contact, id]
    );

    const updatedUser = result.rows[0];

    res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      bio: updatedUser.bio,
      contact: updatedUser.contact,
      wants_notifications: updatedUser.wants_notifications,
      is_verified: updatedUser.is_verified,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token as string, jwtSecret) as {
      userId: string;
    };
    const userId = decoded.userId;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      return res.status(200).json({ message: "Email already verified." });
    }

    await pool.query("UPDATE users SET is_verified = true WHERE id = $1", [
      userId,
    ]);

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};

const requestVerificationEmail = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user || !user.email || !user.id) {
    return res.status(400).json({ message: "User not authenticated properly" });
  }

  try {
    await emailServices.sendVerificationEmail(user.email, user.id);
    return res
      .status(200)
      .json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return res
      .status(500)
      .json({ message: "Failed to send verification email" });
  }
};

const updateNotificationSettings = async (req: Request, res: Response) => {
  const user = req.user;
  const { wants_notifications } = req.body;

  if (!user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (typeof wants_notifications !== "boolean") {
    return res
      .status(400)
      .json({ message: "`wants_notifications` must be a boolean" });
  }

  try {
    await pool.query(
      "UPDATE users SET wants_notifications = $1 WHERE id = $2",
      [wants_notifications, user.id]
    );
    return res.json({ message: "Notification settings updated." });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPublicUserByUsername = async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        username,
        email,
        COALESCE(created_at, CURRENT_TIMESTAMP) AS created_at,
        (SELECT COUNT(*) FROM events WHERE author_id = users.id) AS total_created_events,
        (
          SELECT COUNT(*) 
          FROM rsvps 
          WHERE rsvps.user_id = users.id 
            AND LOWER(rsvps.status) = 'accepted'
        ) AS total_accepted_rsvps
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user by username:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendResetLink = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    const genericResponse = {
      message: "If this email exists, a reset link has been sent",
    };

    if (result.rowCount === 0) {
      return res.status(200).json(genericResponse);
    }

    const userId = result.rows[0].id;

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE users 
       SET reset_token_hash = $1, reset_token_expires = $2
       WHERE id = $3`,
      [hashedToken, expires, userId]
    );

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&id=${userId}`;
    const message = `
      <p>We received a request to reset your password.</p>
      <p>Click below to reset your password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `;

    await emailServices.sendEmail(email, "Password Reset Request", message);

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Error sending reset link:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetForgottenPassword = async (req: Request, res: Response) => {
  console.log("Reset password request body:", req.body);
  const { userId, token, password } = req.body;

  if (!userId || !token || !password) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const result = await pool.query(
      `SELECT id FROM users 
       WHERE id = $1 
         AND reset_token_hash = $2 
         AND reset_token_expires > NOW()`,
      [userId, tokenHash]
    );

    if (result.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users 
       SET password = $1, 
           reset_token_hash = NULL, 
           reset_token_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const userController = {
  signup,
  login,
  getUser,
  logout,
  changePassword,
  updateUser,
  verifyEmail,
  requestVerificationEmail,
  updateNotificationSettings,
  getPublicUserByUsername,
  sendResetLink,
  resetForgottenPassword,
};

export default userController;
