import { Request, Response } from "express";
import bcrypt from "bcrypt";
const pool = require("../config/dbConfig");

const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    if (!req.session.user) {
      req.session.user = { email: "", id: undefined };
    }

    req.session.user = user;

    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    console.log(error);
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    // Query the database for the user with the given email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Ensure the user object has a password field
    if (!user.password) {
      return res
        .status(500)
        .json({ message: "Password field is missing for this user" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    // If the password does not match, return an error
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store user info in the session
    req.session.user = user;

    // If the password matches, respond with user details (excluding the password)
    res.status(200).json({ email: user.email, id: user.id });
  } catch (error) {
    console.log(error);
  }
};

const getUser = async (req: Request, res: Response) => {
  if (req.session.user) {
    const { id } = req.session.user;
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (rows.length > 0) {
      res.json({ isLoggedIn: true, user: rows[0] });
    } else {
      res.json({ isLoggedIn: false });
    }
  } else {
    res.json({ isLoggedIn: false });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  try {
    // Generate a salt and hash the new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password in the database
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email",
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Respond with user information
    res
      .status(200)
      .json({ message: "Password reset successful", email: user.email });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userController = {
  signup,
  login,
  getUser,
  resetPassword,
};

export default userController;
