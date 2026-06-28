import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Package, Truck, CheckCircle, XCircle, Clock, AlertCircle, ShoppingBag, TrendingUp, ListOrdered } from 'lucide-react';
import DeliveryTracker from '../components/DeliveryTracker.jsx';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
const textPrimary = 'text-[#2d2218]';
const textMuted = 'text-[#6f6257]';

const STATUS_ORDER = ['pending', 'confirmed', 'ordered', 'shipped', 'delivered'];

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  ordered: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ordered: 'Ordered',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const DashboardFulfillment = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [giftDeliveryList, setGiftDeliveryList] = useState([]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/vendors/orders/couple');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Fetch fully funded gifts for delivery tracking
  useEffect(() => {
    if (!user?.managedWedding) return;
    const fetchFundedGifts = async () => {
      try {
        const { data } = await api.get(`/gifts/wedding/${user.managedWedding}`);
        const funded = (Array.isArray(data) ? data : []).filter(g => g.status === 'fullyFunded');
        setGiftDeliveryList(funded);
      } catch {}
    };
    fetchFundedGifts();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.on('vendorOrder:update', fetchOrders);
    const handleGiftUpdate = (updatedGift) => {
      if (updatedGift.status === 'fullyFunded') {
        setGiftDeliveryList(prev => {
          if (prev.find(g => g._id === updatedGift._id)) {
            return prev.map(g => g._id === updatedGift._id ? { ...g, ...updatedGift } : g);
          }
          return [...prev, updatedGift];
        });
      }
    };
    socket.on('gift:update', handleGiftUpdate);
    return () => {
      socket.off('vendorOrder:update', fetchOrders);
      socket.off('gift:update', handleGiftUpdate);
    };
  }, [socket, fetchOrders]);

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const inProgress = orders.filter(o => ['ordered', 'shipped'].includes(o.status)).length;
    return { total, delivered, pending, cancelled, inProgress };
  }, [orders]);

  const getStatusProgress = (status) => {
    const idx = STATUS_ORDER.indexOf(status);
    if (status === 'cancelled') return -1;
    return idx >= 0 ? idx : 0;
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const STAT_CARDS = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-[#8B5A00]', bg: 'bg-amber-50' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-[#b8860b]', bg: 'bg-yellow-50' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`min-h-full ${pageBackground} ${textPrimary} overflow-x-hidden max-w-full`}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[32%] h-[32%] bg-primary-gold/20 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[32%] h-[32%] bg-[#8a5a2b]/20 blur-[130px] rounded-full"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 lg:px-6 pt-8 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Order{' '}
            <span className={`italic ${goldGradient} bg-clip-text text-transparent font-black`}>
              Fulfillment
            </span>
          </h1>
          <p className={`text-sm ${textMuted} font-medium mt-1`}>Track your vendor orders from start to delivery</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`rounded-[28px] ${glassCard} p-16 text-center`}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="mx-auto h-10 w-10 rounded-full border-3 border-[#B8860B] border-t-transparent" />
              <p className={`mt-4 text-sm font-semibold ${textMuted}`}>Loading orders...</p>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`rounded-[28px] ${glassCard} p-12 text-center`}>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <Package size={48} className="mx-auto mb-4 text-[#D4C39B]" />
              </motion.div>
              <h3 className={`text-2xl font-black ${textPrimary} mb-2`}>No Orders Yet</h3>
              <p className={`text-sm ${textMuted} max-w-md mx-auto leading-relaxed`}>
                When a gift using vendor fulfillment reaches 100% funding, your order will appear here automatically.
              </p>
            </motion.div>
          ) : (
            <motion.div key="content" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="space-y-6">
              {/* Stats Cards */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STAT_CARDS.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -2 }}
                      className={`rounded-[20px] ${cardElevated} p-5 transition-shadow hover:shadow-[0_12px_32px_rgba(120,90,40,0.12)]`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${textMuted}`}>{stat.label}</span>
                        <div className={`${stat.bg} p-2 rounded-xl`}>
                          <Icon size={16} className={stat.color} />
                        </div>
                      </div>
                      <p className={`text-2xl font-black ${textPrimary}`}>{stat.value}</p>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Orders */}
              {orders.map((order, index) => {
                const progress = getStatusProgress(order.status);
                const isCancelled = order.status === 'cancelled';
                const StatusIcon = STATUS_ICONS[order.status] || Clock;

                return (
                  <motion.div
                    key={order._id}
                    variants={itemVariants}
                    layout
                    className={`rounded-[28px] ${cardElevated} p-6 md:p-8 transition-shadow hover:shadow-[0_12px_32px_rgba(120,90,40,0.12)]`}
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4">
                        {order.product?.image ? (
                          <img src={order.product.image} alt={order.product.name} className="h-16 w-16 rounded-xl object-cover border border-[#D4C39B]" />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-[#F2EDE1] border border-[#D4C39B] flex items-center justify-center">
                            <Package size={24} className="text-[#8B5A00]" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-black text-[#2d2218]">{order.product?.name || order.gift?.name || 'Product'}</h3>
                          <p className={`text-sm ${textMuted} mt-0.5`}>Gift: {order.gift?.name || '—'}</p>
                          <p className={`text-sm ${textMuted}`}>From: {order.vendor?.name || 'Vendor'}</p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="flex items-center gap-2"
                      >
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black capitalize ${isCancelled ? 'bg-red-50 text-red-700 border border-red-300' : `${goldGradient} text-white shadow-sm`}`}>
                          <StatusIcon size={14} />
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </motion.div>
                    </div>

                    {/* Progress Timeline */}
                    {!isCancelled && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                      >
                        <div className="flex items-center justify-between">
                          {STATUS_ORDER.map((s, i) => {
                            const isComplete = i <= progress;
                            const isCurrent = i === progress;
                            return (
                              <motion.div
                                key={s}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 150 }}
                                className="flex flex-col items-center"
                              >
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${isComplete ? `${goldGradient} text-white shadow-md shadow-[#8B5A00]/20` : isCurrent ? 'border-2 border-[#D4C39B] text-[#8B5A00] bg-white/80 ring-2 ring-[#D4C39B]/30' : 'border-2 border-[#e5d7c4] text-[#c4b599] bg-white/50'}`}>
                                  {i + 1}
                                </div>
                                <span className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${isComplete ? 'text-[#8B5A00]' : isCurrent ? 'text-[#6f6257]' : 'text-[#c4b599]'}`}>{s}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                        <div className="relative mt-2 h-1">
                          <div className="absolute inset-0 bg-[#e5d7c4] rounded-full"></div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${STATUS_ORDER.length > 1 ? (progress / (STATUS_ORDER.length - 1)) * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`absolute inset-y-0 left-0 ${goldGradient} rounded-full`}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className={`rounded-2xl border border-[#d8c4ac] bg-white/45 p-3`}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Amount</p>
                        <p className="mt-1 text-sm font-black text-[#8B5A00]">{(order.fundedAmount || order.amount || 0).toLocaleString()} ETB</p>
                      </div>
                      <div className={`rounded-2xl border border-[#d8c4ac] bg-white/45 p-3`}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Tracking</p>
                        <p className="mt-1 text-sm font-black text-[#2d2218]">{order.trackingNumber || 'Not assigned'}</p>
                      </div>
                      <div className={`rounded-2xl border border-[#d8c4ac] bg-white/45 p-3`}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Ordered</p>
                        <p className="mt-1 text-sm font-black text-[#2d2218]">{formatDate(order.orderedAt || order.createdAt) || '—'}</p>
                      </div>
                      <div className={`rounded-2xl border border-[#d8c4ac] bg-white/45 p-3`}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Delivered</p>
                        <p className="mt-1 text-sm font-black text-[#2d2218]">{formatDate(order.deliveredAt) || '—'}</p>
                      </div>
                    </div>

                    {/* Timeline Dates */}
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6f6257]">
                      {order.confirmedAt && <span>Confirmed: {formatDate(order.confirmedAt)}</span>}
                      {order.shippedAt && <span>Shipped: {formatDate(order.shippedAt)}</span>}
                      {order.deliveredAt && <span>Delivered: {formatDate(order.deliveredAt)}</span>}
                      {order.cancelledAt && <span className="text-red-500">Cancelled: {formatDate(order.cancelledAt)}</span>}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`mt-4 rounded-2xl border border-[#d8c4ac] bg-white/45 p-3 overflow-hidden`}
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Notes</p>
                        <p className="mt-1 text-sm text-[#6f6257]">{order.notes}</p>
                      </motion.div>
                    )}

                    {/* Vendor Contact */}
                    {order.vendor?.phone && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`mt-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-3 flex items-center gap-2`}
                      >
                        <AlertCircle size={14} className="text-[#8B5A00]" />
                        <p className="text-xs text-[#6f6257]">Contact vendor: <span className="font-semibold text-[#2d2218]">{order.vendor.phone}</span>{order.vendor.email ? ` / ${order.vendor.email}` : ''}</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery Tracking for Non-Vendor Gifts */}
        {giftDeliveryList.length > 0 && (
          <motion.div variants={itemVariants} className="mt-8">
            <h2 className={`text-2xl font-black ${textPrimary} mb-4`}>Delivery Tracking</h2>
            <p className={`text-sm ${textMuted} mb-4`}>Track delivery of your fully funded gifts.</p>
            <div className="space-y-3">
              {giftDeliveryList.map(g => (
                <DeliveryTracker
                  key={g._id}
                  gift={g}
                  onUpdate={(updated) => {
                    setGiftDeliveryList(prev => prev.map(g2 => g2._id === updated._id ? { ...g2, ...updated } : g2));
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <footer className={`mt-10 text-center text-[10px] ${textMuted} font-bold pb-6`}>© 2026 ZeAlpha</footer>
      </div>
    </motion.div>
  );
};

export default DashboardFulfillment;
