import express from "express"
import {loginUserClerk,
     registerUser,
      loginUserManual,
       forgotPassword,
        resetPassword,} from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", registerUser )
router.post("/loginclerk", loginUserClerk )
router.post("/loginmanual", loginUserManual )

router.post("/forgot-password", forgotPassword )
router.post("/reset-password", resetPassword )

export default router