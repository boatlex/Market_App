import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Report } from "../models/report.model.js";
import Comment from "../models/comment.model.js";
import cloudinary from "../config/cloudinary.js";
import { ServiceProvider } from "../models/serviceprovider.model.js";
import mongoose from "mongoose";
import { ServiceProviderReview } from "../models/serviceProviderReview.model.js";
import { Job } from "../models/job.model.js";
import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";
import { Feedback } from "../models/feedback.model.js";



// Helper: Safely extract publicId and destroy Cloudinary assets (images & raw resumes)
const deleteCloudinaryAssets = async (urls = []) => {
    const validUrls = urls.filter((url) => typeof url === "string" && url.includes("/upload/"));
    if (validUrls.length === 0) return;

    const deletePromises = validUrls.map((fileUrl) => {
        const parts = fileUrl.split("/upload/");
        if (parts.length <= 1) return null;

        const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
        const lastDotIndex = pathAfterUpload.lastIndexOf(".");
        const publicId =
            lastDotIndex !== -1
                ? pathAfterUpload.substring(0, lastDotIndex)
                : pathAfterUpload;

        // Resumes/PDFs uploaded as raw assets require resource_type: "raw"
        const isRawFile = fileUrl.includes("/raw/upload/");
        if (isRawFile) {
            // Raw files in Cloudinary often include the file extension in their publicId
            return cloudinary.uploader.destroy(pathAfterUpload, { resource_type: "raw" });
        }

        return cloudinary.uploader.destroy(publicId);
    });

    await Promise.allSettled(deletePromises.filter(Boolean));
};


export const getAllUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;

        const query = { role: { $ne: "admin" } };

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .select("-password -otp -otp_expiry_time -resetPasswordToken -resetPasswordExpires")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalUsers / limit);

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                totalItems: totalUsers,
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages
            }
        });
    } catch (error) {
        console.error("Error Fetching Users:", error);
        next(error);
    }
};


export const getAllProducts = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { productType: { $regex: search, $options: "i" } }
            ];
        }


        const [products, totalProducts] = await Promise.all([
            Product.find(query)
                .populate("seller", "firstName lastName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: {
                totalItems: totalProducts,
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                limit
            }
        });
    } catch (error) {
        console.error("Error Fetching Products:", error);
        next(error);
    }
};


export const adminDeleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        // 1. Remove all product images from Cloudinary
        if (product.images && product.images.length > 0) {
            await deleteCloudinaryAssets(product.images);
        }

        // 2. Remove all comments associated with this product
        await Comment.deleteMany({
            $or: [
                { product: id },
                ...(product.comments?.length ? [{ _id: { $in: product.comments } }] : [])
            ]
        });

        // 3. Delete the product document
        await Product.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Administrative Action: Product removed successfully."
        });
    } catch (error) {
        console.error("Admin Delete Error:", error);
        next(error);
    }
};


