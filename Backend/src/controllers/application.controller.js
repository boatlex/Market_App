import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";

export const applyToJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { coverLetter } = req.body;
        const applicantId = req.user._id;

        const userProfile = await JobSeekerProfile.findOne({ user: applicantId });
        
        if (!userProfile || !userProfile.resumeUrl) {
            return res.status(400).json({ 
                success: false,
                message: "Please upload a resume to your profile dashboard before applying to jobs." 
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job post not found." });
        }
        if (job.isOpen === false) {
            return res.status(400).json({ success: false, message: "This job is no longer accepting applications." });
        }

        const alreadyApplied = await Application.findOne({ job: jobId, applicant: applicantId });
        if (alreadyApplied) {
            return res.status(400).json({ success: false, message: "You have already applied for this job." });
        }

        const newApplication = new Application({
            job: jobId,
            applicant: applicantId,
            resume: userProfile.resumeUrl, 
            coverLetter: coverLetter ? coverLetter.trim() : undefined
        });

        const savedApplication = await newApplication.save();

        // FIX 1: Use atomic \$push to completely eliminate multi-user race conditions
        await Job.findByIdAndUpdate(jobId, {
            $push: { applications: savedApplication._id }
        });

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully using your profile resume!",
            application: savedApplication
        });

    } catch (error) {
        next(error); 
    }
};

export const getJobApplications = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const currentUserId = req.user._id;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        
        // Use standard Mongoose .equals for deep ObjectId checks
        if (!job.employer.equals(currentUserId)) {
            return res.status(403).json({ success: false, message: "Not authorized to view applications for this job" });
        }
        
        const applications = await Application.find({ job: jobId })
            .populate("applicant", "name email phoneNumber") 
            .sort({ createdAt: -1 }); 

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });

    } catch (error) {
        // FIX 2: Standardized error forwarder
        next(error);
    }
};

export const getMyApplications = async (req, res, next) => {
    try {
        const applicantId = req.user._id;

        const myApplications = await Application.find({ applicant: applicantId })
            .populate({
                path: "job",
                select: "title companyName region district isOpen"  
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: myApplications.length,
            applications: myApplications
        });

    } catch (error) {
        next(error);
    }
};

export const updateApplicationStatus = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const { status, notesByEmployer } = req.body;
        const currentUserId = req.user._id;

        const application = await Application.findById(applicationId).populate("job");
        if (!application) {
            return res.status(404).json({ success: false, message: "Application record not found." });
        }

        if (!application.job || !application.job.employer.equals(currentUserId)) {
            return res.status(403).json({ success: false, message: "Not authorized to modify applications for this job." });
        }

        if (status) application.status = status;
        if (notesByEmployer) application.notesByEmployer = notesByEmployer;

        const updatedApplication = await application.save();

        return res.status(200).json({
            success: true,
            message: `Application status updated to ${application.status} successfully!`,
            application: updatedApplication
        });

    } catch (error) {
        next(error);
    }
};


