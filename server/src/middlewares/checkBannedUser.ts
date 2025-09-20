import { Request, Response, NextFunction } from "express";

const checkBannedUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === "banned") {
    return res.status(403).json({ message: "Your account has been banned." });
  }
  next();
};

export default checkBannedUser;
