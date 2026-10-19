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
            isSearchingForJob,
            region,
            district,
            location,
            workMode
        } = req.body;

        const profileImageFile = req.file;

        if (!professionalHeadline) {
            return res.status(400).json({ message: "Professional headline is required." });
        }


        const parseSubArray = (data) => {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            try {
                return JSON.parse(data);
            } catch {
                return typeof data === 'string' ? data.split(",").map(s => s.trim()) : [];
            }
        };

        const processedSkills = parseSubArray(skills);
        const processedJobTypes = parseSubArray(preferredJobTypes).map(t => t.toLowerCase());
        const processedExperience = parseSubArray(experience);
        const processedEducation = parseSubArray(education);


        const formatWorkMode = (mode) => {
            if (!mode) return "On-site";
            const normal = mode.trim().toLowerCase();
            if (normal === "remote") return "Remote";
            if (normal === "hybrid") return "Hybrid";
            if (normal === "on-site" || normal === "onsite") return "On-site";
            return "On-site"; 
        };

        const validatedWorkMode = formatWorkMode(workMode);

        
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
                return res.status(400).json({ message: "Failed to upload profile picture." });
            }
        }

        
        const updateData = {
            professionalHeadline,
            bio,
            skills: processedSkills,
            preferredJobTypes: processedJobTypes,
            expectedSalary: {
                min: Number(expectedSalaryMin) || 0,
                currency: expectedSalaryCurrency || "GHS"
            },
            isSearchingForJob: isSearchingForJob === 'false' ? false : Boolean(isSearchingForJob),
            region: region || "",
            district: district || "",
            location: location || "",
            workMode: validatedWorkMode 
        };

        if (req.body.experience !== undefined) updateData.experience = processedExperience;
        if (req.body.education !== undefined) updateData.education = processedEducation;

        if (profilePictureUrl) {
            updateData.profilePicture = profilePictureUrl;
        }

            
        const profile = await JobSeekerProfile.findOneAndUpdate(
            { user: userId },
            {
                $setOnInsert: { user: userId },
                $set: updateData
            },
            { returnDocument: "after", upsert: true, runValidators: true }
        ).populate("user", "name email");


        return res.status(200).json({
            message: "Profile updated successfully!",
            profile
        });

    } catch (error) {
        next(error);
    }
};


export const searchCandidatePool = async (req, res, next) => {
    try {
        const { 
            keyword,    
            region,     
            district,   
            workMode,  
            page = 1, 
            limit = 10 
        } = req.query;

        
        const query = {};


        query.isSearchingForJob = true;

       if (keyword) {
            query.$text = { $search: String(keyword) };
        }

        if (region) {
            query.region = {$regex: new RegExp(`^${region.trim()}$`, "i") }; 
        }

        if (district) {
            query.district = {$regex: new RegExp(`^${district.trim()}$`, "i") };
        }

        if (workMode) {
            query.workMode = {$regex: new RegExp(`^${workMode.trim()}$`, "i") };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const profiles = await JobSeekerProfile.find(query)
            .select(keyword ? { score: {$meta: "textScore" } } : {}) 
            .sort(keyword ? { score: {$meta: "textScore" } } : { updatedAt: -1 }) 
            .skip(skip)
            .limit(Number(limit))
            .populate("user", "firstName lastName email profilePicture");

        
        const totalProfiles = await JobSeekerProfile.countDocuments(query);

        return res.status(200).json({
            success: true,
            resultsCount: profiles.length,
            totalPages: Math.ceil(totalProfiles / Number(limit)),
            currentPage: Number(page),
            profiles
        });

    } catch (error) {
        next(error);
    }
};

export const getMyJobSeekingAds = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const profiles = await JobSeekerProfile.find({ user: userId })
            .populate("user", "firstName lastName email profilePicture")
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            resultsCount: profiles.length,
            profiles
        });

    } catch (error) {
        next(error);
    }
};

export const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const profile = await JobSeekerProfile.findOne({ user: userId })
            .populate("user", "name email");

        if (!profile) {
            return res.status(200).json({
                message: "New account detected.",
                isNewUser: true,
                profile: {
                    user: { _id: userId, name: req.user.name, email: req.user.email },
                    professionalHeadline: "",
                    bio: "",
                    skills: [],
                    experience: [],
                    education: [],
                    preferredJobTypes: [],
                    expectedSalary: { min: 0, currency: "GHS" },
                    profilePicture: "",
                    isSearchingForJob: true
                }
            });
        }

        return res.status(200).json({
            isNewUser: false,
            profile
        });

    } catch (error) {
        next(error);
    }
};

