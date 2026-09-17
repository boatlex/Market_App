import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { createReport, getAllReports, updateReportStatus } from "../controllers/report.controller.js";
import { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Any logged-in user can report abuse
router.get("/", protectRoute, adminOnly, getAllReports);
router.post("/", protectRoute, createReport);
router.post("/:id", protectRoute, adminOnly, updateReportStatus);

export default router;
