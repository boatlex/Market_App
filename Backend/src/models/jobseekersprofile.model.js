import mongoose from "mongoose";

const workExperienceSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    location: { type: String, trim: true }, 
    startDate: { type: Date, required: true },
    endDate: { type: Date }, 
    isCurrentJob: { type: Boolean, default: false },
    description: { type: String, trim: true } 
});

const educationSchema = new mongoose.Schema({
    schoolName: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true }, 
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date }
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
        type: String, // e.g., "Full-Stack Developer | React & Node.js specialist"
        trim: true,
        required: [true, "Please add a professional headline summarizing your role"]
    },
    bio: {
        type: String, // Short summary about themselves
        trim: true
    },
    skills: {
        type: [String], // Array of skills: ["JavaScript", "Accounting", "Customer Service"]
        default: []
    },
    experience: [workExperienceSchema], 
    education: [educationSchema],       
    
    resumeUrl: {
        type: String,
        trim: true
    },
    
    preferredJobTypes: {
        type: [String], // ["full-time", "remote", "internship"]
        lowercase: true,
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

// Compound text index to allow employers to search profiles by skills or headline
jobSeekerProfileSchema.index({ professionalHeadline: 'text', skills: 'text', bio: 'text' });

export const JobSeekerProfile = mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);
