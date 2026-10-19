import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { Job } from "../models/job.model.js"
import { Application } from "../models/application.model.js"

const getCloudinaryPublicId = (url) => {
    if (!url) return null;
    try {
        // Splits URL to isolate the folder and filename without extension
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        const publicIdWithExtension = parts[1].replace(/^v\d+\//, ''); // Removes version tag like v1234567
        return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    } catch (error) {
        console.error("Failed to parse Cloudinary Public ID:", error);
        return null;
    }
};

export const createJob = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const imageFile = req.file;
        const {
            companyName,
            title,
            description,
            category,
            jobType,
            workMode,
            salaryMin, 
            salaryMax, 
            currency,
            phoneNumber,
            emailForApplications,
            region,
            district,
            location,
            requirements,
            benefits,
            applicationDeadline
        } = req.body;

        const errors = [];

        if (!companyName || !String(companyName).trim()) errors.push("Company name is required.");
        if (!title || !String(title).trim()) errors.push("Job title is required.");
        if (!description || !String(description).trim()) errors.push("Job description is required.");
        if (!region || !String(region).trim()) errors.push("Operating region is required.");
        if (!district || !String(district).trim()) errors.push("Local district/city is required.");
        if (!location || !String(location).trim()) errors.push("Specific location address is required.");
        
        if (emailForApplications && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForApplications.trim())) {
            errors.push("Invalid application email format.");
        }

        if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
            errors.push("Minimum salary cannot be greater than maximum salary.");
        }

        let deadlineDate;
        if (applicationDeadline) {
            deadlineDate = new Date(applicationDeadline);
            if (isNaN(deadlineDate.getTime())) {
                errors.push("Application deadline must be a valid date.");
            } else if (deadlineDate < new Date()) {
                errors.push("Application deadline cannot be in the past.");
            }
        }

        
        if (!imageFile) {
            errors.push("A job banner image file is required by the schema index rules.");
        }

        if (errors.length > 0) {
            console.log("❌ SERVER SIDE VALIDATION FAILED:", errors);
            return res.status(400).json({ success: false, errors });
        }

      
        let imageUrl = "";
        try {
            const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
            const uploadResponse = await cloudinary.uploader.upload(base64Image, {
                folder: "job_banners",
                resource_type: "image",
                transformation: [
                    { width: 800, height: 600, crop: "limit" },
                    { quality: "auto" },
                    { format: "auto" }
                ]
            });
            
            imageUrl = uploadResponse.secure_url;
            
            
            if (!imageUrl) {
                throw new Error("Cloudinary returned an empty secure_url string stream.");
            }
        } catch (uploadError) {
            console.error("❌ CLOUDINARY UPLOAD FAILURE TRACE:", uploadError);
            return res.status(400).json({ 
                success: false, 
                errors: ["Cloudinary asset processing failed. Verify server storage environment keys."] 
            });
        }

        
        const parseArrayField = (field) => {
            if (Array.isArray(field)) return field;
            if (typeof field === 'string' && field.trim()) {
                try { return JSON.parse(field); } catch { return field.split('\n').map(str => str.trim()).filter(Boolean); }
            }
            return [];
        };

        const newJob = new Job({
            employer: userId,
            companyName: String(companyName).trim(),
            jobImage: imageUrl, 
            title: String(title).trim(),
            description: String(description).trim(),
            category: category ? String(category).trim() : "Other",
            jobType: jobType ? String(jobType).trim() : "Full-time",
            workMode: workMode ? String(workMode).trim() : "On-site",
            salary: {
                min: salaryMin ? Number(salaryMin) : 0,
                max: salaryMax ? Number(salaryMax) : 0,
                currency: currency || "GHS",
                period: req.body.salaryPeriod || "monthly"
            },
            phoneNumber: phoneNumber || undefined,
            emailForApplications: emailForApplications ? String(emailForApplications).trim() : undefined,
            region: String(region).trim(),
            district: String(district).trim(),
            location: String(location).trim(),
            requirements: parseArrayField(requirements),
            benefits: parseArrayField(benefits),
            applicationDeadline: deadlineDate || undefined,
            isOpen: true
        });

        const savedJob = await newJob.save();

        return res.status(201).json({
            success: true,
            message: "Job vacancy published successfully",
            job: savedJob
        });
    } catch (error) {
        next(error);
    }
};


