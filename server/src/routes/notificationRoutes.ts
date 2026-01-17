import { Router } from "express";
import notificationController from "../controllers/notificationController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";

const router = Router();

router.get(
  "/notifications",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  notificationController.getNotifications
);

router.put(
  "/notifications/read-all",
  authenticateUser,
  checkBannedUser,
  notificationController.markAllAsRead
);

router.patch(
  "/notifications/:id/read",
  authenticateUser,
  checkBannedUser,
  notificationController.markNotificationAsRead
);

export default router;
