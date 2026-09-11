import express from "express"
import {loginUserClerk,
     registerUser,
      loginUserManual,
       forgotPassword,
        resetPassword,} from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", registerUser )
router.post("/login-clerk", loginUserClerk )
router.post("/login-manual", loginUserManual )

router.post("/forgot-password", forgotPassword )
router.post("/reset-password", resetPassword )

export default router