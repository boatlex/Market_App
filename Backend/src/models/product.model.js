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
        required: [true, "Phone number is a mandatory field."],
        trim: true,
        validate: {
            validator: function (v) {
                return /^0\d{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    category: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    productType: {
        type: String,
        required: true,
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
    location: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: [String],
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: "A product must have at least one image."
        }
    },
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
        index: true
    },
}, { timestamps: true });
// 1. Existing text index remains for keyword inputs
productSchema.index({ name: "text", description: "text" }, { weights: { name: 10, description: 5 } });

// 2. PRIMARY COMBINED AD FEED FILTER (Covers general browsing, location changes, and sorting)
// This ensures that even if 'category' is empty, query optimization triggers correctly from right to left variations
productSchema.index({ isAvailable: 1, region: 1, district: 1, category: 1, createdAt: -1 });

// 3. SPECIALIZED SPARE COMBINED INDEX (For specific category drilling directly from home grid)
productSchema.index({ isAvailable: 1, category: 1, productType: 1, createdAt: -1 });

// 4. PRICE RANGE SPECIFIC QUERY SCANNING
productSchema.index({ isAvailable: 1, price: 1, createdAt: -1 });


export const Product = mongoose.model("Product", productSchema);
