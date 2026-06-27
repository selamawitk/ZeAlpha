import mongoose from 'mongoose';

const vendorOrderSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  gift: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProduct' },
  couple: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  fundedAmount: { type: Number, required: true },
  productPrice: { type: Number },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ordered', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: { type: String },
  notes: { type: String },

  externalOrderId: { type: String },
  externalTrackingId: { type: String },
  externalVendorReference: { type: String },

  orderedAt: { type: Date },
  confirmedAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
}, { timestamps: true });

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ordered', 'cancelled'],
  ordered: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

vendorOrderSchema.statics.isValidTransition = function (from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
};

vendorOrderSchema.methods.transitionTo = function (newStatus) {
  if (!this.constructor.isValidTransition(this.status, newStatus)) {
    throw new Error(`Invalid status transition: ${this.status} → ${newStatus}`);
  }
  this.status = newStatus;
  const now = new Date();
  if (newStatus === 'confirmed') this.confirmedAt = now;
  if (newStatus === 'ordered') this.orderedAt = now;
  if (newStatus === 'shipped') this.shippedAt = now;
  if (newStatus === 'delivered') this.deliveredAt = now;
  if (newStatus === 'cancelled') this.cancelledAt = now;
};

vendorOrderSchema.index({ wedding: 1 });
vendorOrderSchema.index({ vendor: 1 });
vendorOrderSchema.index({ couple: 1 });
vendorOrderSchema.index({ status: 1 });
vendorOrderSchema.index({ gift: 1 });

export default mongoose.model('VendorOrder', vendorOrderSchema);
