import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { deleteComment, createComment, getProductComments} from "../controllers/comment.controller.js"

const router = express.Router()

router.get("/get-comment/:productId", protectRoute, getProductComments )
router.post("/create/:productId", protectRoute, createComment )
router.delete("/delete/:commentId", protectRoute, deleteComment )



export default router