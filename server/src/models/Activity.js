import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

activitySchema.index({ weddingId: 1, timestamp: -1 });
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 30 });

export default mongoose.model('Activity', activitySchema);
