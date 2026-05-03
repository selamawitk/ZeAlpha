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
    enum: ['contribution', 'gift_completed', 'gift_surge', 'admin_alert'],
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  link: { type: String }, // URL to redirect the user (e.g., to the Gift page)
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);