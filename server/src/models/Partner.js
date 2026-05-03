import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Electronics', 'Furniture', 'Kitchenware', 'Home Decor'],
    required: true 
  },
  logo: { type: String },
  contactPerson: { type: String },
  email: { type: String, unique: true },
  phone: { type: String },
  
  // Business Logic
  commissionRate: { type: Number, default: 0 }, // If ZeAlpha takes a %
  isVerified: { type: Boolean, default: false },
  
  // Location (Important for physical delivery)
  address: {
    city: { type: String, default: 'Addis Ababa' },
    subcity: String,
    specificArea: String
  }
}, { timestamps: true });

export default mongoose.model('Partner', partnerSchema);