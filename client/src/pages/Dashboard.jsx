import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, AlertTriangle, PartyPopper, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import api, { updateGiftSettlement } from '../api/api.js';
import AiPlanner from '../components/AiPlanner.jsx';
import CelebrationModal from '../components/CelebrationModal.jsx';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
const textPrimary = 'text-[#2d2218]';
const textMuted = 'text-[#6f6257]';

const Spinner = () => (
  <div className={`min-h-screen flex items-center justify-center ${pageBackground}`}>
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 border border-amber-100 rounded-full"></div>
      <div className="absolute inset-0 border border-t-primary-gold rounded-full animate-spin"></div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const [wedding, setWedding] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loadingWedding, setLoadingWedding] = useState(true);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [settlementLoading, setSettlementLoading] = useState({});
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [celebratedGift, setCelebratedGift] = useState(null);

  useEffect(() => {
    if (user?.managedWedding) {
      const fetchWedding = async () => {
        try {
          const weddingRes = await api.get(`/weddings/${user.managedWedding}`);
          setWedding(weddingRes.data);
        } catch (err) {
          console.error('Failed to fetch wedding', err);
        } finally {
          setLoadingWedding(false);
        }
      };
      const fetchGifts = async () => {
        try {
          const giftsRes = await api.get(`/gifts/wedding/${user.managedWedding}`);
          setGifts(Array.isArray(giftsRes.data) ? giftsRes.data : []);
        } catch (err) {
          console.error('Failed to fetch gifts', err);
          setGifts([]);
        } finally {
          setLoadingGifts(false);
        }
      };
      fetchWedding();
      fetchGifts();
    } else {
      setLoadingWedding(false);
      setLoadingGifts(false);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!socket) return;
    const handleGiftUpdate = (updatedGift) => {
      setGifts(prev => {
        const existing = prev.find(g => g._id === updatedGift._id);
        if (existing && existing.status !== 'fullyFunded' && updatedGift.status === 'fullyFunded') {
          setCelebratedGift(updatedGift);
        }
        return prev.map(g => g._id === updatedGift._id ? { ...g, ...updatedGift } : g);
      });
    };
    socket.on('gift:update', handleGiftUpdate);
    return () => socket.off('gift:update', handleGiftUpdate);
  }, [socket]);

  const handleSettlement = async (giftId, deliveryOptions) => {
    setSettlementLoading(prev => ({ ...prev, [giftId]: true }));
    try {
      await updateGiftSettlement(giftId, deliveryOptions);
      setGifts(prev => prev.map(g => g._id === giftId ? { ...g, status: deliveryOptions === 'store' ? 'purchased' : 'cashedOut', deliveryOptions } : g));
    } catch (err) {
      console.error('Failed to update settlement', err);
    } finally {
      setSettlementLoading(prev => ({ ...prev, [giftId]: false }));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!user || user.role !== 'couple') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBackground} px-4`}>
        <div className={`max-w-sm w-full text-center p-8 rounded-[28px] ${glassCard}`}>
          <h1 className={`text-2xl font-bold ${textPrimary} mb-2`}>Private Studio</h1>
          <p className={`${textMuted} text-sm mb-6 font-medium`}>Sign in to access your registry</p>
          <Link to="/auth" className={`block w-full py-3 rounded-xl text-white text-sm font-semibold ${goldGradient} hover:scale-[1.03] active:scale-95 transition`}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!user.managedWedding) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBackground} px-4`}>
        <div className={`max-w-sm w-full text-center p-8 rounded-[28px] ${glassCard}`}>
          <h1 className={`text-2xl font-bold ${textPrimary} mb-2`}>Welcome to ZeAlpha</h1>
          <p className={`${textMuted} text-sm mb-6 font-medium`}>Set up your wedding registry to get started.</p>
          <Link to="/setup" className={`block w-full py-3 rounded-xl text-white text-sm font-semibold ${goldGradient} hover:scale-[1.03] active:scale-95 transition`}>
            Create Your Registry
          </Link>
        </div>
      </div>
    );
  }

  if (loadingWedding && loadingGifts) {
    return <Spinner />;
  }

  const giftCount = gifts?.length ?? 0;
  const totalRaised = wedding?.stats?.totalRaised ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`min-h-full ${pageBackground} ${textPrimary} overflow-x-hidden max-w-full`}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[32%] h-[32%] bg-primary-gold/20 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[32%] h-[32%] bg-[#8a5a2b]/20 blur-[130px] rounded-full"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative max-w-6xl mx-auto px-4 pt-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-[#2d2218]">
              Hello,{' '}
              <span className={`italic ${goldGradient} bg-clip-text text-transparent font-black break-words`}>
                {user.name?.split(' ')[0] || 'Partner'}
              </span>
            </h1>
            <p className={`text-sm ${textMuted} font-medium`}>Your wedding registry overview</p>
          </div>
          <Link to="/dashboard/settings" className={`px-5 py-3 rounded-xl text-sm font-semibold text-white ${goldGradient} hover:scale-[1.03] active:scale-95 transition`}>
            Settings
          </Link>
        </header>

        {/* Wedding deadline alert */}
        {(() => {
          if (!wedding?.weddingDate) return null;
          const now = new Date();
          const weddingDate = new Date(wedding.weddingDate);
          const diffMs = weddingDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays > 14) return null;
          const isPast = diffDays <= 0;
          const urgency = isPast ? 'bg-red-50 border-red-200 text-red-800' : diffDays <= 3 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-amber-50 border-amber-200 text-amber-800';
          return (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-2xl border ${urgency} flex items-center gap-3`}>
              {isPast ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <Calendar className="w-5 h-5 flex-shrink-0" />}
              <div className="text-sm font-medium">
                {isPast ? (
                  <span>Your wedding date has passed! <Link to="/dashboard/manage" className="underline font-bold">Review your gifts</Link> to settle them.</span>
                ) : diffDays === 0 ? (
                  <span><PartyPopper className="inline h-4 w-4 mr-1" />Today is your wedding day! Congratulations!</span>
                ) : diffDays === 1 ? (
                  <span><PartyPopper className="inline h-4 w-4 mr-1" />Your wedding is tomorrow! Make sure your registry is ready.</span>
                ) : (
                  <span>Only <strong>{diffDays} days</strong> until your wedding! Share your registry with guests.</span>
                )}
              </div>
            </motion.div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} whileHover={{ scale: 1.02, y: -4 }} className="h-full">
            <div className={`p-6 rounded-[28px] ${cardElevated} h-full flex flex-col`}>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#8c755e]">Total Gifts</p>
              <p className={`mt-3 text-5xl font-black tracking-tight ${textPrimary}`}>{loadingGifts ? '—' : giftCount}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-[#e5d7c4] overflow-hidden">
                  <div className={`h-full rounded-full ${goldGradient}`} style={{ width: `${giftCount > 0 ? 100 : 0}%` }}></div>
                </div>
                <span className="text-xs font-semibold text-[#8B5A00]">{loadingGifts ? '...' : `${giftCount} in registry`}</span>
              </div>
              <Link to="/dashboard/gifts" className="mt-auto pt-4 text-xs font-bold text-[#8B5A00] hover:opacity-70 transition flex items-center gap-1">Manage Gifts →</Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} whileHover={{ scale: 1.02, y: -4 }} className="h-full">
            <div className={`p-6 rounded-[28px] ${cardElevated} h-full flex flex-col`}>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#8c755e]">Total Raised</p>
              <p className={`mt-3 text-5xl font-black tracking-tight ${textPrimary}`}>{loadingWedding ? '—' : totalRaised.toLocaleString()}</p>
              <p className="mt-1 text-sm font-bold text-[#6f6257]">ETB</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-[#e5d7c4] overflow-hidden">
                  <div className={`h-full rounded-full ${goldGradient}`} style={{ width: `${totalRaised > 0 ? 100 : 0}%` }}></div>
                </div>
                <span className="text-xs font-semibold text-green-700">Live</span>
              </div>
              <Link to="/dashboard/wallet" className="mt-auto pt-4 text-xs font-bold text-[#8B5A00] hover:opacity-70 transition flex items-center gap-1">Withdraw →</Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} whileHover={{ scale: 1.02, y: -4 }} className="h-full sm:col-span-2 lg:col-span-1">
            <div className={`p-6 rounded-[28px] ${cardElevated} h-full flex flex-col`}>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#8c755e]">Funded Gifts</p>
              <p className={`mt-3 text-5xl font-black tracking-tight ${textPrimary}`}>{loadingGifts ? '—' : gifts.filter(g => g.status === 'fullyFunded').length}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-[#e5d7c4] overflow-hidden">
                  <div className={`h-full rounded-full ${goldGradient}`} style={{ width: `${giftCount > 0 ? Math.round((gifts.filter(g => g.status === 'fullyFunded').length / giftCount) * 100) : 0}%` }}></div>
                </div>
                <span className="text-xs font-semibold text-[#8B5A00]">{giftCount > 0 ? `${Math.round((gifts.filter(g => g.status === 'fullyFunded').length / giftCount) * 100)}%` : '0%'}</span>
              </div>
              <Link to="/dashboard/gifts" className="mt-auto pt-4 text-xs font-bold text-[#8B5A00] hover:opacity-70 transition flex items-center gap-1">View All →</Link>
            </div>
          </motion.div>
        </div>

        {/* AI Wedding Planner */}
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="mb-6">
          <button
            onClick={() => setShowAiPlanner(true)}
            className={`w-full p-8 rounded-[28px] bg-gradient-to-r from-[#4b3b2d] to-[#3d2e21] text-white flex flex-col md:flex-row justify-between items-center gap-5 hover:brightness-110 transition-all text-left`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-7 w-7 text-[#d4af37]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Wedding Planner</h2>
                <p className="text-sm text-white/70 font-medium">Get intelligent gift suggestions for your registry</p>
              </div>
            </div>
            <span className={`px-6 py-3 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] text-sm font-semibold`}>
              Open Planner →
            </span>
          </button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
          <div className={`p-8 rounded-[28px] bg-[#4b3b2d] text-white flex flex-col md:flex-row justify-between items-center gap-5`}>
            <div>
              <h2 className="text-2xl font-bold">Preview your registry</h2>
              <p className="text-sm text-white/70 font-medium">See exactly what your guests experience</p>
            </div>
            <Link to={`/w/${wedding?.slug || 'preview'}`} className={`px-6 py-3 rounded-xl ${goldGradient} text-sm font-semibold hover:scale-[1.03] active:scale-95 transition`}>
              Preview
            </Link>
          </div>
        </motion.div>

        {wedding && new Date() > new Date(wedding.weddingDate) && (
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <div className={`p-8 mt-10 rounded-[28px] ${glassCard} mb-10`}>
              <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Post-Wedding Settlement</h2>
              <p className={`text-sm ${textMuted} mb-6`}>Choose how to handle your gifts now that the wedding has passed.</p>
              <div className="grid grid-cols-1 gap-4">
                {gifts?.map(gift => (
                  <div key={gift._id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/80 rounded-xl border border-[#CFA97A]`}>
                    <div className="break-words flex-1 min-w-0">
                      <p className={`font-semibold ${textPrimary}`}>{gift.name}</p>
                      <p className={`text-sm ${textMuted}`}>Collected: {gift.currentCollected} / {gift.totalPrice} ETB</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {gift.currentCollected >= gift.totalPrice ? (
                        <>
                          <button onClick={() => handleSettlement(gift._id, 'store')} disabled={settlementLoading[gift._id]} className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${goldGradient} hover:scale-[1.03] active:scale-95 transition disabled:opacity-50`}>Receive Physical Gift</button>
                          <button onClick={() => handleSettlement(gift._id, 'cashout')} disabled={settlementLoading[gift._id]} className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${goldGradient} hover:scale-[1.03] active:scale-95 transition disabled:opacity-50`}>Cash Out</button>
                        </>
                      ) : (
                        <button onClick={() => handleSettlement(gift._id, 'cashout')} disabled={settlementLoading[gift._id]} className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${goldGradient} hover:scale-[1.03] active:scale-95 transition disabled:opacity-50`}>Cash Out Partial</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {showAiPlanner && (
          <AiPlanner
            weddingId={user?.managedWedding}
            onClose={() => setShowAiPlanner(false)}
          />
        )}

        <CelebrationModal
          gift={celebratedGift}
          isOpen={Boolean(celebratedGift)}
          onClose={() => setCelebratedGift(null)}
        />

        <footer className={`mt-3 text-center text-[10px] ${textMuted} font-bold`}>
          © 2026 ZeAlpha
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
