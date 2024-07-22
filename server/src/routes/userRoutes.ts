import { Router } from "express";
import userController from "../controllers/userController";

const router = Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/user", userController.getUser);

export default router;
