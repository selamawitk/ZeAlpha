import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  logo: { type: String },
  description: { type: String },
  category: { type: String, enum: ['gift', 'service', 'experience', 'other'], default: 'gift' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  address: { type: String },
  contact: {
    website: { type: String },
    city: { type: String },
    country: { type: String, default: 'Ethiopia' },
  },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);
