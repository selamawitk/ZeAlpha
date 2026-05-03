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
    enum: ['telebirr', 'bank_transfer'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  
  // Dynamic details based on method
  accountDetails: {
    bankName: String,
    accountHolder: String,
    accountNumber: String,
    phoneNumber: String // For Telebirr
  },
  
  adminNotes: { type: String }, // For verification disputes
  processedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Payout', payoutSchema);