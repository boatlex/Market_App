import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { addToWishList, getMe, getWishList, removeFromWishList, updateUserProfile } from "../controllers/user.controller.js"

const router = express.Router()

router.get("/get-user", protectRoute, getMe)
router.patch("/update-user", protectRoute, updateUserProfile)

// FIXED: Wishlist Management endpoints are now strictly authenticated and protected
router.post('/wishList', protectRoute, addToWishList);
router.get('/wishList', protectRoute, getWishList);
router.delete('/wishList/:productId', protectRoute, removeFromWishList);

export default router;
