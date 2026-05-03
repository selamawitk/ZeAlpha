import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  guestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
  
  // Payment Logic
  paymentMethod: { 
    type: String, 
    enum: ['stripe', 'telebirr', 'bank_transfer'], 
    required: true 
  },
  screenshotUrl: { type: String }, // For manual payments
  transactionId: { type: String, unique: true }, // From Stripe/Telebirr
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  
  isAnonymous: { type: Boolean, default: false } // Privacy toggle
}, { timestamps: true });

export default mongoose.model('Contribution', contributionSchema);