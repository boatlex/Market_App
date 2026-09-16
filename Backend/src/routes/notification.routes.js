import express from "express";
import { protectRoute } from "../controllers/auth.controller.js"; 
import { getMyNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

// 1. Fixed route ordering: Put static routes BEFORE dynamic routes with parameters (:id)
router.put("/mark-all", protectRoute, markAllAsRead);

// 2. Fetch all user notifications
router.get("/", protectRoute, getMyNotifications);

// 3. Dynamic parameter route sits at the bottom
router.patch("/mark-one/:id", protectRoute, markAsRead);

export default router;
