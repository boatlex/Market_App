import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";
import cloudinary from "cloudinary";

const getPublicIdFromUrl = (url) => {
    try {
        if (!url) return null;
        const parts = url.split("/");
        const folderAndFile = parts.slice(parts.indexOf("job_resumes")).join("/"); 
        return folderAndFile.split(".")[0];
    } catch (e) {
        return null;
    }
}

export const updateResume = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const newResumeFile = req.file; 

        
        if (!newResumeFile) {
            return res.status(400).json({ message: "Please select a PDF or Word document to upload." });
        }

        
        const profile = await JobSeekerProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found. Please create your profile headline first." });
        }

        
        if (profile.resumeUrl) {
            const oldPublicId = getPublicIdFromUrl(profile.resumeUrl);
            if (oldPublicId) {
                await cloudinary.uploader.destroy(oldPublicId, { resource_type: "raw" }).catch(err => 
                    console.error("Skipped deleting old asset:", err)
                );
            }
        }

        
        let uploadedUrl = "";
        try {
            const base64File = `data:${newResumeFile.mimetype};base64,${newResumeFile.buffer.toString('base64')}`;
            const uploadResponse = await cloudinary.uploader.upload(base64File, {
                folder: "job_resumes",
                resource_type: "raw" 
            });
            uploadedUrl = uploadResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary resume upload error:", uploadError);
            return res.status(400).json({ error: "Failed to upload the new resume file." });
        }

        
        profile.resumeUrl = uploadedUrl;
        await profile.save();

        return res.status(200).json({
            message: "Resume updated successfully!",
            resumeUrl: profile.resumeUrl
        });

    } catch (error) {
        next(error);
    }
}

export const deleteMyProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // 1. Find the user's profile card first
        const profile = await JobSeekerProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ message: "Profile profile details not found." });
        }

        // 2. Clear out the profile picture from Cloudinary if it exists
        if (profile.profilePicture) {
            const picPublicId = getPublicIdFromUrl(profile.profilePicture, "user_profiles");
            if (picPublicId) {
                await cloudinary.uploader.destroy(picPublicId).catch(err => 
                    console.error("Failed to delete profile pic asset:", err)
                );
            }
        }

        // 3. Clear out the resume document from Cloudinary if it exists
        if (profile.resumeUrl) {
            const resumePublicId = getPublicIdFromUrl(profile.resumeUrl, "job_resumes");
            if (resumePublicId) {
                await cloudinary.uploader.destroy(resumePublicId, { resource_type: "raw" }).catch(err => 
                    console.error("Failed to delete resume asset:", err)
                );
            }
        }

        
        await JobSeekerProfile.findOneAndDelete({ user: userId });

        return res.status(200).json({
            message: "Your profile card and all attached media files have been permanently deleted."
        });

    } catch (error) {
        next(error);
    }
}

export const searchCandidates = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;    
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit;

        // 2. Build the filter (Only show candidates actively open to work)
        const filter = { isSearchingForJob: true };

        // If the employer types a search keyword, use MongoDB text search
        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }

        if (req.query.jobType) {
            filter.preferredJobTypes = req.query.jobType.toLowerCase();
        }

        const candidates = await JobSeekerProfile.find(filter)
            .select("professionalHeadline skills bio profilePicture preferredJobTypes user") // Grab summary fields
            .populate("user", "name email") // Fetch their name and email from the User model
            .skip(skip)
            .limit(limit);

        const totalCandidates = await JobSeekerProfile.countDocuments(filter);
        const totalPages = Math.ceil(totalCandidates / limit);

        // 5. Return data along with page helper variables
        return res.status(200).json({
            currentPage: page,
            totalPages,
            totalCandidates,
            candidatesPerPage: candidates.length,
            candidates
        });

    } catch (error) {
        next(error);
    }
};


