import { Router } from "express";
import searchController from "../controllers/searchController";

const router = Router();

router.get("/search", searchController.unifiedSearch);

export default router;
