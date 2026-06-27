import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding' },
  
  type: { 
    type: String, 
    enum: ['contribution', 'gift_completed', 'gift_surge', 'admin_alert', 'withdrawal_created', 'withdrawal_approved', 'wedding_approaching', 'order_created', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled'],
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  link: { type: String }, // URL to redirect the user (e.g., to the Gift page)
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ weddingId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 90 });

export default mongoose.model('Notification', notificationSchema);