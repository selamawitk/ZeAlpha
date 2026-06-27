import mongoose from 'mongoose';

const vendorProductSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, default: 0 },
  category: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

vendorProductSchema.index({ vendorId: 1, active: 1 });

export default mongoose.model('VendorProduct', vendorProductSchema);
