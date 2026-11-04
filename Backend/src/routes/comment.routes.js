import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { deleteComment, createComment, getProductComments, replyToComment, toggleLikeComment} from "../controllers/comment.controller.js"

const router = express.Router()


router.get("/product/:productId", getProductComments);

router.post("/:productId", protectRoute, createComment);

router.post("/reply/:commentId", protectRoute, replyToComment);

router.patch("/like/:commentId", protectRoute, toggleLikeComment);

router.delete("/:commentId", protectRoute, deleteComment);



export default router