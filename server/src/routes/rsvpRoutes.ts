import { Router } from "express";
import rsvpController from "../controllers/rsvpController";
import authenticateUser, {
  optionalAuthenticateUser,
} from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";

const router = Router();

router.get(
  "/rsvps/user/:username",
  optionalAuthenticateUser,
  checkBannedUser,
  rsvpController.getEventsRsvpedByUser,
);

router.post(
  "/rsvps/events/:id",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  rsvpController.createRsvp,
);

router.get(
  "/rsvps/events/:id/rsvps",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  rsvpController.getRsvps,
);

router.get(
  "/rsvps/events/:id/rsvp",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  rsvpController.getSingleRsvp,
);

export default router;
