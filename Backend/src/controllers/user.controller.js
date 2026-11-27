import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Product } from "../models/product.model.js";
import { ServiceProvider } from "../models/serviceprovider.model.js";
import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";
import filterObj from "../utils/filterObjects.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";


const getCloudinaryPublicId = (url) => {
    if (!url) return null;
    try {
        // Splits URL to isolate the folder and filename without extension
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        const publicIdWithExtension = parts[1].replace(/^v\d+\//, ''); // Removes version tag like v1234567
        return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    } catch (error) {
        console.error("Failed to parse Cloudinary Public ID:", error);
        return null;
    }
};
export const getMe = async (req, res, next) => {
    try {
        res.status(200).json({ 
            status: "success",  
            data: req.user 
        });
    } catch (error) {
        next(error)
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const imageFile = req.file;

        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        const filteredBody = filterObj(
            req.body,
            "firstName",
            "lastName"
        );

        // Upload new avatar to Cloudinary if a file was attached
        if (imageFile) {
            try {
                const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;
                const uploadResponse = await cloudinary.uploader.upload(base64Image, {
                    folder: "user_avatars",
                    resource_type: "image",
                    transformation: [
                        { width: 400, height: 400, crop: "fill", gravity: "face" },
                        { quality: "auto" },
                        { format: "auto" }
                    ]
                });

                filteredBody.profilePicture = uploadResponse.secure_url;

                // Clean up previous Cloudinary avatar if one existed
                if (existingUser.profilePicture) {
                    const oldPublicId = getCloudinaryPublicId(existingUser.profilePicture);
                    if (oldPublicId) {
                        cloudinary.uploader.destroy(oldPublicId)
                            .then(() => console.log(`Old avatar deleted from Cloudinary: ${oldPublicId}`))
                            .catch((err) => console.error("Cloudinary avatar cleanup failed:", err));
                    }
                }
            } catch (uploadError) {
                console.error("Cloudinary avatar upload error:", uploadError);
                return res.status(500).json({
                    status: "fail",
                    message: "Failed to upload profile picture.",
                });
            }
        }

        if (Object.keys(filteredBody).length === 0) {
            return res.status(400).json({
                status: "fail",
                message: "No valid fields provided for update",
            });
        }

        const userDoc = await User.findByIdAndUpdate(
            userId,
            { $set: filteredBody },
            { returnDocument: "after", runValidators: true }
        );

        return res.status(200).json({
            status: "success",
            data: userDoc,
            message: "User Updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const addToWishList = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { wishList: productId } },
            { returnDocument: 'after' }
        ).populate('wishList');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Product added to wishlist successfully",
            wishList: updatedUser.wishList
        });
    } catch (error) {
        console.error("Error in Adding Product to Wishlist:", error);
        next(error); 
    }
};


export const getWishList = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select("wishList")
            .populate("wishList")
            .lean();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: "Wishlist fetched successfully", 
            wishList: user.wishList || [] 
        });
    } catch (error) {
        console.error("Error in getting wishlist:", error);
        next(error); 
    }
};

export const removeFromWishList = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishList: productId } },
            { returnDocument: 'after' }
        ).populate('wishList');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Product removed from wishlist successfully",
            wishList: updatedUser.wishList
        });
    } catch (error) {
        console.error("Error in removing wishlist:", error);
        next(error); 
    }
};

export const deleteMyAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                status: "fail",
                message: "Admin accounts cannot be self-deleted here.",
            });
        }

        // 1. Gather all user-owned records and chat conversations that hold Cloudinary files
        const [
            userProducts,
            userProviders,
            userJobs,
            userSeekerProfile,
            userConversations,
        ] = await Promise.all([
            Product.find({ seller: userId }).select("images"),
            ServiceProvider.find({ user: userId }).select("portfolioImages"),
            Job.find({ employer: userId }).select("jobImage"),
            JobSeekerProfile.findOne({ user: userId }).select("profilePicture resumeUrl"),
            Conversation.find({ participants: userId }).select("_id"),
        ]);

        const conversationIds = userConversations.map((c) => c._id);

        // Fetch all chat messages with Cloudinary attachments across the user's conversations
        const chatMediaMessages = conversationIds.length > 0
            ? await Message.find({
                  conversationId: { $in: conversationIds },
                  attachment: { $ne: null },
              }).select("attachment messageType")
            : [];

        // Collect all Cloudinary image URLs
        const imageUrlsToDelete = [];
        if (user.profilePicture) imageUrlsToDelete.push(user.profilePicture);
        if (userSeekerProfile?.profilePicture) imageUrlsToDelete.push(userSeekerProfile.profilePicture);

        userProducts.forEach((p) => {
            if (Array.isArray(p.images)) imageUrlsToDelete.push(...p.images);
        });
        userProviders.forEach((sp) => {
            if (Array.isArray(sp.portfolioImages)) imageUrlsToDelete.push(...sp.portfolioImages);
        });
        userJobs.forEach((j) => {
            if (j.jobImage) imageUrlsToDelete.push(j.jobImage);
        });

        // Separate chat image URLs vs. chat voice note URLs (Cloudinary stores audio under resource_type: "video")
        const voiceUrlsToDelete = [];
        chatMediaMessages.forEach((msg) => {
            if (!msg.attachment) return;
            if (msg.messageType === "voice") {
                voiceUrlsToDelete.push(msg.attachment);
            } else if (msg.messageType === "image") {
                imageUrlsToDelete.push(msg.attachment);
            }
        });

        // 2. Delete all user-owned documents, conversations, messages, and dangling references in parallel
        await Promise.all([
            Product.deleteMany({ seller: userId }),
            ServiceProvider.deleteMany({ user: userId }),
            Job.deleteMany({ employer: userId }),
            JobSeekerProfile.deleteMany({ user: userId }),
            ...(conversationIds.length > 0
                ? [
                      Message.deleteMany({ conversationId: { $in: conversationIds } }),
                      Conversation.deleteMany({ _id: { $in: conversationIds } }),
                  ]
                : []),
            User.updateMany({ followers: userId }, { $pull: { followers: userId } }),
            User.updateMany({ following: userId }, { $pull: { following: userId } }),
            User.findByIdAndDelete(userId),
        ]);

        // 3. Non-blocking Cloudinary cleanup (images, voice notes, and raw resume file)
        const cleanupTasks = imageUrlsToDelete.map((url) => {
            const publicId = getCloudinaryPublicId(url);
            return publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
        });

        voiceUrlsToDelete.forEach((url) => {
            const publicId = getCloudinaryPublicId(url);
            if (publicId) {
                cleanupTasks.push(
                    cloudinary.uploader.destroy(publicId, { resource_type: "video" })
                );
            }
        });

        if (userSeekerProfile?.resumeUrl) {
            const resumePublicId = getCloudinaryPublicId(userSeekerProfile.resumeUrl);
            if (resumePublicId) {
                cleanupTasks.push(
                    cloudinary.uploader.destroy(resumePublicId, { resource_type: "raw" }),
                    cloudinary.uploader.destroy(resumePublicId, { resource_type: "image" })
                );
            }
        }

        if (cleanupTasks.length > 0) {
            Promise.allSettled(cleanupTasks).catch((err) =>
                console.error("Cloudinary cleanup error on account delete:", err)
            );
        }

        return res.status(200).json({
            status: "success",
            message: "Your account and all associated data have been permanently deleted.",
        });
    } catch (error) {
        console.error("Error deleting user account:", error);
        next(error);
    }
};
;

