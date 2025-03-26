import { Router } from "express";
import userController from "../controllers/userController";
import authenticateUser from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/user", userController.getUser);
router.post("/logout", userController.logout);
router.post("/reset-password", authenticateUser, userController.resetPassword);
router.put("/user/:id", authenticateUser, userController.updateUser);

export default router;
