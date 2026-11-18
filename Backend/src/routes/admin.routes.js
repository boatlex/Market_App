import express from "express";
import mongoose from "mongoose";
import { protectRoute } from "../controllers/auth.controller.js";
import { adminOnly } from "../middleware/auth.middleware.js";
import { getAllReports, updateReportStatus } from "../controllers/report.controller.js";
import {
    adminDeleteProduct,
    adminDeleteProviderReview,
    adminDeleteServiceProvider,
    adminDeleteUser,
    adminDeleteJob,
    adminDeleteJobSeeker,
    getAllUsers,
    getAllProducts,
    getAllServiceProviders,
    getAllJobs,
    getAllJobSeekers,
    getDashboardStats,
    getRegionalStats,
    toggleProviderVerification,
    toggleUserVerification,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Helper middleware to reject invalid MongoDB ObjectIds early
const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    next();
};

// Apply auth & admin protection to all routes in this file
router.use(protectRoute, adminOnly);

// 1. Dashboard & Users
router.get("/stats", getDashboardStats);
router.get("/regional-stats", getRegionalStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", validateObjectId, adminDeleteUser);

// 2. Products
router.get("/all-products", getAllProducts);
router.delete("/delete/:id", validateObjectId, adminDeleteProduct);

// 3. Service Providers & Reviews
router.get("/providers", getAllServiceProviders);
router.patch("/providers/:id/verify", validateObjectId, toggleProviderVerification);
router.delete("/providers/:id", validateObjectId, adminDeleteServiceProvider);
router.delete("/reviews/:id", validateObjectId, adminDeleteProviderReview);

// 4. Jobs & Job Seekers
router.get("/jobs", getAllJobs);
router.delete("/jobs/:id", validateObjectId, adminDeleteJob);
router.get("/job-seekers", getAllJobSeekers);
router.delete("/job-seekers/:id", validateObjectId, adminDeleteJobSeeker);

// 5. Reports
router.get("/reports", getAllReports);
router.patch("/reports/:id", validateObjectId, updateReportStatus);


router.patch("/users/:id/verify", validateObjectId, toggleUserVerification);


export default router;
