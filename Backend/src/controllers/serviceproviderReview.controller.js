import { ServiceProviderReview } from "../models/serviceProviderReview.model.js"; 
import { ServiceProvider } from "../models/serviceprovider.model.js"; 

const updateProviderStats = async (providerId) => {

    const stats = await ServiceProviderReview.aggregate([
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
            averageRating: Math.round(stats[0].avgRating * 10) / 10, 
            totalReviews: stats[0].totalReviews
        });
    } else {
        await ServiceProvider.findByIdAndUpdate(providerId, {
            averageRating: 0,
            totalReviews: 0
        });
    }
};

export const createProviderReview = async (req, res, next) => {
    try {
        const { rating, comment, providerId } = req.body;
        const reviewerId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Please provide a valid rating between 1 and 5 stars." });
        }

        const providerProfile = await ServiceProvider.findById(providerId);
        if (!providerProfile) {
            return res.status(404).json({ message: "Service provider profile not found." });
        }

        if (providerProfile.user.equals(reviewerId)) {
            return res.status(400).json({ message: "You cannot review your own service profile!" });
        }

        // FIXED: Using ServiceProviderReview to query existing documents
        const alreadyReviewed = await ServiceProviderReview.findOne({ provider: providerId, reviewer: reviewerId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: "You have already left a review for this provider." });
        }

        // FIXED: Instantiating correct model reference
        const newReview = new ServiceProviderReview({
            reviewer: reviewerId,
            provider: providerId,
            rating,
            comment
        });

        const savedReview = await newReview.save();

        await updateProviderStats(providerId);

        return res.status(201).json({
            message: "Provider review posted successfully!",
            review: savedReview
        });

    } catch (error) {
        next(error);
    }
};

export const deleteProviderReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const currentUserId = req.user._id;

        // FIXED: Reference changed to ServiceProviderReview
        const review = await ServiceProviderReview.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        if (!review.reviewer.equals(currentUserId)) {
            return res.status(403).json({ message: "Not authorized to delete this review." });
        }

        const providerId = review.provider;

        // FIXED: Reference changed to ServiceProviderReview
        await ServiceProviderReview.findByIdAndDelete(reviewId);

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

        // FIXED: Reference changed to ServiceProviderReview
        const reviews = await ServiceProviderReview.find({ provider: providerId })
            .populate("reviewer", "firstName lastName profilePicture") // Adjusted fields to match your User type attributes
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        // FIXED: Reference changed to ServiceProviderReview
        const totalReviews = await ServiceProviderReview.countDocuments({ provider: providerId });
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


