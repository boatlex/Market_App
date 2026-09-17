import { JobSeekerProfile } from "../models/jobseekersprofile.model.js";
import cloudinary from "cloudinary";

export const upsertJobSeekerProfile = async (req, res, next) => {
    try {
        const userId = req.user._id; 
        
        const {
            professionalHeadline,
            bio,
            skills,               
            experience,           
            education,            
            preferredJobTypes,    
            expectedSalaryMin,
            expectedSalaryCurrency,
            isSearchingForJob
        } = req.body;

        const profileImageFile = req.file; 

        if (!professionalHeadline) {
            return res.status(400).json({ message: "Professional headline is required." });
        }

        let profilePictureUrl;
        if (profileImageFile) {
            try {
                const base64Image = `data:${profileImageFile.mimetype};base64,${profileImageFile.buffer.toString('base64')}`;
                const uploadResponse = await cloudinary.uploader.upload(base64Image, {
                    folder: "user_profiles",
                    resource_type: "image",
                    transformation: [
                        { width: 400, height: 400, crop: "thumb", gravity: "face" },
                        { quality: "auto" }
                    ]
                });
                profilePictureUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary profile picture upload error:", uploadError);
                return res.status(400).json({ error: "Failed to upload profile picture." });
            }
        }

        // 3. Clean up arrays (Splits comma strings if sent via multipart form data)
        const processedSkills = Array.isArray(skills) 
            ? skills 
            : skills ? skills.split(",").map(s => s.trim()) : [];

        const processedJobTypes = Array.isArray(preferredJobTypes)
            ? preferredJobTypes.map(t => t.toLowerCase())
            : preferredJobTypes ? preferredJobTypes.split(",").map(t => t.trim().toLowerCase()) : [];

        // 4. Build the update object dynamically
        const profileData = {
            user: userId,
            professionalHeadline,
            bio,
            skills: processedSkills,
            experience: experience || [],
            education: education || [],
            preferredJobTypes: processedJobTypes,
            expectedSalary: {
                min: expectedSalaryMin || 0,
                currency: expectedSalaryCurrency || "GHS"
            },
            isSearchingForJob: isSearchingForJob !== undefined ? isSearchingForJob : true
        };

        // If a new picture was uploaded, add it to our updates
        if (profilePictureUrl) {
            profileData.profilePicture = profilePictureUrl;
        }

        // 5. Upsert operation: Find by user ID. If found, update. If not, insert a new record.
        const profile = await JobSeekerProfile.findOneAndUpdate(
            { user: userId },
            { $set: profileData },
            { new: true, upsert: true, runValidators: true }
        ).populate("user", "name email")

        return res.status(200).json({
            message: "Profile updated successfully!",
            profile
        });

    } catch (error) {
        next(error);
    }
};


// BONUS: GET CURRENT USER'S PROFILE CARD
export const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const profile = await JobSeekerProfile.findOne({ user: userId })
            .populate("user", "name email profilePicture");

        if (!profile) {
            return res.status(404).json({ message: "Profile details not found. Please create one." });
        }

        return res.status(200).json({ profile });
    } catch (error) {
        next(error);
    }
};
