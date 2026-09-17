import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { upsertServiceProviderProfile, getMyServiceProfile } from "../controllers/serviceprovider.controller.js";
import upload from "../middleware/jobmulter.middleware.js";
const router = express.Router();

router.get("/me", protectRoute, getMyServiceProfile);

// for creating and updating data
router.put(
    "/me", 
    protectRoute, 
    upload.array("portfolio", 5), 
    upsertServiceProviderProfile
);

export default router;
