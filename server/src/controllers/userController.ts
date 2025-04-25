import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
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
  const { email, password, wantsNotifications } = req.body;

  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password, wants_notifications) VALUES ($1, $2, $3) RETURNING id, email`,
      [email, hashedPassword, wantsNotifications]
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

const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email",
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    res
      .status(200)
      .json({ message: "Password reset successful", email: user.email });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name, bio, contact } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET email = $1, name = $2, bio = $3, contact = $4 WHERE id = $5 RETURNING *",
      [email, name, bio, contact, id]
    );

    const updatedUser = result.rows[0];

    res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
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

const userController = {
  signup,
  login,
  getUser,
  logout,
  resetPassword,
  updateUser,
  verifyEmail,
  requestVerificationEmail,
  updateNotificationSettings,
};

export default userController;
