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

// // 1. STATIC & EXPLICIT LOOKUP ROUTES (Must always go at the very top)
// =========================================================================
router.get("/search", searchServiceProviders);
router.get("/my-profile", protectRoute, getMyProviderProfile);
router.delete("/portfolio-image", protectRoute, removePortfolioImage);

router.route("/profile")
    .put(
        protectRoute, 
        upload.array("portfolioImages", 5), 
        upsertServiceProviderProfile
    )
    .delete(
        protectRoute, 
        deleteServiceProviderProfile
    );

router.get("/:providerId", getServiceProviderById);

export default router;
