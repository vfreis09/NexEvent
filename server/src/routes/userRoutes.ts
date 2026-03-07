import { Router } from "express";
import userController from "../controllers/userController";
import eventController from "../controllers/eventController";
import authenticateUser, {
  optionalAuthenticateUser,
} from "../middlewares/authMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";
import resetLinkLimiter from "../middlewares/resetLinkLimiter";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", authenticateUser, userController.logout);

router.get("/user/google/login", userController.googleOAuthInitiate);
router.get("/user/google/callback", userController.googleOAuthCallback);

router.get("/user", authenticateUser, userController.getUser);
router.post(
  "/user/profile/upload",
  authenticateUser,
  checkBannedUser,
  userController.uploadProfilePicture,
);

router.put(
  "/user/change-password",
  authenticateUser,
  checkBannedUser,
  userController.changePassword,
);

router.get(
  "/user/settings/all",
  authenticateUser,
  checkBannedUser,
  userController.getUserSettings,
);
router.patch(
  "/user/settings/update",
  authenticateUser,
  checkBannedUser,
  userController.updateUserSettings,
);
router.put(
  "/user/settings/notifications",
  authenticateUser,
  checkBannedUser,
  userController.updateNotificationSettings,
);
router.put(
  "/user/settings/theme",
  authenticateUser,
  checkBannedUser,
  userController.updateThemePreference,
);

router.post(
  "/user/forgot-password",
  resetLinkLimiter,
  userController.sendResetLink,
);
router.post("/user/reset-password", userController.resetForgottenPassword);

router.post(
  "/send-verification-email",
  authenticateUser,
  checkBannedUser,
  userController.requestVerificationEmail,
);
router.get("/verify-email", userController.verifyEmail);

router.get("/tags", userController.getAllTags);

router.put(
  "/user/:id",
  authenticateUser,
  checkBannedUser,
  userController.updateUser,
);
router.get("/user/:username", userController.getPublicUserByUsername);
router.get(
  "/user/:username/events",
  optionalAuthenticateUser,
  eventController.getEventsByAuthor,
);

export default router;
