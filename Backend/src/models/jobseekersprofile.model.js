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
                // 👈 FIX: Core context safety mapping block
                // Handles parent object vs nested array upsert pipelines safely
                const subdoc = this.ownerDocument ? this : this.parent();
                
                // Safely convert values to timestamps to prevent string vs date comparison logic failures
                const startTS = subdoc.startDate ? new Date(subdoc.startDate).getTime() : null;
                const endTS = value ? new Date(value).getTime() : null;

                if (subdoc.isCurrentJob && value) return false;
                if (!subdoc.isCurrentJob && !value) return false;
                if (endTS && startTS && endTS < startTS) return false;
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
                // 👈 FIX: Core context safety mapping block
                const subdoc = this.ownerDocument ? this : this.parent();
                
                const startTS = subdoc.startDate ? new Date(subdoc.startDate).getTime() : null;
                const endTS = value ? new Date(value).getTime() : null;

                if (subdoc.isCurrentEducation && value) return false;
                if (!subdoc.isCurrentEducation && !value) return false;
                if (endTS && startTS && endTS < startTS) return false;
                return true;
            },
            message: "End date is required if you are no longer studying here, and must be after the start date."
        }
    },
    isCurrentEducation: { type: Boolean, default: false }
});

// Keep your parent jobSeekerProfileSchema exactly as it is below...
const jobSeekerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    profilePicture: { type: String, trim: true },
    professionalHeadline: {
        type: String,
        trim: true,
        required: [true, "Please add a professional headline summarizing your role"]
    },
    bio: { type: String, trim: true },
    skills: { type: [String], default: [] },
    experience: [workExperienceSchema],
    education: [educationSchema],
    resumeUrl: { type: String, trim: true },
    region: { type: String, trim: true, index: true },
    district: { type: String, trim: true, index: true },
    location: { type: String, trim: true, default: "" },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is a mandatory field."],
        trim: true,
        validate: {
            validator: function (v) {
                return /^0\d{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    workMode: {
        type: String,
        enum: ["On-site", "Remote", "Hybrid"],
        default: "On-site",
        index: true,
    },
    preferredJobTypes: {
        type: [String],
        enum: ["Full-time", "Part-time", "Contract", "Remote", "Internship", "Hybrid"],
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

jobSeekerProfileSchema.index(
    { skills: 'text', professionalHeadline: 'text', bio: 'text' },
    { weights: { skills: 10, professionalHeadline: 5, bio: 1 } }
);

export const JobSeekerProfile = mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);