export const getAllServiceProviders = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search?.trim() || "";
        const verified = req.query.verified;
        const skip = (page - 1) * limit;

        const query = {};

        if (verified === "true") query.isVerifiedProvider = true;
        if (verified === "false") query.isVerifiedProvider = false;

        if (search) {
            query.$or = [
                { businessName: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { serviceType: { $regex: search, $options: "i" } }
            ];
        }

        const [providers, totalProviders] = await Promise.all([
            ServiceProvider.find(query)
                .populate("user", "firstName lastName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ServiceProvider.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalProviders / limit);

        return res.status(200).json({
            success: true,
            providers,
            pagination: {
                totalItems: totalProviders,
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages
            }
        });
    } catch (error) {
        console.error("Error Fetching Service Providers:", error);
        next(error);
    }
};

export const adminDeleteProviderReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await ServiceProviderReview.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found." });
        }

        const providerId = review.provider;
        await ServiceProviderReview.findByIdAndDelete(id);

        const stats = await ServiceProviderReview.aggregate([
            { $match: { provider: new mongoose.Types.ObjectId(providerId) } },
            {
                $group: {
                    _id: "$provider",
                    totalReviews: { $sum: 1 },
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        await ServiceProvider.findByIdAndUpdate(providerId, {
            averageRating: stats.length > 0 ? Math.round(stats.avgRating * 10) / 10 : 0,
            totalReviews: stats.length > 0 ? stats.totalReviews : 0
        });

        return res.status(200).json({
            success: true,
            message: "Administrative Action: Review removed and provider rating updated."
        });
    } catch (error) {
        console.error("Admin Delete Review Error:", error);
        next(error);
    }
};

export const toggleProviderVerification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const provider = await ServiceProvider.findById(id);
        if (!provider) {
            return res.status(404).json({ success: false, message: "Service provider not found." });
        }

        provider.isVerifiedProvider = !provider.isVerifiedProvider;
        await provider.save();

        return res.status(200).json({
            success: true,
            message: `Provider ${provider.isVerifiedProvider ? "verified" : "unverified"} successfully.`,
            provider
        });
    } catch (error) {
        console.error("Admin Verify Provider Error:", error);
        next(error);
    }
};
export const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalProducts,
            totalProviders,
            totalJobs,
            totalJobSeekers,
            statusCounts
        ] = await Promise.all([
            User.countDocuments({ role: { $ne: "admin" } }),
            Product.estimatedDocumentCount(),
            ServiceProvider.estimatedDocumentCount(),
            Job.estimatedDocumentCount(),
            JobSeekerProfile.estimatedDocumentCount(),
            Report.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const reportStats = {
            pending: 0,
            under_review: 0,
            resolved: 0,
            dismissed: 0
        };

        statusCounts.forEach(item => {
            if (item._id in reportStats) {
                reportStats[item._id] = item.count;
            }
        });

        const totalReports =
            reportStats.pending +
            reportStats.under_review +
            reportStats.resolved +
            reportStats.dismissed;

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalProducts,
                totalProviders,
                totalJobs,
                totalJobSeekers,
                totalReports,
                reportBreakdown: reportStats
            }
        });
    } catch (error) {
        console.error("Error Fetching Dashboard Stats:", error);
        next(error);
    }
};

