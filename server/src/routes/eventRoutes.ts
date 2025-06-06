import { Router } from "express";
import eventController from "../controllers/eventController";
import rsvpController from "../controllers/rsvpController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";

const router = Router();

router.post(
  "/events",
  authenticateUser,
  requireVerifiedUser,
  eventController.createEvent
);
router.get("/events", eventController.getEvents);
router.get("/events/:id", eventController.getEventById);
router.put(
  "/events/:id",
  authenticateUser,
  requireVerifiedUser,
  eventController.updateEvent
);
router.delete(
  "/events/:id",
  authenticateUser,
  requireVerifiedUser,
  eventController.deleteEvent
);

router.put(
  "/events/:id/cancel",
  authenticateUser,
  requireVerifiedUser,
  eventController.cancelEvent
);

router.post(
  "/events/:id/rsvp",
  authenticateUser,
  requireVerifiedUser,
  rsvpController.createRsvp
);

export default router;
