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

// 👇 ADD THIS HOOK HERE
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified or is new
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        // Only hash if it doesn't already look like a bcrypt hash (starts with $2a$ or $2b$)
        if (!this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});


export const User = mongoose.model("User", userSchema);