export const getAllJobs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isOpen: true };

    
        if (req.query.search && String(req.query.search).trim()) {
            const cleanSearch = String(req.query.search).trim();
            
            
            if (cleanSearch.length < 3) {
                filter.$or = [
                    { title: { $regex: cleanSearch, $options: "i" } },
                    { companyName: { $regex: cleanSearch, $options: "i" } }
                ];
            } else {
                // Use strict compound text index execution for long phrases
                filter.$text = { $search: cleanSearch };
            }
        }

        if (req.query.category) filter.category = String(req.query.category).trim().toLowerCase();
        if (req.query.jobType) filter.jobType = String(req.query.jobType).trim().toLowerCase();
        if (req.query.workMode) filter.workMode = String(req.query.workMode).trim().toLowerCase();
        if (req.query.region) filter.region = String(req.query.region).trim();
        if (req.query.district) filter.district = String(req.query.district).trim();

        
        const selectFields = "companyName jobImage title description category jobType workMode salary region district location createdAt";

        
        let queryExec = Job.find(filter).lean();

        if (filter.$text) {
            queryExec = queryExec
                .select(selectFields)
                .select({ score: { $meta: "textScore" } }) 
                .sort({ score: { $meta: "textScore" } });
        } else {
            queryExec = queryExec
                .select(selectFields)
                .sort({ createdAt: -1 });
        }

        const [jobs, totalJobs] = await Promise.all([
            queryExec
                .skip(skip)
                .limit(limit)
                .populate("employer", "name firstName lastName profilePicture"), 
            Job.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            jobs,
            pagination: {
                totalJobs,
                currentPage: page,
                totalPages: Math.ceil(totalJobs / limit),
                hasNextPage: skip + jobs.length < totalJobs
            }
        });
    } catch (error) {
        next(error);
    }
};


export const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params
        const job = await Job.findById(id)
            .populate("employer", "firstName lastName profilePicture phoneNumber email")
            .lean();

        if (!job) {
            return res.status(404).json({ success: false, message: "Requested vacancy listing could not be found" });
        }

        return res.status(200).json({ success: true, job });
    } catch (error) {
        next(error);
    }
};

