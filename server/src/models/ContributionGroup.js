import mongoose from 'mongoose';

const contributionGroupSchema = new mongoose.Schema({
  weddingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wedding',
    required: true
  },
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    required: true
  },
  name: { type: String, required: true, maxlength: 100 },
  totalAmount: { type: Number, required: true },
  targetAmount: { type: Number, required: true },
  members: [{
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
    joinedAt: { type: Date, default: Date.now }
  }],
  inviteToken: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ['forming', 'funded', 'completed', 'cancelled'],
    default: 'forming'
  }
}, { timestamps: true });

contributionGroupSchema.index({ weddingId: 1 });
contributionGroupSchema.index({ giftId: 1 });
contributionGroupSchema.index({ inviteToken: 1 });

export default mongoose.model('ContributionGroup', contributionGroupSchema);
