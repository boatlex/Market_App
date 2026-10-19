import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { upsertJobSeekerProfile, getMyProfile,getMyJobSeekingAds } from "../controllers/jobsekerprofile.controller.js";
import upload from "../middleware/jobmulter.middleware.js"; 


const router = express.Router();


router.get("/profile", protectRoute, getMyProfile);


router.get("/jobseeker/my-ads", protectRoute, getMyJobSeekingAds);


router.put("/profile", protectRoute, upload.single("image"), upsertJobSeekerProfile);

export default router;

