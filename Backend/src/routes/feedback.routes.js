import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { submitFeedback } from "../controllers/feedback.controller.js";

const router = express.Router();

router.post("/", protectRoute, submitFeedback);

export default router;
