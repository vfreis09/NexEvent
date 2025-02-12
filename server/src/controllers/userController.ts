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
      req.session.user = { user_id: undefined, id: undefined };
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
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res
        .status(500)
        .json({ message: "Password field is missing for this user" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.user = user;

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

const logout = async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
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

    req.session.user = updatedUser;

    res.status(200).json({ id: updatedUser.id, email: updatedUser.email });
  } catch (error) {
    console.log(error);
  }
};

const userController = {
  signup,
  login,
  getUser,
  logout,
  resetPassword,
  updateUser,
};

export default userController;
