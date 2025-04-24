// Import dependencies
import { Router } from "express";
import {
  loginUser,
  logoutUser,
  profileUser,
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

// Export router
export default router;
