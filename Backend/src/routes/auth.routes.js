import express from "express"
import rateLimit from "express-rate-limit";

import {loginUserClerk,
     registerUser,
      loginUserManual,
       forgotPassword,
        resetPassword,
        sendOTP,
        verifyOTP,
} from "../controllers/auth.controller.js"



const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: { success: false, message: "Too many OTP requests. Please try again later." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: "Too many login attempts. Please try again later." }
});

const router = express.Router()

router.post("/register", registerUser )
router.post("/login-clerk", loginLimiter, loginUserClerk )
router.post("/login-manual", loginLimiter, loginUserManual )

router.post("/forgot-password", forgotPassword )
router.post("/reset-password", resetPassword )

router.post("/send-otp", otpLimiter, sendOTP )

router.post("/verify-otp", verifyOTP )

export default router