import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job", 
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    resume: {
        type: String, 
        required: [true, "Please upload your resume to apply"],
        trim: true
    },
    coverLetter: {
        type: String,
        trim: true // Optional text if they want to introduce themselves
    },
    status: {
        type: String,
        trim: true,
        default: 'Pending',
        enum: {
            values: ['Pending', 'Reviewed', 'Interviewing', 'Hired', 'Rejected'],
            message: '{VALUE} is not a valid application status'
        }
    },
    notesByEmployer: {
        type: String,
        trim: true // Private notes for the employer to write down interview feedback
    }
}, { timestamps: true });

// This prevents a user from applying to the exact same job post more than once
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
