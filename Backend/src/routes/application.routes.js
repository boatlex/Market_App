import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { applyToJob, getJobApplications, getMyApplications, updateApplicationStatus } from "../controllers/application.controller.js";



const router = express.Router()

router.get("/my-applications", protectRoute, getMyApplications);


router.post("/job/:jobId/apply", protectRoute, applyToJob);


router.get("/job/:jobId", protectRoute, getJobApplications);


router.patch("/:applicationId/status", protectRoute, updateApplicationStatus);



export default router