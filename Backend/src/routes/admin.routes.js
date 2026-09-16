import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import {adminOnly} from "../middleware/auth.middleware.js"
import { getAllReports, updateReportStatus } from "../controllers/report.controller.js";
import { adminDeleteProduct, getAllUsers, getAllProducts, getDashboardStats  } from "../controllers/admin.controller.js"


const router = express.Router()

router.delete("/delete/:id", protectRoute, adminOnly, adminDeleteProduct )
router.get("/users", protectRoute, adminOnly, getAllUsers )
router.get("/all-products", protectRoute, adminOnly, getAllProducts  )
router.get("/stats", protectRoute, adminOnly, getDashboardStats )



// Add these to your existing admin router endpoints:
router.get("/reports", protectRoute, adminOnly, getAllReports);
router.patch("/reports/:id", protectRoute, adminOnly, updateReportStatus);



export default router