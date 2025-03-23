import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { 
  acceptFollowRequest,
  blockUser,
  cancelFollowRequest,
  getBlockedUsers,
  getFollowerRequests,
  getFollowingRequests,
  getMyFollowerList,
  getUserFollowerList,
  getUserFollowingList,
  getUserSocialProfile,
  rejectFollowRequest,
  removeFollower,
  sendFollowRequest,
  unblockUser,
  unfollowUser,
} from "../controllers/relation.controller.js";

const router = Router();

// Follow routes

router.route("/send-follow-request").post(authenticateUser, sendFollowRequest);
router.route("/accept-follow-request").post(authenticateUser, acceptFollowRequest);
router.route("/cancel-follow-request").delete(authenticateUser, cancelFollowRequest);
router.route("/reject-follow-request").delete(authenticateUser, rejectFollowRequest);
router.route("/unfollow-user").delete(authenticateUser, unfollowUser);
router.route("/remove-follower").delete(authenticateUser, removeFollower);
router.route("/get-social-profile/:id").get(authenticateUser, getUserSocialProfile);
router.route("/get-my-follower").get(authenticateUser, getMyFollowerList);
router.route("/get-user-follower/:id").get(authenticateUser, getUserFollowerList);
router.route("/get-user-following/:id").get(authenticateUser, getUserFollowingList);
router.route("/get-follower-requests").get(authenticateUser, getFollowerRequests);
router.route("/get-following-requests").get(authenticateUser, getFollowingRequests);
router.route("/block-user").delete(authenticateUser, blockUser);
router.route("/unblock-user").patch(authenticateUser, unblockUser);
router.route("/get-blocked-users").get(authenticateUser, getBlockedUsers);

export default router;