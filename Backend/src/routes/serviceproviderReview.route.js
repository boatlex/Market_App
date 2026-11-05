import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { 
    createProviderReview, 
    deleteProviderReview, 
    getProviderReviews 
} from "../controllers/serviceproviderReview.controller.js";
import { 
    createItemReview, 
    deleteItemReview, 
    getItemReviews 
} from "../controllers/itemReview.controller.js";

const router = express.Router();

// ==========================================
// SERVICE PROVIDER REVIEWS
// ==========================================

router.post("/provider", protectRoute, createProviderReview);

router.get("/provider/:providerId", getProviderReviews);

router.delete("/provider/:reviewId", protectRoute, deleteProviderReview);


// ==========================================
// ITEMS PROVIDER REVIEWS
// 
router.post("/item", protectRoute, createItemReview);

router.get("/item/:targetId", getItemReviews);

router.delete("/item/:reviewId", protectRoute, deleteItemReview);

export default router;

