import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Product } from "../models/product.model.js";
import { ServiceProvider } from "../models/serviceprovider.model.js";
import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";
import filterObj from "../utils/filterObjects.js";
import cloudinary from "../config/cloudinary.js";


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

        // 1. Gather all user-owned records that hold Cloudinary files
        const [userProducts, userProviders, userJobs, userSeekerProfile] = await Promise.all([
            Product.find({ seller: userId }).select("images"),
            ServiceProvider.find({ user: userId }).select("portfolioImages"),
            Job.find({ employer: userId }).select("jobImage"),
            JobSeekerProfile.findOne({ user: userId }).select("profilePicture resumeUrl"),
        ]);

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

        // 2. Delete all user-owned documents from MongoDB in parallel
        await Promise.all([
            Product.deleteMany({ seller: userId }),
            ServiceProvider.deleteMany({ user: userId }),
            Job.deleteMany({ employer: userId }),
            JobSeekerProfile.deleteMany({ user: userId }),
            User.findByIdAndDelete(userId),
        ]);

        // 3. Non-blocking Cloudinary cleanup (images + raw resume file if applicable)
        const cleanupTasks = imageUrlsToDelete.map((url) => {
            const publicId = getCloudinaryPublicId(url);
            return publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
        });

        if (userSeekerProfile?.resumeUrl) {
            const resumePublicId = getCloudinaryPublicId(userSeekerProfile.resumeUrl);
            if (resumePublicId) {
                // Resumes uploaded as PDF/DOCX on Cloudinary are often stored under resource_type: "raw" or "image"
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



