import { Router } from "express";
import inviteController from "../controllers/inviteController";
import authenticateUser from "../middlewares/authMiddleware";
import requireVerifiedUser from "../middlewares/verifyEmailMiddleware";
import checkBannedUser from "../middlewares/checkBannedUser";

const router = Router();

router.post(
  "/events/:id/invite",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  inviteController.sendInvite
);
router.get(
  "/events/:id/invites",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  inviteController.getInvitesForEvents
);
router.patch(
  "/invites/:inviteId/respond",
  authenticateUser,
  requireVerifiedUser,
  checkBannedUser,
  inviteController.respondToInvite
);

export default router;
