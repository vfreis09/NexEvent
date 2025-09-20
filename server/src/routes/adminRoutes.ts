import { Router } from "express";
import authenticateUser from "../middlewares/authMiddleware";
import authorizeAdmin from "../middlewares/authorizeAdmin";
import adminController from "../controllers/adminController";

const router = Router();

router.get(
  "/admin/users",
  authenticateUser,
  authorizeAdmin,
  adminController.getUsers
);

router.put(
  "/admin/users/:id/role",
  authenticateUser,
  authorizeAdmin,
  adminController.updateUserRole
);

router.get(
  "/admin/stats",
  authenticateUser,
  authorizeAdmin,
  adminController.getStats
);

router.get(
  "/admin/events",
  authenticateUser,
  authorizeAdmin,
  adminController.getEvents
);

router.put(
  "/admin/events/:id",
  authenticateUser,
  authorizeAdmin,
  adminController.updateEvent
);

router.put(
  "/admin/events/:id/cancel",
  authenticateUser,
  authorizeAdmin,
  adminController.cancelEvent
);

router.delete(
  "/admin/events/:id",
  authenticateUser,
  authorizeAdmin,
  adminController.deleteEvent
);

export default router;
