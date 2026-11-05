import { ItemReview } from "../models/ItemReview.model.js";
import mongoose from "mongoose";


const updateItemStats = async (targetId, targetType) => {
    // 1. Get the compiled mongoose model dynamically based on targetType
    const TargetModel = mongoose.model(targetType);
    if (!TargetModel) return;

    
    const stats = await ItemReview.aggregate([
        { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
        {
            $group: {
                _id: "$targetId",
                totalReviews: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }
    ]);

    
    if (stats.length > 0) {
        await TargetModel.findByIdAndUpdate(targetId, {
            averageRating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].totalReviews
        });
    } else {
        await TargetModel.findByIdAndUpdate(targetId, {
            averageRating: 0,
            totalReviews: 0
        });
    }
};

export const createItemReview = async (req, res, next) => {
    try {
        const { rating, comment, targetId, targetType } = req.body;
        const reviewerId = req.user._id;

        // Basic validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Please provide a valid rating between 1 and 5 stars." });
        }

        if (!["Product", "Service", "Job", "JobSeeker"].includes(targetType)) {
            return res.status(400).json({ message: "Invalid target item type provided." });
        }

        // Verify the item exists in its respective collection
        const TargetModel = mongoose.model(targetType);
        const itemExists = await TargetModel.findById(targetId);
        if (!itemExists) {
            return res.status(404).json({ message: `${targetType} item not found.` });
        }

        // Prevent users from reviewing their own items if an owner identity field exists
        // Adjust the 'owner' or 'user' property name depending on how your schemas are built
        const creatorId = itemExists.user || itemExists.owner || itemExists.provider;
        if (creatorId && creatorId.equals(reviewerId)) {
            return res.status(400).json({ message: `You cannot review your own ${targetType.toLowerCase()}!` });
        }

        // Enforce the unique index check manually for a clean error message
        const alreadyReviewed = await ItemReview.findOne({ targetId, reviewer: reviewerId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: `You have already reviewed this ${targetType.toLowerCase()}.` });
        }

        // Create and save item review
        const newReview = new ItemReview({
            reviewer: reviewerId,
            targetType,
            targetId,
            rating,
            comment
        });

        const savedReview = await newReview.save();

        // Recalculate item-level ratings dynamically
        await updateItemStats(targetId, targetType);

        return res.status(201).json({
            message: "Review posted successfully!",
            review: savedReview
        });

    } catch (error) {
        next(error);
    }
};

export const deleteItemReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const currentUserId = req.user._id;

        const review = await ItemReview.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // Authorization check
        if (!review.reviewer.equals(currentUserId)) {
            return res.status(403).json({ message: "Not authorized to delete this review." });
        }

        const { targetId, targetType } = review;

        await ItemReview.findByIdAndDelete(reviewId);

        // Adjust stats downward
        await updateItemStats(targetId, targetType);

        return res.status(200).json({
            message: "Review removed successfully."
        });

    } catch (error) {
        next(error);
    }
};

export const getItemReviews = async (req, res, next) => {
    try {
        const { targetId } = req.params;
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await ItemReview.find({ targetId })
            .populate("reviewer", "name profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalReviews = await ItemReview.countDocuments({ targetId });
        const totalPages = Math.ceil(totalReviews / limit);

        return res.status(200).json({
            currentPage: page,
            totalPages,
            totalReviews,
            reviewsPerPage: reviews.length,
            reviews
        });

    } catch (error) {
        next(error);
    }
};
