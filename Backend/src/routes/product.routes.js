import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { 
    getFilteredProducts, 
    getProducts, 
    getProduct,
    getUserProducts,
    createProduct,
    updateProduct,
    deleteProduct 
} from "../controllers/product.controller.js";

const router = express.Router();

// 1. SPECIFIC STATIC PATHS FIRST
router.get("/query", protectRoute, getFilteredProducts);
router.get("/user", protectRoute, getUserProducts); 

// 2. GENERAL ROOT PATH SECOND
router.get("/", getProducts);

// 3. DATA MUTATION PATHS
router.post("/products", protectRoute, upload.array("images", 3), createProduct);
router.put("/products/:id", protectRoute, upload.array("images", 3), updateProduct);
router.delete("/products/:id", protectRoute, deleteProduct);

// 4. DYNAMIC PATHS LAST (Acts as the catch-all parameter)
router.get("/:productId", protectRoute, getProduct);

export default router;
