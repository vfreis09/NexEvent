import { Request, Response, NextFunction } from "express";

const requireVerifiedUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      message: "Please verify your email to access this resource.",
    });
  }

  next();
};

export default requireVerifiedUser;
