import { Router } from "express";
import inviteController from "../controllers/inviteController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";

const router = Router();

router.post(
  "/events/:id/invite",
  authenticateUser,
  requireVerifiedUser,
  inviteController.sendInvite
);
router.get(
  "/events/:id/invites",
  authenticateUser,
  requireVerifiedUser,
  inviteController.getInvitesForEvents
);
router.patch(
  "/invites/:inviteId/respond",
  authenticateUser,
  requireVerifiedUser,
  inviteController.respondToInvite
);

export default router;
