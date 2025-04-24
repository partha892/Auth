// Import dependencies
import { Router } from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  profileUser,
  resetPassword,
  signupUser,
  verifyEmail,
} from "../controllers/user.controllers.js";
import { isLogin } from "../middlewares/Isverifyed.js";

// Initialize router
const router = Router();

// Signup route
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/profile", isLogin, profileUser);
router.get("/logout", isLogin, logoutUser);
router.get("/verify/:verificationToken", verifyEmail);
router.get("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

// Export router
export default router;
