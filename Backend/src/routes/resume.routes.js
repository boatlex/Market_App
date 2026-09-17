import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import {deleteMyProfile, searchCandidates, updateResume } from "../controllers/resume.controller.js";
import upload from "../middleware/jobmulter.middleware.js";

const router = express.Router();
// Endpoint for employers to browse candidates
// Example: GET /api/profiles/search?search=Node.js&page=1
router.get("/search", protectRoute, searchCandidates);

router.put("/resume", protectRoute, upload.single("resume"), updateResume);
router.delete("/me", protectRoute, deleteMyProfile);

export default router;
