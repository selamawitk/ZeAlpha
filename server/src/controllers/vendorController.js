import Vendor from '../models/Vendor.js';
import VendorProduct from '../models/VendorProduct.js';
import VendorOrder from '../models/VendorOrder.js';
import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import Notification from '../models/Notification.js';
import { emitActivity, emitNotification, emitVendorOrderUpdate } from '../services/socketService.js';
import { sendOrderStatusEmail } from '../services/emailService.js';
import { resolveWedding } from '../utils/weddingResolver.js';

// ── VENDOR CRUD ──

export const getVendors = async (req, res) => {
  const vendors = await Vendor.find().sort({ name: 1 });
  res.json(vendors);
};

export const getVendorById = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json(vendor);
};

export const createVendor = async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.status(201).json(vendor);
};

export const updateVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json(vendor);
};

export const deleteVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  await VendorProduct.deleteMany({ vendorId: req.params.id });
  res.json({ message: 'Vendor deleted' });
};

// ── VENDOR PRODUCT CRUD ──

export const getVendorProducts = async (req, res) => {
  const query = {};
  if (req.params.vendorId) query.vendorId = req.params.vendorId;
  const products = await VendorProduct.find(query)
    .populate('vendorId', 'name')
    .sort({ createdAt: -1 });
  res.json(products);
};

export const createVendorProduct = async (req, res) => {
  const vendor = await Vendor.findById(req.body.vendorId);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

  const product = await VendorProduct.create(req.body);
  const populated = await product.populate('vendorId', 'name');
  res.status(201).json(populated);
};

export const updateVendorProduct = async (req, res) => {
  const product = await VendorProduct.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('vendorId', 'name');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

export const deleteVendorProduct = async (req, res) => {
  const product = await VendorProduct.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
};

// ── ORDER MANAGEMENT ──

export const getVendorOrders = async (req, res) => {
  const { status, search } = req.query;
  const query = {};

  if (status && status !== 'all') query.status = status;
  if (search) {
    query.$or = [
      { trackingNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const orders = await VendorOrder.find(query)
    .populate('wedding', 'weddingName')
    .populate('gift', 'name')
    .populate('vendor', 'name logo')
    .populate('product', 'name image price')
    .populate('couple', 'name email')
    .sort({ createdAt: -1 });

  res.json(orders);
};

export const getCoupleOrders = async (req, res) => {
  const userId = req.user._id;
  const orders = await VendorOrder.find({ couple: userId })
    .populate('wedding', 'weddingName')
    .populate('gift', 'name')
    .populate('vendor', 'name logo email phone')
    .populate('product', 'name image price description')
    .sort({ createdAt: -1 });

  res.json(orders);
};

export const createVendorOrder = async (req, res) => {
  const { giftId, vendorId, productId } = req.body;

  const gift = await Gift.findById(giftId);
  if (!gift) return res.status(404).json({ message: 'Gift not found' });

  const wedding = await resolveWedding(gift.weddingId);
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  const product = productId ? await VendorProduct.findById(productId) : null;

  const order = await VendorOrder.create({
    wedding: wedding._id,
    gift: giftId,
    vendor: vendorId,
    product: productId || undefined,
    couple: wedding.couple,
    fundedAmount: gift.currentCollected,
    productPrice: product?.price || gift.currentCollected,
    status: 'pending',
  });

  const populated = await VendorOrder.findById(order._id)
    .populate('wedding', 'weddingName')
    .populate('gift', 'name')
    .populate('vendor', 'name logo')
    .populate('product', 'name image price')
    .populate('couple', 'name email');

  const notifyData = {
    recipient: wedding.couple,
    weddingId: gift.weddingId,
    type: 'order_created',
    title: 'Order Created',
    message: `Your order for ${gift.name} has been created.`,
    link: '/dashboard/fulfillment',
  };

  await Notification.create(notifyData);
  emitNotification(notifyData);
  emitActivity({
    weddingId: String(gift.weddingId),
    title: `Order created for ${gift.name}`,
    message: `A vendor order was created for ${gift.name}`,
    type: 'order_created',
    timestamp: new Date(),
  });
  emitVendorOrderUpdate(populated);

  res.status(201).json(populated);
};

export const updateVendorOrderStatus = async (req, res) => {
  const { status, trackingNumber, notes } = req.body;

  const order = await VendorOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  try {
    if (status) order.transitionTo(status);
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (notes !== undefined) order.notes = notes;

    await order.save();
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const populated = await VendorOrder.findById(order._id)
    .populate('wedding', 'weddingName')
    .populate('gift', 'name')
    .populate('vendor', 'name logo')
    .populate('product', 'name image price')
    .populate('couple', 'name email');

  const statusLabels = { confirmed: 'order_confirmed', ordered: 'order_created', shipped: 'order_shipped', delivered: 'order_delivered', cancelled: 'order_cancelled' };
  const statusTitles = { confirmed: 'Order Confirmed', ordered: 'Order Placed', shipped: 'Order Shipped', delivered: 'Order Delivered', cancelled: 'Order Cancelled' };

  if (statusLabels[status]) {
    const notifyData = {
      recipient: order.couple,
      weddingId: order.wedding,
      type: statusLabels[status],
      title: statusTitles[status] || 'Order Updated',
      message: status === 'cancelled'
        ? `Order for ${populated.gift?.name || 'gift'} was cancelled.`
        : `Your order for ${populated.gift?.name || 'gift'} is now ${status}.`,
      link: '/dashboard/fulfillment',
    };

    await Notification.create(notifyData);
    emitNotification(notifyData);

    try {
      const coupleUser = await (await import('../models/User.js')).default.findById(order.couple);
      if (coupleUser?.email) {
        await sendOrderStatusEmail(
          coupleUser.email,
          populated.gift?.name || 'gift',
          populated.vendor?.name,
          status,
          '/dashboard/fulfillment'
        );
      }
    } catch (emailErr) {
      console.error('Order status email failed:', emailErr);
    }

    emitActivity({
      weddingId: String(order.wedding),
      title: `Order ${status} for ${populated.gift?.name || 'gift'}`,
      message: `Vendor order ${status === 'cancelled' ? 'was cancelled' : `is now ${status}`}`,
      type: statusLabels[status],
      timestamp: new Date(),
    });
  }

  emitVendorOrderUpdate(populated);

  res.json(populated);
};

// ── VENDOR ANALYTICS ──

export const getVendorAnalytics = async (req, res) => {
  const totalOrders = await VendorOrder.countDocuments();
  const deliveredOrders = await VendorOrder.countDocuments({ status: 'delivered' });
  const pendingOrders = await VendorOrder.countDocuments({ status: { $in: ['pending', 'confirmed', 'ordered', 'shipped'] } });
  const cancelledOrders = await VendorOrder.countDocuments({ status: 'cancelled' });

  const mostUsedVendors = await VendorOrder.aggregate([
    { $group: { _id: '$vendor', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
    { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    { $project: { name: '$vendor.name', count: 1 } },
  ]);

  const fulfillmentRate = totalOrders > 0
    ? Math.round((deliveredOrders / totalOrders) * 100)
    : 0;

  res.json({
    totalOrders,
    deliveredOrders,
    pendingOrders,
    cancelledOrders,
    fulfillmentRate,
    mostUsedVendors,
  });
};
