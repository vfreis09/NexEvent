import { Router } from "express";
import userController from "../controllers/userController";
import eventController from "../controllers/eventController";
import authenticateUser from "../middlewares/authMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", authenticateUser, userController.logout);
router.get("/user/google/callback", userController.googleOAuthCallback);

router.get("/user", authenticateUser, userController.getUser);

router.post(
  "/user/profile/upload",
  authenticateUser,
  checkBannedUser,
  userController.uploadProfilePicture
);

router.put(
  "/user/:id",
  authenticateUser,
  checkBannedUser,
  userController.updateUser
);

router.get("/user/:username", userController.getPublicUserByUsername);
router.get("/user/:username/events", eventController.getEventsByAuthor);

router.put(
  "/user/change-password",
  authenticateUser,
  checkBannedUser,
  userController.changePassword
);

router.post(
  "/user/forgot-password",
  checkBannedUser,
  userController.sendResetLink
);

router.post(
  "/user/reset-password",
  checkBannedUser,
  userController.resetForgottenPassword
);

router.post(
  "/send-verification-email",
  authenticateUser,
  checkBannedUser,
  userController.requestVerificationEmail
);

router.get("/verify-email", checkBannedUser, userController.verifyEmail);

router.get("/tags", userController.getAllTags);

router.get(
  "/user/settings/all",
  authenticateUser,
  checkBannedUser,
  userController.getUserSettings
);

router.patch(
  "/user/settings/update",
  authenticateUser,
  checkBannedUser,
  userController.updateUserSettings
);

router.put(
  "/user/settings/notifications",
  authenticateUser,
  checkBannedUser,
  userController.updateNotificationSettings
);

router.put(
  "/user/settings/theme",
  authenticateUser,
  checkBannedUser,
  userController.updateThemePreference
);

export default router;
