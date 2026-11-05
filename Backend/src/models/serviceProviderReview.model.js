import mongoose from "mongoose";

const providerReviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // The customer leaving the review
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceProvider", // The business being reviewed
        required: true
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


providerReviewSchema.index({ provider: 1, reviewer: 1 }, { unique: true });


export const ServiceProviderReview = mongoose.model("ServiceProviderReview", providerReviewSchema);
