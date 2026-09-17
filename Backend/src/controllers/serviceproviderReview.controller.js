import { Review } from "../models/review.model.js";
import { ServiceProvider } from "../models/serviceprovider.model.js";

// Helper helper function to automatically update average stars on the provider card
const updateProviderStats = async (providerId) => {
    const stats = await Review.aggregate([
        { $match: { provider: providerId } },
        { 
            $group: { 
                _id: "$provider", 
                totalReviews: { $sum: 1 }, 
                avgRating: { $avg: "$rating" } 
            } 
        }
    ]);

    if (stats.length > 0) {
        await ServiceProvider.findByIdAndUpdate(providerId, {
            averageRating: Math.round(stats[0].avgRating * 10) / 10, // Rounds to 1 decimal place (e.g., 4.3)
            totalReviews: stats[0].totalReviews
        });
    } else {
        // Fallback resetting parameters if zero ratings remain active
        await ServiceProvider.findByIdAndUpdate(providerId, {
            averageRating: 0,
            totalReviews: 0
        });
    }
};


export const createReview = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const { rating, comment } = req.body;
        const reviewerId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Please provide a valid rating between 1 and 5 stars." });
        }

        // Verify the service profile card exists
        const providerProfile = await ServiceProvider.findById(providerId);
        if (!providerProfile) {
            return res.status(404).json({ message: "Service provider profile not found." });
        }

        
        if (providerProfile.user.equals(reviewerId)) {
            return res.status(400).json({ message: "You cannot review your own service profile!" });
        }

        // Check if user already left a review to avoid crashes from duplicate indices
        const alreadyReviewed = await Review.findOne({ provider: providerId, reviewer: reviewerId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: "You have already left a review for this provider." });
        }

        const newReview = new Review({
            reviewer: reviewerId,
            provider: providerId,
            rating,
            comment
        });

        const savedReview = await newReview.save();

        // Trigger background recalculations
        await updateProviderStats(providerId);

        return res.status(201).json({
            message: "Review posted successfully!",
            review: savedReview
        });

    } catch (error) {
        next(error);
    }
};


export const deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const currentUserId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        if (review.reviewer.equals( currentUserId)) {
            return res.status(403).json({ message: "Not authorized to delete this review." });
        }

        const providerId = review.provider;

        await Review.findByIdAndDelete(reviewId);

        // Recalculate score changes after removing data entries
        await updateProviderStats(providerId);

        return res.status(200).json({
            message: "Review removed successfully."
        });

    } catch (error) {
        next(error);
    }
};




export const getProviderReviews = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        
        
        const page = parseInt(req.query.page) || 1;    
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit;

        
        const reviews = await Review.find({ provider: providerId })
            .populate("reviewer", "name profilePicture") 
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

    
        const totalReviews = await Review.countDocuments({ provider: providerId });
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

