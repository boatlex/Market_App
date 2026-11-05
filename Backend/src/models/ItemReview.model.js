import mongoose from "mongoose";

const itemReviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetType: {
        type: String,
        enum: ["Product", "Service", "Job", "JobSeeker"],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "targetType" // Dynamically populates based on targetType
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, { timestamps: true });

// Ensures a user can only leave ONE review per specific item
itemReviewSchema.index({ targetId: 1, reviewer: 1 }, { unique: true });

export const ItemReview = mongoose.model("ItemReview", itemReviewSchema);
