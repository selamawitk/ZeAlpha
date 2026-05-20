import mongoose from 'mongoose';

const weddingSchema = new mongoose.Schema({
  couple: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weddingName: { type: String, required: true },
  weddingDate: { type: Date, required: true },
  
  // URL Slug (e.g., "solomon-and-helen-2026")
  slug: { type: String, required: true, unique: true },
  
  bannerImage: { type: String },
  description: { type: String }, // Story about the couple
  
  // FinTech Configuration
  payoutSettings: {
    preferredMethod: { type: String, enum: ['bank', 'telebirr'], default: 'bank' },
    isVerified: { type: Boolean, default: false } // Trust & Verification Layer
  },

  // Analytics Snapshot (Fast read for dashboard)
  stats: {
    totalRaised: { type: Number, default: 0 },
    guestCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

weddingSchema.index({ slug: 1 });
weddingSchema.index({ couple: 1 });

export default mongoose.model('Wedding', weddingSchema);