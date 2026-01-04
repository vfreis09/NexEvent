import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import * as crypto from "crypto";
import emailServices from "../utils/emailService";
import { isStrongPassword } from "../utils/password";
import oauthConfig from "../config/oauthConfig";

const STATE_COOKIE_NAME = "google_oauth_state";

const pool = require("../config/dbConfig");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET as string | undefined;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not defined. Check your environment variables."
  );
}

const uploadProfilePicture = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { base64Image } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!base64Image || typeof base64Image !== "string") {
    return res
      .status(400)
      .json({ message: "Base64 image data is missing or invalid." });
  }

  if (!base64Image.startsWith("data:image/")) {
    return res.status(400).json({ message: "Invalid image format." });
  }

  try {
    const result = await pool.query(
      `UPDATE users 
         SET profile_picture_base64 = $1 
         WHERE id = $2
         RETURNING profile_picture_base64`,
      [base64Image, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Profile picture uploaded successfully.",
      profilePicture: result.rows[0].profile_picture_base64,
    });
  } catch (error) {
    console.error("Profile picture upload database error:", error);
    res.status(500).json({
      message: "Failed to update profile picture due to a server error.",
    });
  }
};

const signup = async (req: Request, res: Response) => {
  const { email, username, password, wantsNotifications } = req.body;

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        "Password is not strong enough. Must be 8+ chars, include uppercase, lowercase, number, and special character.",
    });
  }

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
  const genericErrorMessage = "Invalid email or password.";
  const genericStatusCode = 401;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(genericStatusCode)
        .json({ message: genericErrorMessage });
    }

    const user = result.rows[0];

    if (!user.password) {
      console.error(`User ID ${user.id} has no password field.`);
      return res
        .status(genericStatusCode)
        .json({ message: genericErrorMessage });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(genericStatusCode)
        .json({ message: genericErrorMessage });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600000,
      })
      .status(200)
      .json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Login attempt error:", error);
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

    const { rows } = await pool.query(
      `SELECT 
         id, 
         username, 
         email, 
         bio, 
         role, 
         contact, 
         is_verified, 
         wants_notifications, 
         theme_preference, 
         created_at, 
         profile_picture_base64,
         oauth_provider
       FROM users
       WHERE id = $1`,
      [userId]
    );

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

  if (!newPassword || typeof newPassword !== "string") {
    return res.status(400).json({ message: "New password is required" });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: "Password too weak" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT password, oauth_provider FROM users WHERE id = $1",
      [userId]
    );

    const dbUser = rows[0];
    const isOAuthUser = !!dbUser.oauth_provider;

    if (!isOAuthUser) {
      if (!oldPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }
      const match = await bcrypt.compare(oldPassword, dbUser.password || "");
      if (!match) {
        return res.status(400).json({ message: "Current password incorrect" });
      }
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users 
       SET password = $1, oauth_provider = NULL, oauth_id = NULL 
       WHERE id = $2`,
      [hash, userId]
    );

    return res.json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Server error" });
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
      theme_preference: updatedUser.theme_preference,
      profile_picture_base64: updatedUser.profile_picture_base64,
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
    await emailServices.sendVerificationEmail(user.email, user.id.toString());
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

const updateThemePreference = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { theme_preference } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (theme_preference !== "light" && theme_preference !== "dark") {
    return res.status(400).json({
      message: "Invalid theme preference value. Must be 'light' or 'dark'.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET theme_preference = $1 WHERE id = $2 RETURNING theme_preference`,
      [theme_preference, userId]
    );

    if (result.rowCount > 0) {
      res.json({
        message: "Theme preference updated.",
        theme_preference: result.rows[0].theme_preference,
      });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error("Error updating theme preference:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPublicUserByUsername = async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT
          username,
          email,
          profile_picture_base64,
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
    res.json(user);
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
  const { userId, token, password } = req.body;

  if (!userId || !token || !password) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        "Password is not strong enough. Must be 8+ chars, include uppercase, lowercase, number, and special character.",
    });
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

const googleOAuthCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const storedState = req.cookies[STATE_COOKIE_NAME];

  if (!code) {
    return res
      .status(400)
      .redirect("http://localhost:5173/login?error=missing_code");
  }

  if (!storedState || state !== storedState) {
    console.error("CSRF attack detected: State mismatch.");
    res.clearCookie(STATE_COOKIE_NAME);

    return res.redirect("http://localhost:5173/login?error=csrf");
  }
  res.clearCookie(STATE_COOKIE_NAME);

  try {
    const params = new URLSearchParams();
    params.append("code", code as string);
    params.append("client_id", oauthConfig.CLIENT_ID);
    params.append("client_secret", oauthConfig.CLIENT_SECRET);
    params.append("redirect_uri", oauthConfig.REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    const tokenResponse = await fetch(oauthConfig.TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(
        `Token exchange failed with status: ${tokenResponse.status}`
      );
    }
    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    const userInfoResponse = await fetch(oauthConfig.USER_INFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const { email, name, picture, sub } = userInfo;
    const googleId = sub;
    let userId;

    let userResult = await pool.query(
      "SELECT id, username FROM users WHERE oauth_id = $1 AND oauth_provider = 'google'",
      [googleId]
    );

    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        "SELECT id, username FROM users WHERE email = $1",
        [email]
      );
    }

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;

      await pool.query(
        `UPDATE users 
         SET profile_picture_base64 = $1, 
             is_verified = TRUE,
             oauth_provider = $2, 
             oauth_id = $3
         WHERE id = $4`,
        [picture, "google", googleId, userId]
      );
    } else {
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      let username = name;

      const newUserResult = await pool.query(
        `INSERT INTO users (email, password, username, is_verified, profile_picture_base64, oauth_provider, oauth_id) 
         VALUES ($1, $2, $3, TRUE, $4, $5, $6) RETURNING id`,
        [email, hashedPassword, username, picture, "google", googleId]
      );
      userId = newUserResult.rows[0].id;
    }

    const token = jwt.sign({ id: userId, email }, jwtSecret, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600000,
      })
      .redirect("http://localhost:5173/");
  } catch (error) {
    console.error("Google OAuth failed:", (error as any).message || error);
    res.redirect("http://localhost:5173/login?error=oauth_failed");
  }
};

const getAllTags = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM tags ORDER BY name ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ message: "Error fetching tags" });
  }
};

const getUserSettings = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const userResult = await pool.query(
      "SELECT digest_frequency FROM users WHERE id = $1",
      [userId]
    );

    const tagsResult = await pool.query(
      `SELECT t.id, t.name FROM tags t 
       JOIN user_preferences up ON t.id = up.tag_id 
       WHERE up.user_id = $1`,
      [userId]
    );

    res.status(200).json({
      digest_frequency: userResult.rows[0]?.digest_frequency || "daily",
      selected_tags: tagsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching user settings:", err);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

const updateUserSettings = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { digest_frequency, tagIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("UPDATE users SET digest_frequency = $1 WHERE id = $2", [
      digest_frequency,
      userId,
    ]);

    await client.query("DELETE FROM user_preferences WHERE user_id = $1", [
      userId,
    ]);

    if (tagIds && tagIds.length > 0) {
      const values = tagIds.map((id: number) => `(${userId}, ${id})`).join(",");
      await client.query(
        `INSERT INTO user_preferences (user_id, tag_id) VALUES ${values}`
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Preferences updated successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction error updating settings:", err);
    res.status(500).json({ message: "Failed to update preferences." });
  } finally {
    client.release();
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
  updateThemePreference,
  getPublicUserByUsername,
  sendResetLink,
  resetForgottenPassword,
  uploadProfilePicture,
  googleOAuthCallback,
  getAllTags,
  getUserSettings,
  updateUserSettings,
};

export default userController;
