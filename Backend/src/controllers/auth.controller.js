import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { User } from '../models/user.model.js'
import { clerkClient, getAuth } from "@clerk/express"
import { ENV } from '../config/env.js';
import nodemailer from "nodemailer";

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;


    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }


    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }


    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }


    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();
    return res.status(201).json({ success: true, message: "Manual user created successfully!" });

  } catch (error) {
    next(error)
  }
}

export const loginUserClerk = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Missing token." });
    }
    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      return res.status(200).json({ user: existingUser, message: "User Already Exists!" });
    }

    const clerkUser = await clerkClient.users.getUser(userId);


    let assignedRole = "seller"
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";

    if (process.env.ADMIN_EMAIL === userEmail.toLowerCase()) { 
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }


    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google/Social login. Please sign in via Google or Apple."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Credentials." });
    }

    let currentRole = user.role;
    
  
    if (ENV.ADMIN_EMAIL === user.email && user.role !== "admin") {
      user.role = "admin";
      await user.save(); 
      currentRole = "admin";
    }

    const token = signToken(user._id, currentRole);

    
    return res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      token, // Save this token in SecureStore on the mobile device
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email address." });
    }

    if (user.clerkId && !user.password) {
      return res.status(400).json({
        message: "This account uses Google/Social login via Clerk. Please manage your account through Clerk."
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Or your email provider
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const resetUrl = `market://auths/reset-password/${resetToken}`;

    const mailOptions = {
      to: user.email,
      from: ENV.EMAIL_USER,
      subject: 'Market App - Password Reset Request',
      text: `You are receiving this because you requested a password reset.\n\n
             Please use the following link, or open it in your app to complete the process:\n\n
             ${resetUrl}\n\n
             If you did not request this, please ignore this email.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent to your email successfully!" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    next(error)
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;


    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Please fill out all fields." });
    }


    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }


    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token is invalid or has expired." });
    }


    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    return res.status(200).json({ success: true, message: "Your password has been successfully reset!" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}


export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
}


export const sendOTP = async (req, res, next) => {
  try {
    const { userId } = req;

    // 1. Generate a 6-digit OTP
    const new_otp = OtpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });

    const otp_expiry_time = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // 2. Update the user and get the NEW updated data back
    const user = await User.findByIdAndUpdate(
      userId,
      { otp: new_otp, otp_expiry_time },
      { new: true, runValidators: true } // { new: true } gives us the updated user
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      text: `Hello ${user.name},\n\nYour New OTP is: ${new_otp}\n\nIt will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "OTP sent successfully!" });

  } catch (error) {
    next(error);
  }
}



export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;


    const user = await User.findOne({ email });

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

    user.verified = true;
    user.otp = undefined;
    user.otp_expiry_time = undefined;

    await user.save({ validateModifiedOnly: true });


    const token = signToken(user._id, user.role);

    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully!",
      token,
      userId: user._id,
    });

  } catch (error) {
    next(error);
  }
}
