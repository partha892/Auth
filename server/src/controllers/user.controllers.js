import { User } from "../Models/user.models.js"; 
import crypto from "crypto";
import nodemailer from "nodemailer";

export const signupUser = async (req, res) => {
  try {const { name, email, password } = req.body;

  //  Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      status: 400,
      error: true,
      message: "Name, email, and password are required.",
    });
  }

  //  Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      status: 409,
      error: true,
      message: "User already exists with this email.",
    });
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  //  Create user
  const newUser = new User({
    name,
    email,
    password,
    verificationToken,
    isVerified: false
  });

  await newUser.save();

  // Send email verification
const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: process.env.MAILTRAP_PORT,
  secure: false, // Use true if you switch to a service like Gmail with port 465
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

const verificationURL = `http://localhost:${process.env.PORT}/api/v1/user/verify/${newUser.verificationToken}`;

const info = await transporter.sendMail({
  from: process.env.MAILTRAP_SENDERMAIL,
  to: newUser.email,
  subject: `Hello ${newUser.name}, verify your email`,
  text: `Your email verification token is: ${newUser.verificationToken}\nVerify here: ${verificationURL}`,
  html: `
    <p>Hello <b>${newUser.name}</b>,</p>
    <p>Click the button below to verify your email:</p>
    <a href="${verificationURL}" 
       style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
       Verify Email
    </a>
    <p>If the button doesn't work, copy and paste the following link into your browser:</p>
    <code>${verificationURL}</code>
  `,
});

console.log("Verification email sent:", info.messageId);

  //  Respond with success
  return res.status(201).json({
    status: 201,
    error: false,
    message: "User registered successfully. Please verify your email.",
    data: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isVerified: newUser.isVerified,
      verificationToken: newUser.verificationToken, 
    },
  });

  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

export const profileUser = async (req, res) => {
  try {
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).json({
      status: 500,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};
