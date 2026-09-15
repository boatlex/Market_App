import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { sendMessage, getMessages } from "../controllers/message.controller.js";

const router = express.Router()

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);


export default router