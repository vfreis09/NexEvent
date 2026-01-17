import { Router } from "express";
import eventController from "../controllers/eventController";
import rsvpController from "../controllers/rsvpController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";

const router = Router();

router.post(
  "/events",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  eventController.createEvent
);
router.get("/events", eventController.getEvents);
router.get("/events/:id", eventController.getEventById);
router.put(
  "/events/:id",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  eventController.updateEvent
);

router.put(
  "/events/:id/cancel",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  eventController.cancelEvent
);

router.post(
  "/events/:id/rsvp",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  rsvpController.createRsvp
);

export default router;
