import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import {createJob, getAllJobs } from "../controllers/jobs.controller.js";
import upload from "../middleware/jobmulter.middleware.js";


const router = express.Router()


router.get("/", getAllJobs)
router.post("/", protectRoute, upload.single("image"), createJob)


export default router