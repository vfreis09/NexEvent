import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import path from "path";
const pool = require("../config/dbConfig");

interface JwtPayload {
  id: string;
  email: string;
  isVerified?: boolean;
}

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET as string | undefined;

if (!jwtSecret) {
  throw new Error(
    "jwtSecret is not defined. Check your environment variables."
  );
}

const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    req.user = {
      id: user.id,
      email: user.email,
      isVerified: user.is_verified,
    } as JwtPayload;

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default authenticateUser;
