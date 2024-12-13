import { Router } from "express";
import eventController from "../controllers/eventController";

const router = Router();

router.post("/events", eventController.createEvent);
router.get("/events", eventController.getEvents);
router.get("/events/:id", eventController.getEventById);
router.delete("/events/:id", eventController.deleteEvent);  

export default router;
