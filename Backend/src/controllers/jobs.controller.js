import cloudinary from "../config/cloudinary.js";
import { Job } from "../models/job.model.js"


export const createJob = async (req, res, next) => {
    try {
        const {
            companyName,
            companyLogo,
            title,
            description,
            category,
            jobType,
            workMode,
            salaryMin,
            salaryMax,
            salaryCurrency,
            phoneNumber,
            emailForApplications,
            region,
            district,
            requirements,
            benefits,
            applicationDeadline
        } = req.body;
        
        const jobImage = req.file;
        const employerId = req.user._id; 

        
        if (!companyName || !title || !description || !category || !jobType || !workMode || !region || !district || !jobImage) {
            return res.status(400).json({ message: "Please fill in all required fields." });
        }

        let imageUrl = "";

        
        if (jobImage) {
            try {
            
                const base64Image = `data:${jobImage.mimetype};base64,${jobImage.buffer.toString('base64')}`;
                
                const uploadResponse = await cloudinary.uploader.upload(base64Image, {
                    folder: "job_postings", 
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
        const newJob = new Job({
            employer: employerId,
            companyName,
            companyLogo,
            title,
            description,
            category,
            jobType,
            workMode,
            salary: {
                min: salaryMin,
                max: salaryMax,
                currency: salaryCurrency || "GHS" 
            },
            phoneNumber,
            emailForApplications,
            region,
            district,
            requirements: requirements || [], 
            benefits: benefits || [],         
            applicationDeadline,
            jobImage: imageUrl 
        });

        const savedJob = await newJob.save();

        return res.status(201).json({
            message: "Job posted successfully!",
            job: savedJob
        });

    } catch (error) {
        next(error)
    }
};

export const getAllJobs = async (req, res, next) => {
    try {
        
        const page = parseInt(req.query.page) || 1;    // Defaults to page 1
        const limit = parseInt(req.query.limit) || 10; // Defaults to 10 jobs per page
        const skip = (page - 1) * limit;               // Skips items from earlier pages

        // 2. Build a dynamic filter object based on what the user selects
        const queryFilter = { isOpen: true }; // Only show active jobs

        // Filter by text search keyword (uses the schema text index)
        if (req.query.search) {
            queryFilter.$text = { $search: req.query.search };
        }

        // Filter by structural fields (converting to lowercase to match schema rules)
        if (req.query.category) {
            queryFilter.category = req.query.category.toLowerCase();
        }
        if (req.query.workMode) {
            queryFilter.workMode = req.query.workMode.toLowerCase();
        }
        if (req.query.region) {
            queryFilter.region = req.query.region;
        }

        // 3. Query the database with pagination parameters
        const jobs = await Job.find(queryFilter)
            .sort({ createdAt: -1 }) // Newest jobs show up first
            .skip(skip)
            .limit(limit)
            .populate("employer", "name companyName"); // Brings employer details along

        // 4. Count total matching jobs to calculate the total pages
        const totalJobs = await Job.countDocuments(queryFilter);
        const totalPages = Math.ceil(totalJobs / limit);

        // 5. Send back data along with helper page numbers
        return res.status(200).json({
            currentPage: page,
            totalPages,
            totalJobs,
            jobsPerPage: jobs.length,
            jobs
        });

    } catch (error) {
       next(error)
    }
};
