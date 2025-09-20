import { Request, Response, NextFunction } from "express";

const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Admins only" });
};

export default authorizeAdmin;
