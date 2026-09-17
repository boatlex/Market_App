import mongoose from "mongoose";

const serviceProviderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
        unique: true 
    },
    businessName: {
        type: String,
        trim: true,
        required: [true, "Please add a business or trade name"]
    },
    serviceType: {
        type: String,
        required: true,
        trim: true,
        lowercase: true 
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    pricing: {
        rate: { type: Number, required: true, min: 0 }, // The base price numerical value
        basis: { 
            type: String, 
            required: true, 
            enum: ["per hour", "per day", "fixed project", "contact for quote"] 
        },
        currency: { type: String, default: "GHS", trim: true }
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    whatsappNumber: {
        type: String,
        trim: true
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
    portfolioImages: [
        {
            type: String 
        }
    ],
    availabilityStatus: {
        type: String,
        default: "Available",
        enum: ["Available", "Busy", "Away"]
    },
    
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isVerifiedProvider: {
        type: Boolean,
        default: false // Admin can change this to true after checking credentials
    }
}, { timestamps: true });

// Compound text index to let users search for services by keyword or business name
serviceProviderSchema.index({ businessName: 'text', serviceType: 'text', description: 'text' });

export const ServiceProvider = mongoose.model("ServiceProvider", serviceProviderSchema);
