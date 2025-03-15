import { Router } from "express";
import { 
  deactivateAccount,
  deleteAccount,
  getAccountActivationCode,
  getAllUsers,
  getCurrentUser,
  getUserById,
  loginUser, 
  logoutUser, 
  registerUser, 
  resendOTP, 
  updatePassword, 
  updateToken, 
  updateUserAccountDetails, 
  updateUserRole, 
  verifyAccountActivationCode, 
  verifyUserAccount 
} from "../controllers/user.controllers.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify-account").post(authenticateUser, verifyUserAccount);
router.route("/resend-otp").post(authenticateUser, resendOTP);
router.route("/logout").post(authenticateUser, logoutUser);
router.route("/update-password").post(authenticateUser, updatePassword);
router.route("/refresh-token").post(authenticateUser, updateToken);
router.route("/update-role").post(authenticateUser, updateUserRole);
router.route("/get-current-user").get(authenticateUser, getCurrentUser);
router.route("/update-user-account-details").post(authenticateUser, updateUserAccountDetails);
router.route("/get-user/:id").get(getUserById);
router.route("/get-all-users").get(getAllUsers);
router.route("/get-account-activation-code").post(getAccountActivationCode);
router.route("/verify-account-activation-code").post(verifyAccountActivationCode);
router.route("/deactivate-account").patch(authenticateUser, deactivateAccount);
router.route("/delete-account").post(authenticateUser, deleteAccount);

export default router;