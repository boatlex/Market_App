import cloudinary from "../config/cloudinary.js";
import { Job } from "../models/job.model.js"


export const createJob = async (req, res, next) => {
    try {
        const userId = req.user._id
        const {
            companyName,
            jobImage,
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

        
        const newJob = new Job({
            employer: userId, 
            companyName,
            jobImage,
            title,
            description,
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
            requirements: Array.isArray(requirements) ? requirements : [],
            benefits: Array.isArray(benefits) ? benefits : [],
            applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined
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

 
export const getJobs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isOpen: true };

        
        if (req.query.search) {
            filter.$text = { $search: String(req.query.search) };
        }
        if (req.query.category) filter.category = String(req.query.category).trim().toLowerCase();
        if (req.query.jobType) filter.jobType = String(req.query.jobType).trim().toLowerCase();
        if (req.query.workMode) filter.workMode = String(req.query.workMode).trim().toLowerCase();
        if (req.query.region) filter.region = String(req.query.region);
        if (req.query.district) filter.district = String(req.query.district);

        // Sorting configuration
        const sortCriteria = req.query.search 
            ? { score: { $meta: "textScore" } } 
            : { createdAt: -1 };

        const selectFields = "companyName jobImage title description category jobType workMode salary region district location createdAt";

        const [jobs, totalJobs] = await Promise.all([
            Job.find(filter)
                .select(req.query.search ? { ...Object.fromEntries(selectFields.split(" ").map(f => [f, 1])), score: { $meta: "textScore" } } : selectFields)
                .sort(sortCriteria)
                .skip(skip)
                .limit(limit)
                .populate("employer", "firstName lastName profilePicture")
                .lean(), 
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
        const {id} = req.params
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
              const {id}=reg.param
        let job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job listing not found" });
        }

    
        if (!job.employer.equal(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized action. You do not own this listing" });
        }

        const updates = { ...req.body };

        
        if (updates.category) updates.category = String(updates.category).trim().toLowerCase();
        if (updates.jobType) updates.jobType = String(updates.jobType).trim().toLowerCase();
        if (updates.workMode) updates.workMode = String(updates.workMode).trim().toLowerCase();

        
        if (updates.minSalary || updates.maxSalary || updates.currency) {
            updates.salary = {
                min: updates.minSalary !== undefined ? Number(updates.minSalary) : job.salary?.min,
                max: updates.maxSalary !== undefined ? Number(updates.maxSalary) : job.salary?.max,
                currency: updates.currency || job.salary?.currency || "GHS"
            };
        }

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
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

        await job.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Job listing permanently withdrawn from public indexes"
        });
    } catch (error) {
        next(error);
    }
};


