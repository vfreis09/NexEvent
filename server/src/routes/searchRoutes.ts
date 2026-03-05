import { Router } from "express";
import searchController from "../controllers/searchController";
import { optionalAuthenticateUser } from "../middlewares/authMiddleware";

const router = Router();

router.get("/search", optionalAuthenticateUser, searchController.unifiedSearch);

export default router;