export const editJob = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params; 
        const imageFile = req.file;

        let job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job listing not found" });
        }

        if (!job.employer.equals(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized action. You do not own this listing" });
        }

        const errors = [];
        const {
            companyName, title, description, category, jobType, workMode,
            minSalary, maxSalary, currency, phoneNumber, emailForApplications,
            region, district, location, requirements, benefits, applicationDeadline
        } = req.body;

        // ========================================================
        // 1. CONDITIONAL INPUT VALIDATION CHECKS (Before Uploading)
        // ========================================================
        if (companyName !== undefined && !companyName.trim()) errors.push("Company name cannot be empty.");
        if (title !== undefined && !title.trim()) errors.push("Job title cannot be empty.");
        if (description !== undefined && !description.trim()) errors.push("Job description cannot be empty.");

        if (emailForApplications && !/^[^\s@]+@[^\s@]+\.[^\s@]+\$/.test(emailForApplications)) {
            errors.push("Invalid application email format.");
        }

        const finalMin = minSalary !== undefined ? Number(minSalary) : job.salary?.min;
        const finalMax = maxSalary !== undefined ? Number(maxSalary) : job.salary?.max;
        if (finalMin && finalMax && finalMin > finalMax) {
            errors.push("Minimum salary cannot be greater than maximum salary.");
        }

        let deadlineDate;
        if (applicationDeadline) {
            deadlineDate = new Date(applicationDeadline);
            if (isNaN(deadlineDate.getTime())) {
                errors.push("Application deadline must be a valid date.");
            } else if (deadlineDate < new Date()) {
                errors.push("Application deadline cannot be in the past.");
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        let newImageUrl = null;

        if (imageFile) {
            try {
                // Upload new image first to verify it works before touching the database
                const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
                const uploadResponse = await cloudinary.uploader.upload(base64Image, {
                    folder: "social_media_posts",
                    resource_type: "image",
                    transformation: [
                        { width: 800, height: 600, crop: "limit" },
                        { quality: "auto" },
                        { format: "auto" }
                    ]
                });
                
                newImageUrl = uploadResponse.secure_url;

                // Secure Deletion of Old Image (Only if an old image existed)
                if (job.jobImage) {
                    const oldPublicId = getCloudinaryPublicId(job.jobImage);
                    if (oldPublicId) {
                        cloudinary.uploader.destroy(oldPublicId)
                            .then(result => console.log(`Old image deleted from Cloudinary: ${oldPublicId}`))
                            .catch(err => console.error("Cloudinary asset cleanup failed:", err));
                    }
                }
            } catch (uploadError) {
                console.error("Cloudinary asset rotation error:", uploadError);
                return res.status(500).json({ success: false, error: "Failed to upload new banner image." });
            }
        }

        
        const updates = {};

        if (companyName !== undefined) updates.companyName = companyName.trim();
        if (title !== undefined) updates.title = title.trim();
        if (description !== undefined) updates.description = description.trim();
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
        if (emailForApplications !== undefined) updates.emailForApplications = emailForApplications;
        if (region !== undefined) updates.region = region;
        if (district !== undefined) updates.district = district;
        if (location !== undefined) updates.location = location;
        if (applicationDeadline !== undefined) updates.applicationDeadline = deadlineDate;

        if (category !== undefined) updates.category = String(category).trim().toLowerCase();
        if (jobType !== undefined) updates.jobType = String(jobType).trim().toLowerCase();
        if (workMode !== undefined) updates.workMode = String(workMode).trim().toLowerCase();

        
        if (newImageUrl) updates.jobImage = newImageUrl;

        // Secure sub-field paths
        if (minSalary !== undefined) updates["salary.min"] = minSalary ? Number(minSalary) : null;
        if (maxSalary !== undefined) updates["salary.max"] = maxSalary ? Number(maxSalary) : null;
        if (currency !== undefined) updates["salary.currency"] = currency || "GHS";

        const parseArrayField = (field) => {
            if (Array.isArray(field)) return field;
            if (typeof field === 'string' && field.trim()) {
                try { return JSON.parse(field); } catch { return [field]; }
            }
            return field;
        };

        if (requirements !== undefined) updates.requirements = parseArrayField(requirements);
        if (benefits !== undefined) updates.benefits = parseArrayField(benefits);

      
        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Job details revised successfully",
            job: updatedJob
        });
    } catch (error) {
        next(error);
    }
};

export const deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ success: false, message: "Target listing was not located" });
        }

        if (!job.employer.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Cannot delete another operator's items"
            });
        }

        
        if (job.jobImage) {
            const publicId = getCloudinaryPublicId(job.jobImage);
            if (publicId) {
                
                cloudinary.uploader.destroy(publicId)
                    .then(result => console.log(`Deleted orphaned job image from Cloudinary: ${publicId}`))
                    .catch(err => console.error("Failed to clear cloud asset on job deletion:", err));
            }
        }

        await Application.deleteMany({ job: id });
        await job.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Job listing permanently withdrawn from public indexes"
        });
    } catch (error) {
        next(error);
    }
};


export const toggleJobStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const userId = req.user?._id; 

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid Job ID parameters format layout structure."
            });
            return;
        }

        const job = await Job.findById(id);

        if (!job) {
            res.status(404).json({
                success: false,
                message: "Requested job posting workspace could not be found."
            });
            return;
        }

        
        if (!job.employer.equals(userId)) {
            res.status(403).json({
                success: false,
                message: "Action Denied. You do not have permission to modify this listing."
            });
            return;
        }

        
        job.isOpen = !job.isOpen;
        await job.save();

        
        res.status(200).json({
            success: true,
            message: `Job position successfully ${job.isOpen ? 're-opened for applications' : 'closed to new candidates'}.`,
            job
        });

    } catch (error) {
        console.error("Error inside toggleJobStatus controller pipeline execution:", error);
      next(error)
    }
};




