import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  deletePost,
  editPostDetails,
  editPostImages,
  getAllPosts,
  getSinglePost,
  restorePost,

} from "../controllers/post.controller.js";

const router = Router();

router.route("/create-post").post(
  authenticateUser,
  upload.array("postImages", 10),
  createPost
);
router.route("/get-all-post").get(authenticateUser, getAllPosts);
router.route("/get-post/:id").get(authenticateUser, getSinglePost);
router.route("/update-post-details/:id").patch(authenticateUser, editPostDetails);
router.route("/update-post-images/:id").patch(
  authenticateUser,
  upload.array("postImages", 10),
  editPostImages
);
router.route("/delete-post/:id").delete(authenticateUser, deletePost);
router.route("/restore-post/:id").patch(authenticateUser, restorePost);


export default router;