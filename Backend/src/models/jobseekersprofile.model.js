import mongoose from "mongoose";

const workExperienceSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (this.isCurrentJob && value) return false;
                if (!this.isCurrentJob && !value) return false;
                if (value && this.startDate && value < this.startDate) return false;
                return true;
            },
            message: "End date is required if not your current job, and must be after the start date."
        }
    },
    isCurrentJob: { type: Boolean, default: false },
    description: { type: String, trim: true }
});

const educationSchema = new mongoose.Schema({
    schoolName: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (this.isCurrentEducation && value) return false;
                if (!this.isCurrentEducation && !value) return false;
                if (value && this.startDate && value < this.startDate) return false;
                return true;
            },
            message: "End date is required if you are no longer studying here, and must be after the start date."
        }
    },
    isCurrentEducation: { type: Boolean, default: false }
});

const jobSeekerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    profilePicture: {
        type: String,
        trim: true
    },
    professionalHeadline: {
        type: String,
        trim: true,
        required: [true, "Please add a professional headline summarizing your role"]
    },
    bio: {
        type: String,
        trim: true
    },
    skills: {
        type: [String],
        default: []
    },
    experience: [workExperienceSchema],
    education: [educationSchema],

    resumeUrl: {
        type: String,
        trim: true
    },

     region: { 
        type: String, 
        trim: true, 
        index: true 
    },
    district: { 
        type: String, 
        trim: true, 
        index: true 
    },
   
    location: { 
        type: String, 
        trim: true, 
        default: "" 
    },

    workMode: {
        type: String,
        enum: ["On-site", "Remote", "Hybrid"],
        default: "On-site",
        index: true,

    },

    preferredJobTypes: {
        type: [String],
        lowercase: true,
        enum: ["full-time", "part-time", "contract", "remote", "internship", "hybrid"],
        default: []
    },
    expectedSalary: {
        min: { type: Number, min: 0 },
        currency: { type: String, default: "GHS" }
    },
    isSearchingForJob: {
        type: Boolean,
        default: true,
        index: true
    }
}, { timestamps: true });

// Weighted text index optimized for algorithmic searches
jobSeekerProfileSchema.index(
    { skills: 'text', professionalHeadline: 'text', bio: 'text' },
    { weights: { skills: 10, professionalHeadline: 5, bio: 1 } }
);

export const JobSeekerProfile = mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);
