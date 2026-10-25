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
            phoneNumber, 
            workMode
        } = req.body;

        if (!professionalHeadline) {
            return res.status(400).json({ message: "Professional headline is required." });
        }

        // Sub-array parser
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
        const processedJobTypes = parseSubArray(preferredJobTypes);
        const processedExperience = parseSubArray(experience);
        const processedEducation = parseSubArray(education);

        const validatedWorkMode = ((mode) => {
            if (!mode) return "On-site";
            const normal = mode.trim().toLowerCase();
            if (normal === "remote") return "Remote";
            if (normal === "hybrid") return "Hybrid";
            return "On-site";
        })(workMode);

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
            phoneNumber: phoneNumber || "",
            workMode: validatedWorkMode
        };

        if (req.body.experience !== undefined) updateData.experience = processedExperience;
        if (req.body.education !== undefined) updateData.education = processedEducation;

        // 🛠️ MULTI-FILE CLOUDINARY ENGINE LOGIC
        if (req.files) {
            // 1. Process Profile Picture if present
            if (req.files["image"] && req.files["image"][0]) {
                const imgFile = req.files["image"][0];
                try {
                    const base64Image = `data:${imgFile.mimetype};base64,${imgFile.buffer.toString('base64')}`;
                    const uploadResponse = await cloudinary.v2.uploader.upload(base64Image, {
                        folder: "user_profiles",
                        resource_type: "image",
                        transformation: [
                            { width: 400, height: 400, crop: "thumb", gravity: "face" },
                            { quality: "auto" }
                        ]
                    });
                    updateData.profilePicture = uploadResponse.secure_url;
                } catch (uploadError) {
                    console.error("Cloudinary image upload error:", uploadError);
                    return res.status(400).json({ message: "Failed to upload profile picture." });
                }
            }

            // 2. Process Resume Document PDF if present
            if (req.files["resume"] && req.files["resume"][0]) {
                const docFile = req.files["resume"][0];
                try {
                    const base64Doc = `data:${docFile.mimetype};base64,${docFile.buffer.toString('base64')}`;
                    const uploadResponse = await cloudinary.v2.uploader.upload(base64Doc, {
                        folder: "user_resumes",
                        resource_type: "raw", // 👈 Crucial for raw PDF document file assets
                        flags: "attachment"
                    });
                    updateData.resumeUrl = uploadResponse.secure_url;
                } catch (uploadError) {
                    console.error("Cloudinary resume upload error:", uploadError);
                    return res.status(400).json({ message: "Failed to upload resume file document." });
                }
            }
        }

        const profile = await JobSeekerProfile.findOneAndUpdate(
            { user: userId },
            {
                $setOnInsert: { user: userId },
                $set: updateData
            },
            { returnDocument: "after", upsert: true, runValidators: true }
        ).populate("user", "firstName lastName profilePicture email");

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
            query.region = { $regex: new RegExp(`^${region.trim()}$`, "i") };
        }

        if (district) {
            query.district = { $regex: new RegExp(`^${district.trim()}$`, "i") };
        }

        if (workMode) {
            query.workMode = { $regex: new RegExp(`^${workMode.trim()}$`, "i") };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const profiles = await JobSeekerProfile.find(query)
            .select(keyword ? { score: { $meta: "textScore" } } : {})
            .sort(keyword ? { score: { $meta: "textScore" } } : { updatedAt: -1 })
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

        // Use findOne because your upsert controller enforces 1 profile per user
        const profile = await JobSeekerProfile.findOne({ user: userId })
            .populate("user", "firstName lastName email profilePicture");

        return res.status(200).json({
            success: true,
            resultsCount: profile ? 1 : 0, 
            profile: profile || null // Returns the profile object directly or null if none exists
        });

    } catch (error) {
        next(error);
    }
};


export const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const profile = await JobSeekerProfile.findOne({ user: userId })
            .populate("user", "firstName lastName email profilePicture");

        if (!profile) {
            return res.status(200).json({
                message: "New account detected.",
                isNewUser: true,
                profile: {
                    user: {
                        _id: userId,
                        firstName: req.user.firstName || "",
                        lastName: req.user.lastName || "",
                        email: req.user.email || "",
                        profilePicture: req.user.profilePicture || ""
                    },
                    professionalHeadline: "",
                    bio: "",
                    skills: [],
                    experience: [],
                    education: [],
                    preferredJobTypes: [],
                    expectedSalary: { min: 0, currency: "GHS" }, 
                    profilePicture: "",
                    phoneNumber: "",
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

export const getMyJobSeekingAdById = async (req, res, next) => {
    try {
        const { profileId } = req.params;

        const jobSeeker = await JobSeekerProfile.findById(profileId)
            .populate("user", "firstName lastName profilePicture");

        if (!jobSeeker) {
            return res.status(404).json({ error: "Ad Not Found" });
        }

        return res.status(200).json({ data: jobSeeker });
    } catch (error) {
        next(error);
    }
};


export const deleteJobSeekerProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

    
        const profile = await JobSeekerProfile.findOne({ user: userId });
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "No active candidate profile registry row found for this account entry."
            });
        }

        const publicIdsToDestroy = [];

        const extractPublicId = (url, folderName) => {
            try {
                const urlSegments = url.split("/");
                const filenameWithExtension = urlSegments[urlSegments.length - 1];
                const publicIdWithoutExtension = filenameWithExtension.split(".")[0];
                return `${folderName}/${publicIdWithoutExtension}`;
            } catch (err) {
                console.error("Failed to parse publicId from url:", url, err);
                return null;
            }
        };

    
        if (profile.profilePicture && profile.profilePicture.includes("cloudinary.com")) {
            const imgId = extractPublicId(profile.profilePicture, "user_profiles");
            if (imgId) publicIdsToDestroy.push({ id: imgId, type: "image" });
        }

        
        if (profile.resumeUrl && profile.resumeUrl.includes("cloudinary.com")) {
            const docId = extractPublicId(profile.resumeUrl, "user_resumes");
            if (docId) publicIdsToDestroy.push({ id: docId, type: "raw" });
        }

        
        if (publicIdsToDestroy.length > 0) {
            try {
                await Promise.all(
                    publicIdsToDestroy.map((asset) => 
                        cloudinary.v2.uploader.destroy(asset.id, { resource_type: asset.type })
                    )
                );
            } catch (cloudinaryError) {
                console.error("Cloudinary storage background purge dropped:", cloudinaryError);
            
            }
        }

        
        try {
            await Job.updateMany(
                { applications: profile._id },
                { $pull: { applications: profile._id } }
            );
        } catch (relationError) {
            console.error("Relational schema cascade cleanup error:", relationError);
        }

    
        await JobSeekerProfile.findOneAndDelete({ user: userId });

        return res.status(200).json({
            success: true,
            message: "Your job seeker candidate profile and associated storage assets have been permanently removed."
        });

    } catch (error) {
        next(error);
    }
};



