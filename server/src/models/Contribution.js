import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  guestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  giftId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Gift', 
    required: true 
  },
  weddingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wedding', 
    required: true 
  },
  amount: { type: Number, required: true },
  message: { type: String, maxlength: 500 },
  guestPhone: { type: String },
  
  // Payment Logic
  paymentMethod: { 
    type: String, 
    enum: ['stripe', 'bank_transfer'], 
    required: true 
  },
  screenshotUrl: { type: String }, // For manual payments
  transactionId: { type: String, unique: true, sparse: true }, // From Stripe
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  
  isAnonymous: { type: Boolean, default: false }, // Privacy toggle
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContributionGroup', default: null } // Friend group contribution
}, { timestamps: true });

contributionSchema.index({ giftId: 1 });
contributionSchema.index({ guestId: 1 });
contributionSchema.index({ status: 1 });
// Prevent duplicate contributions for individual (unique) gifts
contributionSchema.index({ giftId: 1, guestId: 1 });

export default mongoose.model('Contribution', contributionSchema);