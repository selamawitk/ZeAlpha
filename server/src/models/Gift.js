import mongoose from 'mongoose';

const contributorSchema = new mongoose.Schema({
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  message: { type: String, maxlength: 200 },
  isAnonymous: { type: Boolean, default: false }, // For the social feed
  timestamp: { type: Date, default: Date.now }
});

const giftSchema = new mongoose.Schema({
  weddingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wedding', 
    required: true 
  },
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  type: { 
    type: String, 
    enum: ['fractional', 'individual'], // fractional = shareable, individual = unique
    required: true 
  },
  totalPrice: { type: Number, required: true },
  currentCollected: { type: Number, default: 0 },
  
  // Anti-Duplicate Lock (Feature #5)
  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date }, 

  contributors: [contributorSchema], // Embedded for fast read in social feed
  
  status: { 
    type: String, 
    enum: ["open", "fullyFunded", "purchased", "cashedOut", "expired", "swapped"], 
    default: 'open' 
  },
  deliveryOptions: { 
    type: String, 
    enum: ['store', 'cashout'], 
    default: 'store' 
  },
  digitalCardUrl: { type: String }, // Generated on 100% completion
  digitalCardData: { type: String }, // JSON payload for the gift card
  
  // Smart Intelligence (AI Data Points)
  category: { type: String }, // e.g., 'Kitchen', 'Electronics', 'Furniture'
  priority: { type: Number, default: 1 } // 1-5, helps AI suggest urgent gifts
}, { timestamps: true });

// Pre-save hook to auto-update status if funded
giftSchema.pre('save', function(next) {
  if (this.currentCollected >= this.totalPrice && this.status === 'open') {
    this.status = 'fullyFunded';
  }
  next();
});

// Virtual field for Gift Surge (Feature 7)
giftSchema.virtual('isSurging').get(function() {
  const progress = this.totalPrice > 0 ? (this.currentCollected / this.totalPrice) * 100 : 0;
  return progress > 90 && this.status === 'open';
});

giftSchema.virtual('isAlmostComplete').get(function() {
  const progress = this.totalPrice > 0 ? (this.currentCollected / this.totalPrice) * 100 : 0;
  return progress > 90 && this.status === 'open';
});

// Ensure virtual fields are serialized
giftSchema.set('toJSON', { virtuals: true });
giftSchema.set('toObject', { virtuals: true });

export default mongoose.model('Gift', giftSchema);