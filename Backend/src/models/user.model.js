import mongoose from "mongoose";
import bcrypt from "bcrypt"; // 👈 CRITICAL: This import was missing!

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
        },
        validate: {
            validator: function (value) {
                if (this.clerkId && !value) return true;
                
               return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value);
            },
           message: "Password must be at least 8 characters long and contain letters, numbers, and a special character!"
        }
    },
    clerkId: {
        type: String,
        required: function () {
            return !this.password;
        },
        sparse: true 
    },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    verified: { type: Boolean, default: false },
    otp: { type: String },
    otp_expiry_time: { type: Date },
    profilePicture: { type: String, default: "" },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        index: true
    },
    wishList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ],
}, { timestamps: true });


userSchema.pre('save', async function () {
    
    if (!this.isModified('password') || !this.password) {
        return;
    }

    if (!this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
});

export const User = mongoose.model("User", userSchema);
