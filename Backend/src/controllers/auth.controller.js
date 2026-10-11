
import bcrypt from 'bcrypt';
import { generate } from 'otp-generator';
import jwt from "jsonwebtoken";
import crypto from "crypto"; 
import { User } from '../models/user.model.js';
import { clerkClient, getAuth } from "@clerk/express";
import { ENV } from '../config/env.js';
import nodemailer from "nodemailer";


const signToken = (userId, role) =>
  jwt.sign({ userId, role }, ENV.JWT_SECRET, { expiresIn: '7d' });

export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const strictPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strictPasswordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must contain letters, numbers, and at least one special character." 
      });
    }

    const cleanEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    const newUser = new User({
      firstName,
      lastName,
      email: cleanEmail,
      password 
    });

    await newUser.save();
    return res.status(201).json({ success: true, message: "Manual user created successfully!" });

  } catch (error) {
    next(error);
  }
};


export const loginUserClerk = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Missing token." });
    }
    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      return res.status(200).json({ success: true, user: existingUser, message: "User Already Exists!" });
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    let assignedRole = "user";
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";

    if (ENV.ADMIN_EMAIL === userEmail.toLowerCase()) { 
      assignedRole = "admin";
    }

    const userData = {
      clerkId: userId,
      email: userEmail,
      firstName: clerkUser.firstName || "Anonymous", 
      lastName: clerkUser.lastName || "User",       
      profilePicture: clerkUser.imageUrl || "",    
      role: assignedRole,
      verified: true
    };

    const user = await User.create(userData);

    return res.status(201).json({
      success: true,
      user,
      message: "User Created Successfully"
    });

  } catch (error) {
    console.error("Error in syncUser controller:", error);
    next(error);
  }
};

export const loginUserManual = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Ensure email is cleanly formatted
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    
    // Find user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google/Social login. Please sign in via Google or Apple."
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    let currentRole = user.role;
    
    // Safely promote admin without triggering document save race conditions
    if (ENV.ADMIN_EMAIL === cleanEmail && user.role !== "admin") {
      currentRole = "admin";
      await User.updateOne({ _id: user._id }, { $set: { role: "admin" } });
    }

    const token = signToken(user._id, currentRole);
    
    return res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      token, 
      user: {
        id: user._id,
        firstName: user.firstName, 
        lastName: user.lastName,
        email: user.email,
        role: currentRole,
        profilePicture: user.profilePicture || ""
      }
    });

  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1. Guard check to prevent crashes if email is undefined
    if (!email) {
      return res.status(400).json({ success: false, message: "Email field is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with that email address." });
    }

    if (user.clerkId && !user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google/Social login via Clerk. Please manage your account through Clerk."
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail', 
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS, // Reminder: This must be a Google App Password
      },
    });

    // 📱 DEVELOPMENT DEEP LINK METHOD:
    // Uses the local computer IP matching your React Native Axios setup
    const devIP = "10.251.38.151"; 
    const resetUrl = `exp://${devIP}:8081/--/reset-password/${resetToken}`;

    const mailOptions = {
      to: user.email,
      from: ENV.EMAIL_USER,
      subject: 'Market App - Password Reset Request',
      // Using HTML format makes the deep link cleanly clickable inside mobile email clients
      html: `
        <h3>Market App Password Reset</h3>
        <p>You requested a password reset. Tap the link below on your mobile device to open the app:</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
        <p>If the button doesn't work, copy and paste this into your browser: <br/> <code>${resetUrl}</code></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Password reset link sent to your email successfully!" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    next(error);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    if (!token || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const strictPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strictPasswordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must contain letters, numbers, and at least one special character." 
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Password reset token is invalid or has expired." 
      });
    }

    // 5. Update the password
    // Your pre-save hook handles hashing automatically, so pass it plainly!
    user.password = newPassword; 
    
    // Clear out the token fields so they cannot be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: "Password has been reset successfully! You can now log in." 
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    next(error);
  }
};

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);

        const user = await User.findById(decoded.userId); 
        if (!user) {
          return res.status(404).json({ success: false, message: "User profile not found." });
        }

        req.user = user;
        return next();

      } catch (jwtError) {
        console.log("Standard JWT verification skipped/failed, checking Clerk auth...");
      }
    }

    const clerkAuth = typeof getAuth === 'function' ? getAuth(req) : {};
    const verifiedClerkId = clerkAuth?.userId || req.auth?.userId;

    if (verifiedClerkId) {
      const clerkUser = await User.findOne({ clerkId: verifiedClerkId });

      if (clerkUser) {
        req.user = clerkUser;
        return next();
      }
    }

    return res.status(401).json({ success: false, message: "Authentication denied. Invalid or expired session." });

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Server auth processing failure." });
  }
};

export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email field is required." });
    }

    const new_otp = generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });

    const otp_expiry_time = Date.now() + 10 * 60 * 1000; 

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { otp: new_otp, otp_expiry_time },
      { new: true, runValidators: true } 
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User account profile not found." });
    }

    
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: ENV.EMAIL_USER,
      subject: 'Market App - Your New OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee;">
          <h2 style="color: #333;">Market App Verification</h2>
          <p>Hello ${user.firstName || 'User'},</p>
          <p>Your one-time password (OTP) verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #007bff; border-radius: 4px; margin: 20px 0;">
            ${new_otp}
          </div>
          <p style="color: #666; font-size: 12px;">This code is private and will expire in 10 minutes. If you didn't request this code, please secure your account immediately.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "OTP sent successfully!" });

  } catch (error) {
    next(error);
  }
};


export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are both required fields." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const error = new Error("Account with this email does not exist");
      error.status = 404;
      return next(error);
    }

    if (user.verified) {
      const error = new Error("Email is already verified");
      error.status = 400;
      return next(error);
    }

    if (otp !== user.otp) {
      const error = new Error("OTP is incorrect");
      error.status = 400;
      return next(error);
    }

    if (Date.now() > user.otp_expiry_time) {
      const error = new Error("OTP has expired. Please request a new one.");
      error.status = 400;
      return next(error);
    }

    // Clear verification fields safely out of database space upon success
    user.verified = true;
    user.otp = undefined;
    user.otp_expiry_time = undefined;

    await user.save({ validateModifiedOnly: true });

    const token = signToken(user._id, user.role);

    return res.status(200).json({
      success: true, // Standardized object keys formatting parameter layout
      message: "OTP verified successfully!",
      token,
      userId: user._id,
    });

  } catch (error) {
    next(error);
  }
};


