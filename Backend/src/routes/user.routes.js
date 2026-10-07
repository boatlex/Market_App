import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { addToWishList, getMe, getWishList, removeFromWishList, updateUserProfile } from "../controllers/user.controller.js"


const router = express.Router()

router.get("/get-user", protectRoute, getMe )
router.patch("/update-user", protectRoute, updateUserProfile )

// Wishlist Management
router.post('/wishList', addToWishList);
router.get('/wishList', getWishList);
router.delete('/wishList/:productId', removeFromWishList);



export default router