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
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    // --- MANUAL LOGIN FIELDS ---
    password: {
        type: String,
        required: function () {
            // Only required if there is no Clerk ID
            return !this.clerkId;
        }
    },
    // --- CLERK LOGIN FIELDS ---
    clerkId: {
        type: String,
        required: function () {
            // Only required if there is no manual password
            return !this.password;
        },
        sparse: true // 👈 CRITICAL: Allows multiple manual users to have NO clerkId without crashing
    },
    // Add these two fields inside your userSchema object in your model file:
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
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

