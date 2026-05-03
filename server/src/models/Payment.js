import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['stripe', 'telebirr', 'bank_transfer'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String },
  timestamps: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
