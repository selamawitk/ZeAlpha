import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../api/api.js';
import { Search, Filter } from 'lucide-react';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
const textPrimary = 'text-[#2d2218]';
const textMuted = 'text-[#6f6257]';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-300',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-300',
  ordered: 'bg-indigo-50 text-indigo-700 border border-indigo-300',
  shipped: 'bg-purple-50 text-purple-700 border border-purple-300',
  delivered: 'bg-green-50 text-green-700 border border-green-300',
  cancelled: 'bg-red-50 text-red-700 border border-red-300',
};

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'ordered', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter };
      if (search) params.search = search;
      const { data } = await api.get('/vendors/orders/all', { params });
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (id, newStatus, trackingNumber) => {
    setUpdating(id);
    try {
      const payload = { status: newStatus };
      if (trackingNumber) payload.trackingNumber = trackingNumber;
      await api.put(`/vendors/orders/${id}/status`, payload);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleTrackingUpdate = async (id, value) => {
    setUpdating(id);
    try {
      await api.put(`/vendors/orders/${id}/status`, { trackingNumber: value });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update tracking', err);
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatuses = (currentStatus) => {
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['ordered', 'cancelled'],
      ordered: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    return transitions[currentStatus] || [];
  };

  return (
    <div className={`relative min-h-screen ${pageBackground} px-4 pb-6 md:px-6 md:pb-8 w-full max-w-full overflow-x-hidden`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 space-y-6">
        <section className={`rounded-[28px] ${cardElevated} px-6 py-5 md:px-7 md:py-6`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl md:text-[34px] font-black tracking-tight ${textPrimary}`}>Vendor Orders</h1>
              <p className={`mt-2 text-sm md:text-[15px] ${textMuted}`}>Manage fulfillment orders across the platform.</p>
            </div>
            <div className={`${goldGradient} rounded-2xl px-5 py-3 shadow-lg shadow-[#8B5A00]/20`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75">Total Orders</p>
              <p className="mt-1 text-xl font-black text-white">{orders.length}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-[28px] ${glassCard} overflow-hidden`}>
          <div className="border-b border-[#cfa97a]/50 px-6 py-5 space-y-4">
            <h2 className={`text-xl font-black ${textPrimary}`}>Order Tracking</h2>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter size={14} className="text-[#6f6257]" />
                {ORDER_STATUSES.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black capitalize transition-all ${statusFilter === s ? `${goldGradient} text-white shadow-md` : 'border border-[#D4C39B] bg-white/50 text-[#6f6257] hover:bg-white/80'}`}>{s}</button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f6257]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking number..." className="w-full md:w-56 rounded-full border border-[#D4C39B] bg-white/60 pl-9 pr-4 py-2 text-sm outline-none focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Wedding</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Gift</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Vendor</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Product</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Amount</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className={`px-5 py-10 text-center text-sm font-semibold ${textPrimary}`}>Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="7" className={`px-5 py-10 text-center text-sm font-semibold ${textMuted}`}>No orders found.</td></tr>
                ) : orders.map((o, i) => (
                  <motion.tr key={o._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="transition-all duration-300 hover:bg-white/20">
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className="font-black text-[#2d2218] text-sm">{o.wedding?.weddingName || 'Wedding'}</span></td>
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className={`text-sm font-semibold ${textPrimary}`}>{o.gift?.name || 'Gift'}</span></td>
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                      <div className="flex items-center gap-2">
                        {o.vendor?.logo && <img src={o.vendor.logo} alt="" className="h-6 w-6 rounded-md object-cover border border-[#D4C39B]" />}
                        <span className="text-sm text-[#6f6257]">{o.vendor?.name || 'Vendor'}</span>
                      </div>
                    </td>
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                      <div className="flex items-center gap-2">
                        {o.product?.image && <img src={o.product.image} alt="" className="h-6 w-6 rounded-md object-cover border border-[#D4C39B]" />}
                        <span className="text-sm text-[#6f6257]">{o.product?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className="text-sm font-black text-[#8B5A00]">{(o.fundedAmount || o.amount || 0).toLocaleString()} ETB</span></td>
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                      <div className="flex items-center gap-2">
                        {o.status === 'delivered' || o.status === 'cancelled' ? (
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${STATUS_STYLES[o.status] || STATUS_STYLES.pending}`}>{o.status}</span>
                        ) : (
                          <select
                            value={o.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === 'ordered' || newStatus === 'shipped' || newStatus === 'delivered') {
                                const tracking = window.prompt(`Enter tracking number for "${newStatus}" status (optional):`, o.trackingNumber || '');
                                handleStatusUpdate(o._id, newStatus, tracking || undefined);
                              } else {
                                handleStatusUpdate(o._id, newStatus);
                              }
                            }}
                            disabled={updating === o._id}
                            className={`rounded-full border px-3 py-1 text-xs font-black capitalize outline-none ${STATUS_STYLES[o.status] || STATUS_STYLES.pending} disabled:opacity-50`}
                          >
                            <option value={o.status}>{o.status}</option>
                            {getNextStatuses(o.status).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                      <input
                        value={o.trackingNumber || ''}
                        onChange={(e) => {
                          if (e.target.value !== (o.trackingNumber || '')) {
                            handleTrackingUpdate(o._id, e.target.value);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== (o.trackingNumber || '')) {
                            handleTrackingUpdate(o._id, e.target.value);
                          }
                        }}
                        placeholder="Add tracking..."
                        className="w-28 rounded-lg border border-[#D4C39B] bg-white/50 px-2.5 py-1.5 text-xs outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminOrders;
