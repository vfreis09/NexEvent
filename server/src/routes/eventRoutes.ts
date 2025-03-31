import { Router } from "express";
import eventController from "../controllers/eventController";
import rsvpController from "../controllers/rsvpController";
import authenticateUser from "../middlewares/authMiddleware";

const router = Router();

router.post("/events", authenticateUser, eventController.createEvent);
router.get("/events", eventController.getEvents);
router.get("/events/:id", eventController.getEventById);
router.put("/events/:id", authenticateUser, eventController.updateEvent);
router.delete("/events/:id", authenticateUser, eventController.deleteEvent);

router.post("/events/:id/rsvp", rsvpController.createRsvp);
router.get("/events/:id/rsvps", rsvpController.getRsvps);
router.get("/events/:id/rsvp", rsvpController.getSingleRsvp);

export default router;
