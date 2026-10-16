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
            minSalary,
            maxSalary,
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

        // ========================================================
        // 1. CONDITIONAL INPUT VALIDATION CHECKS
        // ========================================================
        const errors = [];

        if (!companyName || !companyName.trim()) errors.push("Company name is required.");
        if (!title || !title.trim()) errors.push("Job title is required.");
        if (!description || !description.trim()) errors.push("Job description is required.");
        
        // Email validation if provided
        if (emailForApplications && !/^[^\s@]+@[^\s@]+\.[^\s@]+\$/.test(emailForApplications)) {
            errors.push("Invalid application email format.");
        }

        // Salary Logic Verification
        if (minSalary && maxSalary && Number(minSalary) > Number(maxSalary)) {
            errors.push("Minimum salary cannot be greater than maximum salary.");
        }

        // Date Validation
        let deadlineDate;
        if (applicationDeadline) {
            deadlineDate = new Date(applicationDeadline);
            if (isNaN(deadlineDate.getTime())) {
                errors.push("Application deadline must be a valid date.");
            } else if (deadlineDate < new Date()) {
                errors.push("Application deadline cannot be in the past.");
            }
        }

        // Return client errors immediately before processing files
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        // ========================================================
        // 2. IMAGE UPLOAD HANDLING
        // ========================================================
        let imageUrl = "";
        if (imageFile) {
            try {
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
                imageUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("cloudinary upload error", uploadError);
                return res.status(400).json({ error: "Failed To Upload Image" });
            }
        }

        // Safe array parsing helper for Form-Data fields
        const parseArrayField = (field) => {
            if (Array.isArray(field)) return field;
            if (typeof field === 'string' && field.trim()) {
                try { return JSON.parse(field); } catch { return [field]; }
            }
            return [];
        };

        // ========================================================
        // 3. DATABASE RECORD CREATION
        // ========================================================
        const newJob = new Job({
            employer: userId,
            companyName: companyName.trim(),
            jobImage: imageUrl,
            title: title.trim(),
            description: description.trim(),
            category: category ? String(category).trim().toLowerCase() : "posted jobs",
            jobType: jobType ? String(jobType).trim().toLowerCase() : "",
            workMode: workMode ? String(workMode).trim().toLowerCase() : "on-site",
            salary: {
                min: minSalary ? Number(minSalary) : undefined,
                max: maxSalary ? Number(maxSalary) : undefined,
                currency: currency || "GHS"
            },
            phoneNumber,
            emailForApplications,
            region,
            district,
            location,
            requirements: parseArrayField(requirements),
            benefits: parseArrayField(benefits),
            applicationDeadline: deadlineDate
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

        // 1. Dynamic Search Construction
        if (req.query.search && String(req.query.search).trim()) {
            const cleanSearch = String(req.query.search).trim();
            
            // OPTIMIZATION: Fallback logic for small terms or partial strings
            if (cleanSearch.length < 3) {
                // Use case-insensitive regex for short words (like "it", "dev") to avoid empty text index returns
                filter.$or = [
                    { title: { $regex: cleanSearch, $options: "i" } },
                    { companyName: { $regex: cleanSearch, $options: "i" } }
                ];
            } else {
                // Use strict compound text index execution for long phrases
                filter.$text = { $search: cleanSearch };
            }
        }

        // 2. Normalize Strict Field Filters
        if (req.query.category) filter.category = String(req.query.category).trim().toLowerCase();
        if (req.query.jobType) filter.jobType = String(req.query.jobType).trim().toLowerCase();
        if (req.query.workMode) filter.workMode = String(req.query.workMode).trim().toLowerCase();
        if (req.query.region) filter.region = String(req.query.region).trim();
        if (req.query.district) filter.district = String(req.query.district).trim();

        // 3. Define Clean Select Criteria
        const selectFields = "companyName jobImage title description category jobType workMode salary region district location createdAt";

        // Build execution pipelines
        let queryExec = Job.find(filter).lean();

        // FIX 1: Chain projections cleanly. TextScore metadata projection must be chained 
        // separately via .select() string paths to prevent mixed-object compiler crashes.
        if (filter.$text) {
            queryExec = queryExec
                .select(selectFields)
                .select({ score: { $meta: "textScore" } }) // Layer metadata independently
                .sort({ score: { $meta: "textScore" } });
        } else {
            queryExec = queryExec
                .select(selectFields)
                .sort({ createdAt: -1 });
        }

        // FIX 2: Double check field definitions. (Adjusting selection paths safely to fall back if necessary)
        const [jobs, totalJobs] = await Promise.all([
            queryExec
                .skip(skip)
                .limit(limit)
                .populate("employer", "name firstName lastName profilePicture"), // Safely pulls single name or split parameters
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



