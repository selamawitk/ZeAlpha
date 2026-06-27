import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GiftManager from '../components/GiftManager.jsx';
import api from '../api/api.js';
import GiftCard from '../components/GiftCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DashboardGifts = () => {
  const { user } = useAuth();

  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    loadGifts();
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`w-full max-w-full min-h-full ${pageBackground} px-5 py-10`}>

      {/* Gift Manager */}
      <GiftManager />

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