import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { createReview, deleteReview, getProviderReviews } from "../controllers/serviceproviderReview.controller.js";

const router = express.Router();

router.post("/", protectRoute, createReview);
router.get("/provider/:providerId", getProviderReviews)

router.delete("/:reviewId", protectRoute, deleteReview);

export default router;
