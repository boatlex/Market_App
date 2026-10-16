import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { createJob, getAllJobs, getJobById, editJob, deleteJob, toggleJobStatus } from "../controllers/jobs.controller.js";
import upload from "../middleware/jobmulter.middleware.js";

const router = express.Router()


router.get("/", getAllJobs)
router.post("/", protectRoute, upload.single("image"), createJob)
router.get("/:id", getJobById)


router.put("/:id", protectRoute, upload.single("image"), editJob)
router.delete("/:id", protectRoute, deleteJob)


router.patch("/:id/toggle-status", protectRoute, toggleJobStatus)

export default router
