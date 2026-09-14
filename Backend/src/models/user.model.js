import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,

        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address!"
        ]
    },

    password: {
        type: String,
        required: function () {
            return !this.clerkId;
        }
    },

    clerkId: {
        type: String,
        required: function () {
            return !this.password;
        },
        sparse: true // 👈 CRITICAL: Allows multiple manual users to have NO clerkId without crashing
    },

    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    verified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
    otp_expiry_time: {
        type: Date,
    },

    profilePicture: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["seller", "admin"],
        default: "seller",
        index: true
    },

}, { timestamps: true });

export const User = mongoose.model("User", userSchema);

