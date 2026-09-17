import express from "express"
import { protectRoute } from "../controllers/auth.controller.js"
import { applyToJob, getJobApplications, getMyApplications, updateApplicationStatus } from "../controllers/application.controller.js";



const router = express.Router()


router.get("/employee", protectRoute, getMyApplications )
router.post("/:jobId/apply", protectRoute, applyToJob);
router.get("/employer/:jobId", protectRoute, getJobApplications)
router.patch("/status/:applicationId", protectRoute, updateApplicationStatus);


export default router