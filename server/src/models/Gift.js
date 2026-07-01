import mongoose from 'mongoose';

const contributorSchema = new mongoose.Schema({
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true },
  phone: { type: String },
  amount: { type: Number, required: true },
  message: { type: String, maxlength: 200 },
  isAnonymous: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const giftSchema = new mongoose.Schema({
  weddingId: { 
    type: String, 
    required: true
  },
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  type: { 
    type: String, 
    enum: ['fractional', 'individual'],
    required: true 
  },
  totalPrice: { type: Number, required: true },
  currentCollected: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdByRole: { type: String, enum: ['couple', 'guest', 'admin'], default: 'couple' },
  guestCreatedGift: { type: Boolean, default: false },

  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 

  contributors: [contributorSchema],
  
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "open", "fullyFunded", "purchased", "cashedOut", "expired", "swapped"], 
    default: 'open' 
  },
  deliveryOptions: { 
    type: String, 
    enum: ['store', 'cashout'], 
    default: 'store' 
  },
  fulfillmentPreference: {
    type: String,
    enum: ['vendor', 'cash'],
    default: 'cash'
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  vendorProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProduct', default: null },
  digitalCardUrl: { type: String },
  digitalCardData: { type: String },
  
  category: { type: String },
  priority: { type: Number, default: 1 },

  deliveryAddress: { type: String },
  deliveryTrackingNumber: { type: String },
  deliveryStatus: {
    type: String,
    enum: ['not_shipped', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'not_shipped'
  },
  deliveryProvider: { type: String },
  deliveryEstimatedDate: { type: Date },
  deliveryNotes: { type: String }
}, { timestamps: true });

giftSchema.pre('save', async function() {
  if (this.currentCollected >= this.totalPrice && this.status === 'open') {
    this.status = 'fullyFunded';
  }
});

giftSchema.virtual('isSurging').get(function() {
  const progress = this.totalPrice > 0 ? (this.currentCollected / this.totalPrice) * 100 : 0;
  return progress > 80 && this.status === 'open';
});

giftSchema.virtual('isAlmostComplete').get(function() {
  const progress = this.totalPrice > 0 ? (this.currentCollected / this.totalPrice) * 100 : 0;
  return progress > 90 && this.status === 'open';
});

giftSchema.set('toJSON', { virtuals: true });
giftSchema.set('toObject', { virtuals: true });

giftSchema.index({ weddingId: 1 });
giftSchema.index({ status: 1 });
giftSchema.index({ createdBy: 1 });

export default mongoose.model('Gift', giftSchema);
