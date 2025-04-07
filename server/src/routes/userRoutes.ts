import { Router } from "express";
import userController from "../controllers/userController";
import authenticateUser from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/user", authenticateUser, userController.getUser);
router.post("/logout", authenticateUser, userController.logout);
router.post("/reset-password", authenticateUser, userController.resetPassword);
router.put("/user/:id", authenticateUser, userController.updateUser);

router.post(
  "/send-verification-email",
  authenticateUser,
  userController.requestVerificationEmail
);
router.get("/verify-email", userController.verifyEmail);

export default router;
