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
  
  // Unique shareable code (e.g., "AB3X9K2M") for guests to join
  weddingCode: { type: String, unique: true, sparse: true },
  
  bannerImage: { type: String },
  description: { type: String }, // Story about the couple
  
  // Payout Configuration
  payoutSettings: {
    preferredMethod: { type: String, enum: ['bank_transfer'], default: 'bank_transfer' },
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    swiftCode: { type: String, default: '' },
    country: { type: String, default: '' },
    isVerified: { type: Boolean, default: false }
  },

  // Dynamic Gift Conversion Settings
  conversionSettings: {
    autoConvert: { type: Boolean, default: false },
    gracePeriodDays: { type: Number, default: 30 },
    manualReview: { type: Boolean, default: true }
  },

  // Analytics Snapshot (Fast read for dashboard)
  stats: {
    totalRaised: { type: Number, default: 0 },
    guestCount: { type: Number, default: 0 }
  },

  // Privacy Settings
  privacySettings: {
    showGuestNames: { type: Boolean, default: true },
    showContributionAmounts: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false }
  },

  // Gift Preferences
  giftPreferences: {
    allowCashContributions: { type: Boolean, default: true },
    allowVendorPurchases: { type: Boolean, default: true }
  }
}, { timestamps: true });

weddingSchema.index({ couple: 1 });

export default mongoose.model('Wedding', weddingSchema);