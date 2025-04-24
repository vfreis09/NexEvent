import { Router } from "express";
import rsvpController from "../controllers/rsvpController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";

const router = Router();

router.get(
  "/events/:id/rsvps",
  authenticateUser,
  requireVerifiedUser,
  rsvpController.getRsvps
);

router.get(
  "/events/:id/rsvp",
  authenticateUser,
  requireVerifiedUser,
  rsvpController.getSingleRsvp
);

export default router;
