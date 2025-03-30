import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { getPostLikes, toggleCommentLike, togglePostLike } from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle-post-like/:id").post(authenticateUser, togglePostLike);
router.route("/get-post-likes/:id").get(authenticateUser, getPostLikes);
router.route("/toggle-comment-like/:id").post(authenticateUser, toggleCommentLike);

export default router;