import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Gift, Clock, Flame, Share2, Edit3, XCircle } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

const GiftCard = ({ gift, onContribute = () => {}, contributedByMe = false, isOwner = false, onEdit }) => {
  const [imgError, setImgError] = useState(false);
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

  const [releasing, setReleasing] = useState(false);

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

  const handleRelease = async (e) => {
    e.stopPropagation();
    setReleasing(true);
    try {
      await api.post(`/gifts/${gift._id}/unlock`);
    } catch (err) {
      console.error('Release failed:', err);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <motion.div
      className={`${glassCard} border-2 p-5 flex flex-col h-full ${
        isSurging ? 'border-[#B8860B]' : 'border-[#D4C39B]'
      } ${isLocked ? 'opacity-80' : ''}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Header: name + badges + image */}
      <div className="flex items-start gap-3 mb-3">
        {gift.imageUrl && !imgError && (
          <img
            src={gift.imageUrl}
            alt={gift.name}
            onError={() => setImgError(true)}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-[#2d2218]">{gift.name}</h3>
          <p className="text-sm text-[#6f6257] mt-0.5">{gift.description}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {gift.type === 'individual' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B8860B]/10 text-[#8B5A00]">
                Unique
              </span>
            )}
            {gift.type === 'fractional' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                Shareable
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                <Clock size={10} />
                Reserved ({getLockRemaining()})
              </span>
            )}
            {contributedByMe && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                You contributed
              </span>
            )}
            {isSurging && !isLocked && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${goldGradient} text-white animate-pulse`}>
                <Flame className="h-3 w-3" /> Surging!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle section - flex-1 to push buttons to bottom */}
      <div className="flex-1">
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            {gift.type === 'individual' && gift.currentCollected === 0 ? (
              <>
                <span className="font-semibold text-[#2d2218]">Full Amount</span>
                <span className="font-bold text-[#8B5A00]">{gift.totalPrice} ETB</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-[#2d2218]">{Math.round(progress)}% funded</span>
                <span className="font-bold text-[#8B5A00]">{gift.currentCollected} / {gift.totalPrice} ETB</span>
              </>
            )}
          </div>
          <div className="w-full rounded-full h-2.5 overflow-hidden bg-[#ead9c0]">
            <motion.div
              className={`h-2.5 rounded-full ${goldGradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Contributors */}
        {gift.contributors && gift.contributors.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {gift.contributors.slice(0, 4).map((c, i) => (
                <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8860B]/20 text-[10px] font-bold text-[#8B5A00] border-2 border-white">
                  {(c.isAnonymous ? 'A' : c.name?.[0] || '?').toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-[#6f6257] font-medium">
              {gift.contributors.length} contributor{gift.contributors.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons - pinned to bottom */}
      <div className="space-y-2">
        {isOwner ? (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(gift)}
              disabled={gift.currentCollected > 0 || isComplete}
              className={`flex-1 rounded-xl py-2.5 text-sm font-black transition-all duration-300 ${
                gift.currentCollected > 0 || isComplete
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : `${goldGradient} text-white shadow-md shadow-[#8B5A00]/20 hover:brightness-110`
              }`}
            >
              {gift.currentCollected > 0 || isComplete ? 'Funding Started' : 'Edit Gift'}
            </button>
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
              className="rounded-xl border border-[#dcc6a7] bg-white/60 px-3.5 py-2.5 text-sm font-semibold text-[#6f6257] transition hover:bg-[#f5e7ca] hover:text-[#8B5A00]"
            >
              <Share2 size={14} />
            </button>
          </div>
        ) : (
          <>
            {gift.type === 'individual' && !isComplete && !isLocked && (
              <button
                onClick={handleReserve}
                className="w-full rounded-xl border-2 border-[#B8860B] text-[#8B5A00] py-2.5 text-sm font-bold hover:bg-[#B8860B]/5 transition"
              >
                <Lock size={14} className="inline mr-1" />
                Reserve & Contribute
              </button>
            )}

            {gift.type === 'individual' && isLocked && (
              <button
                onClick={handleRelease}
                disabled={releasing}
                className="w-full rounded-xl border-2 border-red-200 text-red-600 py-2.5 text-sm font-bold hover:bg-red-50 transition disabled:opacity-60"
              >
                {releasing ? 'Releasing...' : 'Release Reservation'}
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onContribute(gift)}
                disabled={isComplete}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black transition-all duration-300 ${
                  isComplete
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${goldGradient} text-white shadow-md shadow-[#8B5A00]/20 hover:brightness-110`
                }`}
              >
                {isComplete ? 'Fully Funded' : gift.type === 'individual' ? 'Claim This Gift' : 'Contribute'}
              </button>
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
                className="rounded-xl border border-[#dcc6a7] bg-white/60 px-3.5 py-2.5 text-sm font-semibold text-[#6f6257] transition hover:bg-[#f5e7ca] hover:text-[#8B5A00]"
              >
                <Share2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default GiftCard;
