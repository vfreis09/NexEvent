import { Router } from "express";
import userController from "../controllers/userController";
import eventController from "../controllers/eventController";
import authenticateUser, {
  optionalAuthenticateUser,
} from "../middlewares/authMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";
import resetLinkLimiter from "../middlewares/resetLinkLimiter";

const router = Router();

// --- Auth ---
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", authenticateUser, userController.logout);

// --- Google OAuth (must be before /user/:username) ---
router.get("/user/google/login", userController.googleOAuthInitiate);
router.get("/user/google/callback", userController.googleOAuthCallback);

// --- User (exact routes before parameterized) ---
router.get("/user", authenticateUser, userController.getUser);
router.post(
  "/user/profile/upload",
  authenticateUser,
  checkBannedUser,
  userController.uploadProfilePicture,
);

// ⚠️ These MUST come before PUT /user/:id, or Express will match :id = "change-password" etc.
router.put(
  "/user/change-password",
  authenticateUser,
  checkBannedUser,
  userController.changePassword,
);

// --- User settings (specific paths before /:id and /:username) ---
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

// --- Password reset (no auth needed) ---
router.post(
  "/user/forgot-password",
  resetLinkLimiter,
  userController.sendResetLink,
);
router.post("/user/reset-password", userController.resetForgottenPassword);

// --- Email verification ---
router.post(
  "/send-verification-email",
  authenticateUser,
  checkBannedUser,
  userController.requestVerificationEmail,
);
router.get("/verify-email", userController.verifyEmail);

// --- Tags ---
router.get("/tags", userController.getAllTags);

// --- Parameterized routes LAST ---
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
