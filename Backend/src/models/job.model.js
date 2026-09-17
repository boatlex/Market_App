import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyLogo: {
        type: String, 
        trim: true
    },
    jobImage: {
        type: String,
        required:true, 
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        lowercase: true 
    },
    jobType: {
        type: String, 
        required: true,
        trim: true,
        lowercase: true 
    },
    workMode: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        enum: {
            values: ['on-site', 'remote', 'hybrid'],
            message: '{VALUE} is not a valid work mode'
        }
    },
    salary: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        currency: { type: String, default: "GHS", trim: true } 
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    emailForApplications: {
        type: String,
        trim: true,
        lowercase: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    district: {
        type: String,
        required: true,
        trim: true
    },
    requirements: {
        type: [String], 
        default: []
    },
    benefits: {
        type: [String], 
        default: []
    },
    applications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application" 
        }
    ],
    applicationDeadline: {
        type: Date
    },
    isOpen: {
        type: Boolean,
        default: true,
        index: true 
    }
}, { timestamps: true });

jobSchema.index({ title: 'text', companyName: 'text', description: 'text' });

export const Job = mongoose.model("Job", jobSchema);
