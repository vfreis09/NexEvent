import { Router } from "express";
import eventController from "../controllers/eventController";

const router = Router();

router.post("/events", eventController.createEvent);
router.get("/events", eventController.getEvents);

export default router;
