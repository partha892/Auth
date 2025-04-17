// Import core dependencies
import cookieParser from "cookie-parser";
import express from "express";

// Import routers
import userRouter from "./src/routers/user.routers.js";

// Create Express app
const app = express();

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Routes
app.use("/api/v1/user", userRouter);

// 4. Optional: Base route for testing
app.get("/", (req, res) => {
  res.send("✅ API is working!");
});

export default app;
