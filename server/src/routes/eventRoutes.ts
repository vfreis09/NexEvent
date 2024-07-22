import { Router } from "express";
import eventController from "../controllers/eventController";

const router = Router();

router.post("/event", eventController.createEvent);

export default router;
