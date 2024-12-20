import { Router } from "express";
import eventController from "../controllers/eventController";

const router = Router();

router.post("/events", eventController.createEvent);
router.get("/events", eventController.getEvents);
router.get("/events/:id", eventController.getEventById);
router.put("/events/:id", eventController.updateEvent);
router.delete("/events/:id", eventController.deleteEvent);

//rsvp

router.post("/events/:id/rsvp", eventController.createRsvp);
router.get("/events/:id/rsvps", eventController.getRsvps);

export default router;
