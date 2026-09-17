import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { deleteComment, createComment, getProductComments, replyToComment, toggleLikeComment} from "../controllers/comment.controller.js"

const router = express.Router()

router.get("/:productId", getProductComments )

router.post("/create/:productId", protectRoute, createComment )
router.post("/:commentId/reply", protectRoute, replyToComment)
router.patch("/:commentId/like", protectRoute, toggleLikeComment);
router.delete("/delete/:commentId", protectRoute, deleteComment )



export default router