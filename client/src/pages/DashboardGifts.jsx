import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import GiftManager from '../components/GiftManager.jsx';
import api from '../api/api.js';
import GiftCard from '../components/GiftCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DashboardGifts = () => {
  const { user } = useAuth();

  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingGifts, setPendingGifts] = useState([]);
  const [approving, setApproving] = useState({});

  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  const glassCard =
    'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

  const pageBackground =
    'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';

  const textPrimary = 'text-[#2d2218]';
  const textMuted = 'text-[#6f6257]';

  useEffect(() => {
    const loadGifts = async () => {
      const weddingId = user?.managedWedding;
      if (!weddingId) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/gifts/wedding/${weddingId}`
        );

        setGifts(response.data || []);
      } catch (err) {
        console.error('Registry gifts load error:', err.response?.data?.message || err.message);
        setError(
          err.response?.data?.message || 'Unable to load registry gifts. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    const loadPendingGuestGifts = async () => {
      const weddingId = user?.managedWedding;
      if (!weddingId) return;
      try {
        const res = await api.get(`/gifts/guest/pending/${weddingId}`);
        setPendingGifts(Array.isArray(res.data) ? res.data : []);
      } catch {
        // non-critical
      }
    };

    loadGifts();
    loadPendingGuestGifts();
  }, [user]);

  const handleApproveGuestGift = async (giftId, status) => {
    setApproving(prev => ({ ...prev, [giftId]: true }));
    try {
      await api.put(`/gifts/guest/${giftId}/approve`, { status });
      setPendingGifts(prev => prev.filter(g => g._id !== giftId));
      if (status === 'approved') {
        const res = await api.get(`/gifts/wedding/${user?.managedWedding}`);
        setGifts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to update guest gift:', err);
    } finally {
      setApproving(prev => ({ ...prev, [giftId]: false }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`w-full max-w-full min-h-full ${pageBackground} px-5 py-10`}>

      {/* Gift Manager */}
      <GiftManager />

      {/* Pending Guest Gifts */}
      {pendingGifts.filter(g => g.status === 'pending').length > 0 && (
        <div className={`rounded-[28px] p-8 ${glassCard} mb-8`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2d2218]">Pending Guest Suggestions</h3>
              <p className="text-xs text-[#6f6257]">Review and approve gift suggestions from guests</p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingGifts.filter(g => g.status === 'pending').map((gift) => (
              <div key={gift._id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2d2218]">{gift.name}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {gift.category || 'General'}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {gift.totalPrice?.toLocaleString()} ETB
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        gift.type === 'fractional' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {gift.type === 'fractional' ? 'Shareable' : 'Unique'}
                      </span>
                    </div>
                    {gift.description && (
                      <p className="mt-1 text-xs text-[#6f6257]">{gift.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproveGuestGift(gift._id, 'approved')}
                      disabled={approving[gift._id]}
                      className="flex items-center gap-1 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveGuestGift(gift._id, 'rejected')}
                      disabled={approving[gift._id]}
                      className="flex items-center gap-1 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Section */}
      <div className={`rounded-[28px] p-8 ${glassCard}`}>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-3xl font-black text-[#2d2218]">
              Gift Operations
            </h2>

            <div
              className={`mt-3 h-1 w-16 rounded-full ${goldGradient}`}
            ></div>

            <p className="mt-4 text-sm text-[#6f6257]">
              Manage unique and shareable registry
              gifts in one elegant dashboard.
            </p>
          </div>

        </div>

        {/* Loading */}
        {loading ? (
          <div className={`mt-10 rounded-[28px] border border-[#CFA97A] bg-white/50 p-8 text-center text-sm font-medium ${textMuted}`}>
            Loading gifts...
          </div>
        ) : error ? (

          /* Error */
          <div className="mt-10 rounded-[28px] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
            {error}
          </div>

        ) : gifts.length === 0 ? (

          /* Empty State */
          <div className={`mt-10 rounded-[28px] border border-[#CFA97A] bg-white/50 px-6 py-8 text-center text-sm ${textMuted}`}>
            No gifts found for this couple yet.
          </div>

        ) : (

          /* Gifts Grid */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3"
          >
            {gifts.map((gift) => (
              <motion.div
                key={gift._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="transition-all duration-300 hover:-translate-y-1"
              >
                <GiftCard gift={gift} />
              </motion.div>
            ))}
          </motion.div>

        )}
      </div>
    </motion.div>
  );
};

export default DashboardGifts;