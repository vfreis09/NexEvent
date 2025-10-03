import { Router } from "express";
import rsvpController from "../controllers/rsvpController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";

const router = Router();

router.get(
  "/rsvps/user/:username",
  checkBannedUser,
  rsvpController.getEventsUserRsvpedTo
);

router.get(
  "/events/:id/rsvps",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  rsvpController.getRsvps
);

router.get(
  "/events/:id/rsvp",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  rsvpController.getSingleRsvp
);

export default router;
