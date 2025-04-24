import { Router } from "express";
import notificationController from "../controllers/notificationController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";

const router = Router();

router.get(
  "/notifications",
  authenticateUser,
  requireVerifiedUser,
  notificationController.getNotifications
);

export default router;
