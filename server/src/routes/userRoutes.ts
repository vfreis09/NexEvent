import { Router } from "express";
import userController from "../controllers/userController";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/user", userController.getUser);
router.post("/reset-password", userController.resetPassword);

export default router;
