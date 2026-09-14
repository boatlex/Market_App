import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import {adminOnly} from "../middleware/auth.middleware.js"
import { adminDeleteProduct, getAllUsers, getAllProducts, getDashboardStats  } from "../controllers/admin.controller.js"


const router = express.Router()

router.delete("/delete", protectRoute, adminOnly, adminDeleteProduct )
router.get("/users", protectRoute, adminOnly, getAllUsers )
router.get("/all-products", protectRoute, adminOnly, getAllProducts  )
router.get("/stats", protectRoute, adminOnly, getDashboardStats )




export default router