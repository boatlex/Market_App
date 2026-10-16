import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import {createJob, getAllJobs, getJobById, editJob, deleteJob } from "../controllers/jobs.controller.js";
import upload from "../middleware/jobmulter.middleware.js";


const router = express.Router()


router.get("/", getAllJobs)
router.post("/", protectRoute, upload.single("image"), createJob)
router.get("/:id",  getJobById)
router.post("/:id", protectRoute, upload.single("image"), editJob)
router.delete("/:id", protectRoute, deleteJob)


export default router