export const getUserConnections = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid user ID",
            });
        }

        const user = await User.findById(userId)
            .select("followers following")
            .populate("followers", "firstName lastName email profilePicture verified role")
            .populate("following", "firstName lastName email profilePicture verified role")
            .lean();

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        return res.status(200).json({
            status: "success",
            followers: user.followers || [],
            following: user.following || [],
        });
    } catch (error) {
        console.error("Error fetching user connections:", error);
        next(error);
    }
};

export const toggleFollowUser = async (req, res, next) => {
    try {
        const currentUserId = req.user._id;
        const { targetUserId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid target user ID",
            });
        }

        if (String(currentUserId) === String(targetUserId)) {
            return res.status(400).json({
                status: "fail",
                message: "You cannot follow yourself",
            });
        }

        const [currentUser, targetUser] = await Promise.all([
            User.findById(currentUserId).select("following"),
            User.findById(targetUserId).select("_id"),
        ]);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        const isAlreadyFollowing = currentUser.following?.some(
            (id) => String(id) === String(targetUserId)
        );

        if (isAlreadyFollowing) {
            await Promise.all([
                User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
                User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }),
            ]);

            return res.status(200).json({
                status: "success",
                isFollowing: false,
                message: "Unfollowed user successfully",
            });
        } else {
            await Promise.all([
                User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }),
                User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } }),
            ]);

            return res.status(200).json({
                status: "success",
                isFollowing: true,
                message: "Followed user successfully",
            });
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        next(error);
    }
};
export const getMyAllListings = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [products, services, jobs, seekingJobs] = await Promise.all([
            Product.find({ seller: userId }).sort({ createdAt: -1 }).lean(),
            ServiceProvider.find({ user: userId }).sort({ createdAt: -1 }).lean(),
            Job.find({ employer: userId }).sort({ createdAt: -1 }).lean(),
            JobSeekerProfile.find({ user: userId }).sort({ createdAt: -1 }).lean(),
        ]);

        const normalizedServices = services.map((s) => ({
            ...s,
            listingType: "service",
            name: s.businessName,
            price: s.pricing?.rate,
            images: s.portfolioImages || [],
            isAvailable: s.availabilityStatus === "Available",
        }));

        const normalizedSeeking = seekingJobs.map((js) => ({
            ...js,
            listingType: "seeking_job",
            seekerId: js.user,
            title: js.professionalHeadline || js.category || "Job Seeker",
            applicantName: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim(),
            avatar: js.profilePicture,
            expectedSalary: js.expectedSalary?.min,
            isAvailable: js.isSearchingForJob,
        }));

        const combined = [...products, ...normalizedServices, ...jobs, ...normalizedSeeking].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        return res.status(200).json({
            status: "success",
            listings: combined,
        });
    } catch (error) {
        console.error("Error fetching user unified listings:", error);
        next(error);
    }
};
export const getPublicUserProfile = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid user ID",
            });
        }

        const user = await User.findById(userId)
            .select("firstName lastName profilePicture verified role followers following createdAt")
            .lean();

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        const [products, services, jobs, jobSeekerProfile] = await Promise.all([
            Product.find({ seller: userId, isAvailable: true })
                .sort({ createdAt: -1 })
                .lean(),
            ServiceProvider.find({ user: userId })
                .sort({ createdAt: -1 })
                .lean(),
            Job.find({ employer: userId, isOpen: true })
                .sort({ createdAt: -1 })
                .lean(),
            JobSeekerProfile.findOne({ user: userId }).lean(),
        ]);

        return res.status(200).json({
            status: "success",
            data: {
                user,
                products,
                services,
                jobs,
                jobSeekerProfile,
            },
        });
    } catch (error) {
        console.error("Error fetching public user profile:", error);
        next(error);
    }
};





