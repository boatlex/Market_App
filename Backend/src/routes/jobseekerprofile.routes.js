import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { upsertJobSeekerProfile, getMyProfile } from "../controllers/jobsekerprofile.controller.js";
import upload from "../middleware/jobmulter.middleware.js"; // Reuse your global multer middleware

const router = express.Router();


router.get("/me", protectRoute, getMyProfile);


router.put("/me", protectRoute, upload.single("image"), upsertJobSeekerProfile);

export default router;
