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
    res.status(201).json(result.rows[0]);
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

    console.log(password, user.password);

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    // If the password does not match, return an error
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If the password matches, respond with user details (excluding the password)
    res.status(200).json({ email: user.email, id: user.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userController = {
  signup,
  login,
};

export default userController;
