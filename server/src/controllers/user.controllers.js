import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../Models/user.models.js";

export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 400,
        error: true,
        message: "Name, email, and password are required.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 409,
        error: true,
        message: "User already exists with this email.",
      });
    }

    // Generate verification token
    const verificationToken = await crypto.randomBytes(32).toString("hex");

    // Create user
    const newUser = new User({
      name,
      email,
      password,
      verificationToken,
      isVerified: false,
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
           style="display: inline-block; padding: 10px 20px; background-color:rgb(175, 173, 76); color: white; text-decoration: none; border-radius: 5px;">
           Verify Email
        </a>
        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
        <code>${verificationURL}</code>
      `,
    });

    console.log("Verification email sent:", info.messageId);

    // Respond with success
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
    const { verificationToken } = req.params;

    if (!verificationToken) {
      return res.status(400).json({
        error: true,
        message: "Token not found.",
      });
    }

    const findUser = await User.findOne({ verificationToken });

    if (!findUser) {
      return res.status(400).json({
        error: true,
        message: "Invalid or expired verification token.",
      });
    }

    findUser.verificationToken = undefined;
    findUser.isVerified = true;
    await findUser.save();

    return res.status(200).json({
      error: false,
      message: "Verification successful.",
    });
  } catch (error) {
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Email and password are required.",
      });
    }

    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.status(400).json({
        error: true,
        message: "You are not registered.",
      });
    }

    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials. Please try again.",
      });
    }

    const token = jwt.sign({ userId: findUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie("token", token, cookieOptions);

    if (!findUser.isVerified) {
      return res.status(401).json({
        error: true,
        message: "Check your email and verify your account.",
      });
    }

    return res.status(200).json({
      message: "Login successful.",
      token,
      data: {
        id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        role: findUser.role,
      },
    });
  } catch (error) {
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
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "You are not a registered user.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Your profile data.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
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
    res.cookie("token", "", {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "User not found. Please register first.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.forgotpasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    const resetLink = `http://localhost:${process.env.PORT}/api/v1/user/reset/${rawToken}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.MAILTRAP_SENDERMAIL,
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <p>Hello <b>${user.name}</b>,</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 10px 20px; background-color:#333; color: white; text-decoration: none; border-radius: 5px;">
           Reset Password
        </a>
        <p>${resetLink}</p>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: true,
        message: "Token and password are required.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      forgotpasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid or expired password reset token.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.forgotpasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
};
