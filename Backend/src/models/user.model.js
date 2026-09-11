import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    label: { type: String, required: true },
    fullName: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, default: "" },
    phoneNumber: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
    name: {
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

    imageUrl: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        index: true
    },
    addresses: [addressSchema],
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);

