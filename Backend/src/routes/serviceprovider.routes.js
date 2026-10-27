import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { 
    upsertServiceProviderProfile,
    searchServiceProviders,
    getServiceProviderById,
    getMyProviderProfile,
    deleteServiceProviderProfile,
    removePortfolioImage
  } from "../controllers/serviceprovider.controller.js";
import upload from "../middleware/jobmulter.middleware.js";

const router = express.Router();

// 1. STATIC & EXPLICIT LOOKUP ROUTES (Must always go at the very top)
// =========================================================================
router.get("/search", searchServiceProviders);

// 🔑  Points to a controller that retrieves all distinct listings for the logged-in user
router.get("/my-services", protectRoute, getMyProviderProfile); 
router.delete("/portfolio-image", protectRoute, removePortfolioImage);

// 🔑  Split PUT and POST paths to match the frontend Multi-Listing mutation hook engine
router.route("/profile")
    .post(
        protectRoute,
        upload.array("portfolioImages", 5),
        upsertServiceProviderProfile 
    )
    .put(
        protectRoute, 
        upload.array("portfolioImages", 5), 
        upsertServiceProviderProfile 
    )
    .delete(
        protectRoute, 
        deleteServiceProviderProfile
    );

// 2. DYNAMIC PARAMETER ROUTES (Must always go at the very bottom)
// =========================================================================
router.get("/:providerId", getServiceProviderById);


export default router;
