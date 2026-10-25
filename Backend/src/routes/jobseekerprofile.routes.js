import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import {
     upsertJobSeekerProfile,
      getMyProfile,getMyJobSeekingAds,
      searchCandidatePool,
       getMyJobSeekingAdById,
       deleteJobSeekerProfile} from "../controllers/jobsekerprofile.controller.js";
import upload from "../middleware/jobmulter.middleware.js"; 


const router = express.Router();

// 1. Static/Specific Routes first
router.get("/profile", protectRoute, getMyProfile);
router.get("/jobseeker/my-ads", protectRoute, getMyJobSeekingAds);
router.get("/search", protectRoute, searchCandidatePool);

router.put(
    "/profile", 
    protectRoute, 
    upload.fields([
        { name: "image", maxCount: 1 },  
        { name: "resume", maxCount: 1 }  
    ]), 
    upsertJobSeekerProfile
);

router.delete("/profile", protectRoute, deleteJobSeekerProfile)

// 2. Dynamic/Parameter Routes last
router.get("/:profileId", getMyJobSeekingAdById);


export default router;

