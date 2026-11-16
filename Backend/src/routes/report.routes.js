import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import {
  createReport,
  getAllReports,
  getMyReports,
  updateReportStatus,
} from "../controllers/report.controller.js";
import { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// User routes
router.get("/my-reports", protectRoute, getMyReports);
router.post("/", protectRoute, createReport);

// Admin routes (if kept here alongside admin.routes.js)
router.get("/", protectRoute, adminOnly, getAllReports);
router.patch("/:id/status", protectRoute, adminOnly, updateReportStatus);

export default router;
