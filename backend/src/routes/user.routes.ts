import { Router } from "express";
import { 
  createProfile,
  deactivateAccount,
  deleteAccount,
  deleteProfilePicture,
  getAccountActivationCode,
  getAllUsers,
  getCurrentUser,
  getUserById,
  loginUser, 
  logoutUser, 
  registerUser, 
  resendOTP, 
  updatePassword, 
  updateProfilePicture, 
  updateToken, 
  updateUserAccountDetails, 
  updateUserRole, 
  verifyAccountActivationCode, 
  verifyUserAccount 
} from "../controllers/user.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/verify-account").patch(authenticateUser, verifyUserAccount);
router.route("/create-profile").post(
  authenticateUser,
  upload.single("avatar"), 
  createProfile
);
router.route("/resend-otp").post(authenticateUser, resendOTP);
router.route("/login").post(loginUser);
router.route("/logout").post(authenticateUser, logoutUser);
router.route("/update-password").post(authenticateUser, updatePassword);
router.route("/refresh-token").post(authenticateUser, updateToken);
router.route("/get-current-user").get(authenticateUser, getCurrentUser);
router.route("/update-role").patch(authenticateUser, updateUserRole);
router.route("/update-profile-picture").patch(
  authenticateUser,
  upload.single("avatar"),
  updateProfilePicture
);
router.route("/delete-profile-picture").delete(authenticateUser, deleteProfilePicture);
router.route("/update-user-account-details").put(authenticateUser, updateUserAccountDetails);
router.route("/get-user/:id").get(getUserById);
router.route("/get-all-users").get(getAllUsers);
router.route("/get-account-activation-code").post(getAccountActivationCode);
router.route("/verify-account-activation-code").post(verifyAccountActivationCode);
router.route("/deactivate-account").patch(authenticateUser, deactivateAccount);
router.route("/delete-account").delete(authenticateUser, deleteAccount);

export default router;