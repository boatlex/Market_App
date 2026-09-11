import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { User } from '../models/user.model.js'
import { ENV } from '../config/env.js';
import nodemailer from "nodemailer"; 



export const registerUser = async (req, res) => {
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
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const loginUserClerk = async (req, res) => {
    try {
        const { userId } = getAuth(req)

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized. Missing token." })
        }

        const existingUser = await User.findOne({ clerkId: userId })
        if (existingUser) {
            return res.status(200).json({ user: existingUser, message: "User Already Exists!" })
        }

        const clerkUser = await clerkClient.users.getUser(userId)

        let asignedRole = "user"

        if (ENV.ADMIN_EMAIL === clerkUser.emailAddresses[0]?.emailAddress) {
            asignedRole = "admin"
        }

        const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()

        const userData = {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: fullName || "Anonymous User",
            imageUrl: clerkUser.imageUrl || "",
            addresses: [],
            role: asignedRole,
        }

        // 6. Save the new user record
        const user = await User.create(userData)

        return res.status(201).json({
            user,
            message: "User Created Successfully"
        })

    } catch (error) {
        console.error("Error in syncUser controller:", error)
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

export const loginUserManual = async (req, res) => {
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

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );


    return res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      token, // 👈 Save this token in SecureStore on the mobile side
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}


export const forgotPassword = async (req, res) => {
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

    // 2. Generate a secure, temporary random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // 3. Hash the token before saving to database for security, set expiry to 1 hour
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

    // Create the deep link or web link for your Expo App
    const resetUrl = `market://users/reset-password/${resetToken}`; 

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
    res.status(500).json({ error: error.message });
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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Authorization denied. No token found." });
    }

    const token = authHeader.split(' ')[1];

    // --- CHECK 1: Is it a Manual JWT Token? ---
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User profile not found." });
      }

      req.user = user; // Pass the MongoDB user file to the route handler
      return next();   // Proceed smoothly to the next step

    } catch (jwtError) {
      // If the JWT fails validation, we drop down to verify if it's a Clerk Token
    }

    // --- CHECK 2: Is it a Clerk Token? ---
    // If you pass the Clerk token from frontend using: const token = await getToken()
    // You can parse it or query your database directly using the Clerk internal identifier matching your sync profiles
    const clerkUser = await User.findOne({ clerkId: req.headers['x-clerk-user-id'] || '' });

    if (clerkUser) {
      req.user = clerkUser;
      return next();
    }

    return res.status(401).json({ success: false, message: "Invalid or expired token." });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server auth processing failure." });
  }
};
 

export const sendOTP = async (req, res, next) => {
  const { userId } = req

  const new_otp = OtpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  })

  const otp_expiry_time = Date.now() + 10 * 60 * 1000// 10 min after otp is sent

  const user = await User.findByIdAndUpdate(userId, {
    otp: new_otp,
    otp_expiry_time,
  })
  await user.save({ new: true, validateModifiedOnly: true });

  
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
      text: `Your Now OTP:\n\n
             ${user.name, new_otp}\n\n`,
    };

    await transporter.sendMail(mailOptions);
}


export const verifyOTP = async (req, res, next) => {
  // verify otp and update user accordingly
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP expired",
    });
  }

  if (user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }

  if (otp !== user.otp) {
    return res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });

    
  }

  // OTP is correct

  user.verified = true;
  user.otp = undefined;
  await user.save({ new: true, validateModifiedOnly: true });
  
  const token = signToken(user._id);
  console.log(token)
  res.status(200).json({
    status: "success",
    message: "OTP verified Successfully!",
    token,
    user_id: user._id,

  });
}




