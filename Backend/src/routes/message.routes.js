import express from "express";
import { protectRoute } from "../controllers/auth.controller.js";
import {
  sendMessage,
  getMessages,
  getConversations,
  deleteMessage,
  markMessagesAsRead,
} from "../controllers/message.controller.js";
import { upload } from "../middleware/message.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, upload.single("attachment"), sendMessage);
router.patch("/read/:id", protectRoute, markMessagesAsRead);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
