import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
      
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    productType: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    images: [
        {
            type: String,
            required: true,
        }
    ],
    delivery: {
        from: { type: Date },
        to: { type: Date }
    },
    warranty: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true
    },
    condition: {
        type: String,
        trim: true,
        enum: {
            values: [
                'New', 
                'Refurbished', 
                'Home-used', 
                'Used - Like New', 
                'Used - Good', 
                'Used - Fair'
            ],
            message: '{VALUE} is not a valid product condition'
        }
    },
     comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        }
    ],

    isAvailable: {
        type: Boolean,
        default: true,
        index: true // Accelerates public marketplace search queries
    },

}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);
