import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['stripe', 'bank_transfer', 'telebirr'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String },
}, { timestamps: true });

paymentSchema.index({ guestId: 1 });
paymentSchema.index({ giftId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);
