import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { createReport } from "../controllers/report.controller.js";

const router = express.Router();

// Any logged-in user can report abuse
router.post("/", protectRoute, createReport);

export default router;