export const getRegionalStats = async (req, res, next) => {
    try {
        const buildLocationPipeline = (activeExpr = null) => [
            {
                $project: {
                    region: { $trim: { input: { $ifNull: ["$region", ""] } } },
                    district: { $trim: { input: { $ifNull: ["$district", ""] } } },
                    ...(activeExpr ? { isActive: activeExpr } : {})
                }
            },
            {
                $group: {
                    _id: {
                        region: { $cond: [{ $eq: ["$region", ""] }, "Unspecified", "$region"] },
                        district: { $cond: [{ $eq: ["$district", ""] }, "Unspecified", "$district"] }
                    },
                    count: { $sum: 1 },
                    ...(activeExpr
                        ? { activeCount: { $sum: { $cond: ["$isActive", 1, 0] } } }
                        : {})
                }
            }
        ];

        const [
            productCounts,
            serviceCounts,
            jobCounts,
            seekerCounts
        ] = await Promise.all([
            Product.aggregate(buildLocationPipeline({ $eq: ["$isAvailable", true] })),
            ServiceProvider.aggregate(buildLocationPipeline({ $eq: ["$availabilityStatus", "Available"] })),
            Job.aggregate(buildLocationPipeline({ $eq: ["$isOpen", true] })),
            JobSeekerProfile.aggregate(buildLocationPipeline({ $eq: ["$isSearchingForJob", true] }))
        ]);

        const regionsMap = new Map();

        const mergeMetric = (rows, totalKey, activeKey) => {
            rows.forEach(({ _id, count, activeCount = 0 }) => {
                const regionName = _id.region || "Unspecified";
                const districtName = _id.district || "Unspecified";

                if (!regionsMap.has(regionName)) {
                    regionsMap.set(regionName, {
                        region: regionName,
                        products: 0,
                        availableProducts: 0,
                        services: 0,
                        availableServices: 0,
                        jobs: 0,
                        openJobs: 0,
                        jobSeekers: 0,
                        activeJobSeekers: 0,
                        total: 0,
                        districtsMap: new Map()
                    });
                }

                const regionEntry = regionsMap.get(regionName);
                regionEntry[totalKey] += count;
                regionEntry[activeKey] += activeCount;
                regionEntry.total += count;

                if (!regionEntry.districtsMap.has(districtName)) {
                    regionEntry.districtsMap.set(districtName, {
                        district: districtName,
                        products: 0,
                        availableProducts: 0,
                        services: 0,
                        availableServices: 0,
                        jobs: 0,
                        openJobs: 0,
                        jobSeekers: 0,
                        activeJobSeekers: 0,
                        total: 0
                    });
                }

                const districtEntry = regionEntry.districtsMap.get(districtName);
                districtEntry[totalKey] += count;
                districtEntry[activeKey] += activeCount;
                districtEntry.total += count;
            });
        };

        mergeMetric(productCounts, "products", "availableProducts");
        mergeMetric(serviceCounts, "services", "availableServices");
        mergeMetric(jobCounts, "jobs", "openJobs");
        mergeMetric(seekerCounts, "jobSeekers", "activeJobSeekers");

        const summary = {
            totalRegions: 0,
            totalDistricts: 0,
            products: 0,
            availableProducts: 0,
            services: 0,
            availableServices: 0,
            jobs: 0,
            openJobs: 0,
            jobSeekers: 0,
            activeJobSeekers: 0
        };

        const regions = Array.from(regionsMap.values())
            .map(({ districtsMap, ...regionData }) => {
                const districts = Array.from(districtsMap.values()).sort(
                    (a, b) => b.total - a.total
                );

                summary.totalRegions += 1;
                summary.totalDistricts += districts.length;
                summary.products += regionData.products;
                summary.availableProducts += regionData.availableProducts;
                summary.services += regionData.services;
                summary.availableServices += regionData.availableServices;
                summary.jobs += regionData.jobs;
                summary.openJobs += regionData.openJobs;
                summary.jobSeekers += regionData.jobSeekers;
                summary.activeJobSeekers += regionData.activeJobSeekers;

                return {
                    ...regionData,
                    districts
                };
            })
            .sort((a, b) => b.total - a.total);

        return res.status(200).json({
            success: true,
            summary,
            regions
        });
    } catch (error) {
        console.error("Error Fetching Regional Stats:", error);
        next(error);
    }
};


// 10. Get All Jobs with Pagination & Search
export const getAllJobs = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ];
        }

        const [jobs, totalJobs] = await Promise.all([
            Job.find(query)
                .populate("employer", "firstName lastName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Job.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalJobs / limit);

        return res.status(200).json({
            success: true,
            jobs,
            pagination: {
                totalItems: totalJobs,
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages
            }
        });
    } catch (error) {
        console.error("Error Fetching Jobs:", error);
        next(error);
    }
};

// 14. Admin Delete Service Provider (With Portfolio Images & Reviews Cleanup)
export const adminDeleteServiceProvider = async (req, res, next) => {
    try {
        const { id } = req.params;

        const provider = await ServiceProvider.findById(id);
        if (!provider) {
            return res.status(404).json({ success: false, message: "Service provider not found." });
        }

        // Clean up portfolio images on Cloudinary & linked reviews
        await deleteCloudinaryAssets(provider.portfolioImages || []);
        await ServiceProviderReview.deleteMany({ provider: id });
        await ServiceProvider.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Administrative Action: Service provider and media removed successfully."
        });
    } catch (error) {
        console.error("Admin Delete Provider Error:", error);
        next(error);
    }
};

