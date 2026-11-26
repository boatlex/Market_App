
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

const generateAndEmailOTP = async (user) => {
  const new_otp = generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  user.otp = new_otp;
  user.otp_expiry_time = Date.now() + 10 * 60 * 1000;
  await user.save({ validateModifiedOnly: true });

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: ENV.EMAIL_USER,
      pass: ENV.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: user.email,
    from: ENV.EMAIL_USER,
    subject: "Market App - Your Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee;">
        <h2 style="color: #333;">Market App Verification</h2>
        <p>Hello ${user.firstName || "User"},</p>
        <p>Your one-time password (OTP) verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #007bff; border-radius: 4px; margin: 20px 0;">
          ${new_otp}
        </div>
        <p style="color: #666; font-size: 12px;">This code expires in 10 minutes.</p>
      </div>
    `,
  });
};


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
        message: "Password must contain letters, numbers, and at least one special character.",
      });
    }

    const cleanEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.verified) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    // Update unverified user via .save() so validation and password hashing hooks run
    if (existingUser && !existingUser.verified) {
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = password;
      await existingUser.save();

      req.userId = existingUser._id;
      return next();
    }

    // Create and save new user before passing to OTP middleware
    const newUser = new User({
      firstName,
      lastName,
      email: cleanEmail,
      password,
    });

    await newUser.save();
    req.userId = newUser._id;
    return next();

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

    const formatUser = (u) => ({
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      profilePicture: u.profilePicture || "",
    });

    // 1. Check if Clerk user already exists
    let user = await User.findOne({ clerkId: userId });
    if (user) {
      return res.status(200).json({
        success: true,
        user: formatUser(user),
        message: "User Already Exists!",
      });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const cleanEmail = (clerkUser.emailAddresses[0]?.emailAddress || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Clerk account has no email address." });
    }

    const isAdmin = ENV.ADMIN_EMAIL === cleanEmail;

    // 2. Link Clerk ID if a manual account with this email already exists
    user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.clerkId = userId;
      user.verified = true;
      user.otp = undefined;
      user.otp_expiry_time = undefined;
      if (!user.profilePicture && clerkUser.imageUrl) {
        user.profilePicture = clerkUser.imageUrl;
      }
      if (isAdmin && user.role !== "admin") {
        user.role = "admin";
      }

      await user.save({ validateModifiedOnly: true });

      return res.status(200).json({
        success: true,
        user: formatUser(user),
        message: "Account linked with Clerk successfully!",
      });
    }

    // 3. Otherwise create a brand-new user
    user = await User.create({
      clerkId: userId,
      email: cleanEmail,
      firstName: clerkUser.firstName || "Anonymous",
      lastName: clerkUser.lastName || "User",
      profilePicture: clerkUser.imageUrl || "",
      role: isAdmin ? "admin" : "user",
      verified: true,
    });

    return res.status(201).json({
      success: true,
      user: formatUser(user),
      message: "User Created Successfully",
    });
  } catch (error) {
    console.error("Error in loginUserClerk controller:", error);
    next(error);
  }
};

export const loginUserManual = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google/Social login. Please sign in via Google or Apple.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // if (!user.verified) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Please verify your email before logging in.",
    //   });
    // }
    if (!user.verified) {
      await generateAndEmailOTP(user);

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: "Email not verified. A new OTP has been sent to your email.",
      });
    }


    let currentRole = user.role;

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
        profilePicture: user.profilePicture || "",
      },
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
    const devIP = "192.168.0.4"; 
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
    user.password = newPassword;
    user.verified =true 
    
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

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        const user = await User.findById(userId).select(
          "-password -otp -resetPasswordToken -resetPasswordExpires"
        );

        if (!user) {
          return res.status(401).json({ success: false, message: "Session invalid. User no longer exists." });
        }

        if (!user.verified) {
          return res.status(403).json({ success: false, message: "Please verify your email to continue." });
        }

        req.user = user;
        return next();
      } catch (jwtError) {
        console.log("Standard JWT verification skipped/failed, checking Clerk auth...");
      }
    }

    const clerkAuth = typeof getAuth === "function" ? getAuth(req) : {};
    const verifiedClerkId = clerkAuth?.userId || req.auth?.userId;

    if (verifiedClerkId) {
      const clerkUser = await User.findOne({ clerkId: verifiedClerkId }).select(
        "-password -otp -resetPasswordToken -resetPasswordExpires"
      );

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

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account profile not found." });
    }

    await generateAndEmailOTP(user);

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

    const user = await User.findOne({ email: email.toLowerCase().trim() });

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

    if (String(otp).trim() !== user.otp) {
      const error = new Error("OTP is incorrect");
      error.status = 400;
      return next(error);
    }

    if (Date.now() > user.otp_expiry_time) {
      const error = new Error("OTP has expired. Please request a new one.");
      error.status = 400;
      return next(error);
    }

    user.verified = true;
    user.otp = undefined;
    user.otp_expiry_time = undefined;

    if (ENV.ADMIN_EMAIL === user.email && user.role !== "admin") {
      user.role = "admin";
    }

    await user.save({ validateModifiedOnly: true });

    const token = signToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password.",
      });
    }

    const strictPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strictPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain letters, numbers, and a special character.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "Your account uses Google/Social login and does not have a local password to change.",
      });
    }

    // Matches loginUserManual's bcrypt comparison
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Pre-save hook hashes this automatically
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    next(error);
  }
};



