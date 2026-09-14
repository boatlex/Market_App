import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { upload } from "../middleware/multer.middleware.js";
import { 
    getFilteredProducts, 
    getProducts, 
    getProduct,
     getUserProducts,
      createProduct,updateProduct, deleteProduct } from "../controllers/product.controller.js"


const router = express.Router()

router.get("/query", protectRoute, getFilteredProducts )
router.get("/all-products", protectRoute, getProducts  )
router.get("/product/:productId", protectRoute, getProduct  )
router.get("/user-products", protectRoute, getUserProducts  )
router.post("/products", protectRoute, upload.array("images", 3), createProduct)
router.put("/products/:id", protectRoute, upload.array("images", 3), updateProduct)
router.delete("/products/:id", protectRoute, deleteProduct)



export default router