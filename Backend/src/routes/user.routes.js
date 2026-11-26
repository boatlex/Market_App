import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import {
  addToWishList,
  getMe,
  getWishList,
  removeFromWishList,
  updateUserProfile,
  deleteMyAccount,
  getUserConnections,
  toggleFollowUser,
} from "../controllers/user.controller.js";
import upload from "../middleware/jobmulter.middleware.js";

const router = express.Router();

router.get("/get-user", protectRoute, getMe);
router.patch(
  "/update-profile",
  protectRoute,
  upload.single("profilePicture"),
  updateUserProfile
);

// Wishlist Management endpoints
router.post("/wishList", protectRoute, addToWishList);
router.get("/wishList", protectRoute, getWishList);
router.delete("/wishList/:productId", protectRoute, removeFromWishList);

router.delete("/delete-account", protectRoute, deleteMyAccount);

// Followers & Following endpoints (placed after static paths so :userId/:targetUserId don't match static routes)
router.get("/:userId/connections", protectRoute, getUserConnections);
router.post("/:targetUserId/follow", protectRoute, toggleFollowUser);

export default router;
