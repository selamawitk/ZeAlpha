import { motion } from 'framer-motion';
import { Lock, Gift, Clock, Flame, Share2 } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

const GiftCard = ({ gift, onContribute = () => {} }) => {
  const progress = gift.totalPrice > 0 ? (gift.currentCollected / gift.totalPrice) * 100 : 0;
  const isSurging = progress > 90 || gift.isSurging || gift.isAlmostComplete;
  const isLocked = gift.isLocked && gift.lockedUntil && new Date(gift.lockedUntil) > new Date();
  const isComplete = gift.status === 'fullyFunded';

  const getLockRemaining = () => {
    if (!isLocked || !gift.lockedUntil) return null;
    const remaining = Math.max(0, Math.floor((new Date(gift.lockedUntil) - new Date()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReserve = async (e) => {
    e.stopPropagation();
    if (gift.type !== 'individual' || isComplete || isLocked) return;
    try {
      await api.post(`/gifts/${gift._id}/toggle-lock`);
      onContribute(gift);
    } catch (err) {
      console.error('Reservation failed:', err);
    }
  };

  return (
    <motion.div
      className={`${glassCard} border-2 p-6 ${
        isSurging ? 'border-[#B8860B]' : 'border-[#D4C39B]'
      } ${isLocked ? 'opacity-80' : ''}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-black text-[#2d2218] mb-2">
            {gift.name}
          </h3>
          <p className="text-[#6f6257] text-sm mb-3">{gift.description}</p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {gift.type === 'individual' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[#B8860B]/10 text-[#8B5A00]">
                <Gift size={12} />
                Unique
              </span>
            )}
            {gift.type === 'fractional' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                Shareable
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                <Clock size={12} />
                Reserved ({getLockRemaining()})
              </span>
            )}
            {isSurging && !isLocked && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${goldGradient} text-white animate-pulse`}>
                <Flame className="h-3 w-3" /> Surging!
              </span>
            )}
          </div>
        </div>
        {gift.imageUrl && (
          <img
            src={gift.imageUrl}
            alt={gift.name}
            className="w-20 h-20 object-cover rounded-xl ml-4"
          />
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#6f6257]">Progress</span>
          <span className="font-bold text-[#2d2218]">
            {gift.currentCollected} ETB / {gift.totalPrice} ETB
          </span>
        </div>
        <div className="w-full rounded-full h-3 overflow-hidden bg-[#ead9c0]">
          <motion.div
            className={`h-3 rounded-full ${goldGradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="text-right text-sm font-bold text-[#2d2218] mt-1">
          {Math.round(progress)}% funded
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black text-[#8B5A00]">{Math.round(progress)}%</span>
          <span className="text-xs text-[#6f6257]">funded</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const url = `${window.location.origin}/digital-gift-card/${gift._id}`;
            if (navigator.share) {
              navigator.share({ title: gift.name, text: `Contribute to ${gift.name} on ZeAlpha!`, url });
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="flex items-center gap-1 rounded-full border border-[#dcc6a7] bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#6f6257] transition hover:bg-[#f5e7ca] hover:text-[#8B5A00]"
        >
          <Share2 size={12} />
          Share
        </button>
      </div>

      {gift.contributors && gift.contributors.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-[#6f6257] font-semibold mb-1">
            {gift.contributors.length} contributor{gift.contributors.length !== 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-1">
            {gift.contributors.map((c, i) => (
              <span key={i} className="text-xs bg-[#B8860B]/10 text-[#2d2218] px-2 py-0.5 rounded-full font-medium">
                {c.isAnonymous ? 'Anonymous' : c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {gift.type === 'individual' && !isComplete && !isLocked && (
        <button
          onClick={handleReserve}
          className="w-full mb-2 rounded-2xl border-2 border-[#B8860B] text-[#8B5A00] py-3 text-sm font-bold hover:bg-[#B8860B]/5 transition"
        >
          <Lock size={14} className="inline mr-1" />
          Reserve & Contribute
        </button>
      )}

      <button
        onClick={() => onContribute(gift)}
        disabled={isComplete}
        className={`w-full rounded-2xl py-3 text-sm font-black transition-all duration-300 ${
          isComplete
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : `${goldGradient} text-white shadow-lg shadow-[#8B5A00]/20 hover:brightness-110`
        }`}
      >
        {isComplete ? 'Fully Funded' : gift.type === 'individual' ? 'Claim This Gift' : 'Contribute'}
      </button>
    </motion.div>
  );
};

export default GiftCard;
