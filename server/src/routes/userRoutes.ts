import { Router } from "express";
import userController from "../controllers/userController";
import eventController from "../controllers/eventController";
import rsvpController from "../controllers/rsvpController";
import authenticateUser from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", authenticateUser, userController.logout);

router.get("/user", authenticateUser, userController.getUser);

router.put(
  "/user/change-password",
  authenticateUser,
  userController.changePassword
);

router.post("/user/forgot-password", userController.sendResetLink);
router.post("/user/reset-password", userController.resetForgottenPassword);

router.put(
  "/user/settings",
  authenticateUser,
  userController.updateNotificationSettings
);

router.post(
  "/send-verification-email",
  authenticateUser,
  userController.requestVerificationEmail
);

router.get("/verify-email", userController.verifyEmail);

router.get("/user/:username/events", eventController.getEventsByAuthor);
router.get("/user/:username/rsvps", rsvpController.getAcceptedRsvpsByUser);
router.get("/user/:username", userController.getPublicUserByUsername);

router.put("/user/:id", authenticateUser, userController.updateUser);

export default router;