// 15. Admin Delete User (With Cascading Cloudinary & Listing Cleanup)
export const adminDeleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot delete your own admin account." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Gather all user-owned assets across User, Products, Providers, Jobs, and JobSeekerProfile
        const [products, provider, jobs, seeker] = await Promise.all([
            Product.find({ seller: id }).lean(),
            ServiceProvider.findOne({ user: id }).lean(),
            Job.find({ employer: id }).lean(),
            JobSeekerProfile.findOne({ user: id }).lean()
        ]);

        const assetUrls = [
            user.profilePicture,
            ...products.flatMap((p) => p.images || []),
            ...(provider?.portfolioImages || []),
            ...jobs.flatMap((j) => [j.jobImage, j.companyLogo]),
            seeker?.profilePicture,
            seeker?.resumeUrl
        ];

        await deleteCloudinaryAssets(assetUrls);

        // Clean up related documents
        const productIds = products.map((p) => p._id);
        await Promise.all([
            Comment.deleteMany({ $or: [{ user: id }, { product: { $in: productIds } }] }),
            Product.deleteMany({ seller: id }),
            provider ? ServiceProviderReview.deleteMany({ provider: provider._id }) : Promise.resolve(),
            ServiceProvider.deleteMany({ user: id }),
            Job.deleteMany({ employer: id }),
            JobSeekerProfile.deleteMany({ user: id }),
            User.findByIdAndDelete(id)
        ]);

        return res.status(200).json({
            success: true,
            message: "Administrative Action: User account and all associated assets removed."
        });
    } catch (error) {
        console.error("Admin Delete User Error:", error);
        next(error);
    }
};


// 12. Get All Job Seekers with Pagination & Search
export const getAllJobSeekers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { professionalHeadline: { $regex: search, $options: "i" } },
                { skills: { $regex: search, $options: "i" } },
                { region: { $regex: search, $options: "i" } }
            ];
        }

        const [jobSeekers, totalSeekers] = await Promise.all([
            JobSeekerProfile.find(query)
                .populate("user", "firstName lastName email profilePicture")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobSeekerProfile.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalSeekers / limit);

        return res.status(200).json({
            success: true,
            jobSeekers,
            pagination: {
                totalItems: totalSeekers,
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages
            }
        });
    } catch (error) {
        console.error("Error Fetching Job Seekers:", error);
        next(error);
    }
};
// In Backend/src/controllers/admin.controller.js
// 11. Admin Delete Job (With Cloudinary Cleanup)
export const adminDeleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        // Remove jobImage and companyLogo from Cloudinary
        await deleteCloudinaryAssets([job.jobImage, job.companyLogo]);

        await Job.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Administrative Action: Job listing and media removed successfully."
        });
    } catch (error) {
        console.error("Admin Delete Job Error:", error);
        next(error);
    }
};

// 13. Admin Delete Job Seeker (With Profile Picture & Resume Cleanup)
export const adminDeleteJobSeeker = async (req, res, next) => {
    try {
        const { id } = req.params;

        const seeker = await JobSeekerProfile.findById(id);
        if (!seeker) {
            return res.status(404).json({ success: false, message: "Job seeker profile not found." });
        }

        // Remove profilePicture and resumeUrl from Cloudinary
        await deleteCloudinaryAssets([seeker.profilePicture, seeker.resumeUrl]);

        await JobSeekerProfile.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Administrative Action: Job seeker profile and files removed successfully."
        });
    } catch (error) {
        console.error("Admin Delete Job Seeker Error:", error);
        next(error);
    }
};

export const toggleUserVerification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.verified = !user.verified;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${user.verified ? "verified" : "unverified"} successfully.`,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                verified: user.verified
            }
        });
    } catch (error) {
        console.error("Admin Verify User Error:", error);
        next(error);
    }
};

// GET /admin/feedback?page=1&limit=10&status=new
export const getAllFeedback = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && ["new", "reviewed", "resolved"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [feedbackList, totalItems] = await Promise.all([
      Feedback.find(filter)
        .populate("user", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      feedback: feedbackList,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit) || 1,
        limit,
        hasNextPage: page * limit < totalItems,
      },
    });
  } catch (error) {
    console.error("Error fetching admin feedback:", error);
    next(error);
  }
};

// PATCH /admin/feedback/:id/status
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed: new, reviewed, resolved.",
      });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    ).populate("user", "firstName lastName email profilePicture");

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Feedback marked as ${status}.`,
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    next(error);
  }
};

