import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  weddingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wedding', 
    required: true 
  },
  // Can be a payout for a single gift or a bulk payout
  giftIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Gift' 
  }],
  totalAmount: { type: Number, required: true },
  
  method: { 
    type: String, 
    enum: ['bank_transfer'], 
    default: 'bank_transfer'
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'], 
    default: 'pending' 
  },
  
  accountDetails: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    swiftCode: String,
    country: String
  },
  
  adminNotes: { type: String }, // For verification disputes
  processedAt: { type: Date }
}, { timestamps: true });

payoutSchema.index({ weddingId: 1 });
payoutSchema.index({ status: 1 });

export default mongoose.model('Payout', payoutSchema);