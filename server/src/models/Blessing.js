import mongoose from 'mongoose';

const blessingSchema = new mongoose.Schema({
  weddingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wedding', 
    required: true 
  },
  guestName: { type: String, required: true },
  message: { type: String, required: true, maxlength: 500 },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  reactions: {
    type: Map,
    of: [String],
    default: {}
  }
}, { timestamps: true });

blessingSchema.index({ weddingId: 1, createdAt: -1 });

export default mongoose.model('Blessing', blessingSchema);
