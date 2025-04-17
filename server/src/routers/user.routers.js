// Import dependencies
import { Router } from "express";
import { signupUser } from "../controllers/user.controllers.js";

// Initialize router
const router = Router();

// Signup route
router.post("/signup", signupUser);

// Export router
export default router;
