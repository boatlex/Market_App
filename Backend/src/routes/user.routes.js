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
  getPublicUserProfile,
  getMyAllListings,
} from "../controllers/user.controller.js";
import upload from "../middleware/jobmulter.middleware.js";

const router = express.Router();

// Static authenticated routes
router.get("/get-user", protectRoute, getMe);
router.get("/my-listings", protectRoute, getMyAllListings);

router.patch(
  "/update-profile",
  protectRoute,
  upload.single("profilePicture"),
  updateUserProfile
);

// Wishlist management endpoints
router.post("/wishList", protectRoute, addToWishList);
router.get("/wishList", protectRoute, getWishList);
router.delete("/wishList/:productId", protectRoute, removeFromWishList);

router.delete("/delete-account", protectRoute, deleteMyAccount);

// Dynamic parameter routes (placed after static paths so :userId never shadows static routes)
router.get("/:userId/public-profile", getPublicUserProfile);
router.get("/:userId/connections", protectRoute, getUserConnections);
router.post("/:targetUserId/follow", protectRoute, toggleFollowUser);

export default router;
