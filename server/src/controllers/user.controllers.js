import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../Models/user.models.js";
export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
    const verificationToken = await crypto.randomBytes(32).toString("hex");

    //  Create user
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
    //get verificationToken
    const { verificationToken } = req.params;
    //if not verificationToken
    if (!verificationToken) {
      return res.status(400).json({
        error: true,
        message: "token not found",
      });
    }
    //find user base on verificationToken
    const findtoken = await User.findOne({ verificationToken });
    // If no user is found, token is invalid or expired
    if (!findtoken) {
      return res.status(400).json({
        error: true,
        message: "Invalid or expired verification token.",
      });
    }
    //modify the user
    findtoken.verificationToken = undefined;
    findtoken.isVerified = true;
    await findtoken.save();
    //return sucess
    return res.status(200).json({
      error: false,
      message: "verification successful",
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

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        message: "Email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: true,
        message: "Password is required.",
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

    const token = jwt.sign(
      { userId: findUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie("token", token, cookieOption); // ✅ set cookie here

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
        username: findUser.username,
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
        message: "you have not a user in our app",
      });
    }
    return res.status(200).json({
      error: false,
      message: "your profile",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
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

export const logoutUser = async (req, res) => {
  try {
    // Clear the cookie by setting it to an empty string and expiring it immediately
    res.cookie("token", "", {
      httpOnly: true,
      secure: true,
      expires: new Date(0), // Set to Unix epoch time = expired
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
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
