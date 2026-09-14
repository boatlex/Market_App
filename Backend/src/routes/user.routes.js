import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { getMe, updateUserProfile } from "../controllers/user.controller.js"


const router = express.Router()

router.get("/get-user", protectRoute, getMe )
router.patch("/update-user", protectRoute, updateUserProfile )




export default router