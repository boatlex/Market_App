import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";

export const applyToJob = async (req, res, next) => {
    try {
        const { jobId } = req.params
        const { coverLetter } = req.body
        const applicantId = req.user._id

        const userProfile = await JobSeekerProfile.findOne({ user: applicantId });
        
        if (!userProfile || !userProfile.resumeUrl) {
            return res.status(400).json({ 
                message: "Please upload a resume to your profile dashboard before applying to jobs." 
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job post not found." });
        }
        if (!job.isOpen) {
            return res.status(400).json({ message: "This job is no longer accepting applications." });
        }

        const alreadyApplied = await Application.findOne({ job: jobId, applicant: applicantId });
        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied for this job." });
        }

        const newApplication = new Application({
            job: jobId,
            applicant: applicantId,
            resume: userProfile.resumeUrl, 
            coverLetter
        });

        const savedApplication = await newApplication.save();

        job.applications.push(savedApplication._id);
        await job.save();

        return res.status(201).json({
            message: "Application submitted successfully using your profile resume!",
            application: savedApplication
        });

    } catch (error) {
        next(error); 
    }
};


// 1. GET ALL APPLICATIONS FOR A SPECIFIC JOB (For Employers)
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const currentUserId = req.user._id;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        
        
        if (job.employer.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Not authorized to view applications for this job" });
        }

        
        const applications = await Application.find({ job: jobId })
            .populate("applicant", "name email phoneNumber") // Only grab necessary user fields
            .sort({ createdAt: -1 }); // Newest first

        return res.status(200).json({
            count: applications.length,
            applications
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 2. GET USER'S APPLICATION HISTORY (For Job Seekers)
export const getMyApplications = async (req, res) => {
    try {
        const applicantId = req.user._id;

        const myApplications = await Application.find({ applicant: applicantId })
            .populate({
                path: "job",
                select: "title companyName region district isOpen"  
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: myApplications.length,
            applications: myApplications
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const updateApplicationStatus = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const { status, notesByEmployer } = req.body;
        const currentUserId = req.user._id;

        const application = await Application.findById(applicationId).populate("job");
        if (!application) {
            return res.status(404).json({ message: "Application record not found." });
        }

        if (application.job.employer.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Not authorized to modify applications for this job." });
        }

        if (status) application.status = status;
        if (notesByEmployer) application.notesByEmployer = notesByEmployer;

        const updatedApplication = await application.save();

        return res.status(200).json({
            message: `Application status updated to ${application.status} successfully!`,
            application: updatedApplication
        });

    } catch (error) {
        next(error);
    }
};

