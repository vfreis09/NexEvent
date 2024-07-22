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

const userController = {
  signup,
};

export default userController;
