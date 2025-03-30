import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { createComment, deleteComment, editComment, getPostComments, getSingleComment } from "../controllers/comment.controller.js";

const router = Router();

router.route("/add-comment").post(authenticateUser, createComment);
router.route("/get-post-comments/:id").get(authenticateUser, getPostComments);
router.route("/get-single-comment/:id").get(authenticateUser, getSingleComment);
router.route("/update-comment").post(authenticateUser, editComment);
router.route("/delete-comment/:id").delete(authenticateUser, deleteComment);

export default router;