import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, Heart, Share2, Download, ArrowLeft, Gift, PartyPopper, Camera, Sparkles, Clock, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const historyCardLayouts = [
  'border-l-4 border-[#B8860B] bg-gradient-to-r from-[#fdf8f0] to-white',
  'border-t-2 border-[#D4AF37] bg-gradient-to-b from-[#faf5ee] to-white',
  'border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white',
  'border-t-2 border-blue-400 bg-gradient-to-b from-blue-50 to-white',
  'border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-white',
];

const getHistoryLayout = (index) => historyCardLayouts[index % historyCardLayouts.length];

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const cardRef = useRef(null);
  const [currentContribution, setCurrentContribution] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confettiLaunched, setConfettiLaunched] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const sessionId = searchParams.get('session_id');
  const giftId = searchParams.get('gift_id');
  const cancelled = searchParams.get('cancelled');

  const launchConfetti = useCallback(() => {
    if (confettiLaunched) return;
    setConfettiLaunched(true);

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#B8860B', '#D4AF37', '#C49B52', '#FFD700'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#B8860B', '#D4AF37', '#C49B52', '#FFD700'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors: ['#B8860B', '#D4AF37', '#C49B52', '#FFD700', '#8B5A00'] });
    }, 500);
  }, [confettiLaunched]);

  useEffect(() => {
    const loadData = async () => {
      if (!giftId) {
        setLoading(false);
        return;
      }

      // Load gift info from API (safe — public endpoint)
      let giftData = null;
      try {
        const { data } = await api.get(`/gifts/${giftId}`);
        giftData = data;
      } catch {
        // gift fetch failed — try localStorage
      }

      // Load contribution from localStorage
      let amount = 0;
      let name = '';
      let message = '';
      let timestamp = Date.now();
      try {
        const pending = JSON.parse(localStorage.getItem('pendingContribution') || '{}');
        if (pending.giftId === giftId) {
          amount = pending.amount || 0;
          name = pending.guestName || 'You';
          message = pending.message || '';
          timestamp = pending.timestamp || Date.now();
        }
        localStorage.removeItem('pendingContribution');
      } catch {}

      // Fallback: if no amount from pending, check guestContributions
      if (!amount) {
        try {
          const guestCs = JSON.parse(localStorage.getItem('guestContributions') || '[]');
          const match = guestCs.find(c => c.giftId === giftId || c.giftId?._id === giftId);
          if (match) {
            amount = match.amount || 0;
            name = match.guestName || 'You';
            message = match.message || '';
            timestamp = new Date(match.createdAt).getTime() || Date.now();
          }
        } catch {}
      }

      setCurrentContribution({
        gift: giftData || { name: 'Wedding Gift' },
        amount,
        guestName: name,
        message,
        timestamp,
        giftId,
      });

      // Track this contribution
      try {
        const stored = JSON.parse(localStorage.getItem('contributedGiftIds') || '[]');
        if (!stored.includes(giftId)) {
          stored.push(giftId);
          localStorage.setItem('contributedGiftIds', JSON.stringify(stored));
        }
        const guestCs = JSON.parse(localStorage.getItem('guestContributions') || '[]');
        const existing = guestCs.findIndex(c => c.giftId === giftId || c.giftId?._id === giftId);
        const entry = {
          _id: giftId || Date.now().toString(),
          giftId: giftData || giftId,
          giftName: giftData?.name || 'Wedding Gift',
          amount,
          guestName: name || 'You',
          message: message || 'Thanks for your support!',
          createdAt: new Date(timestamp).toISOString(),
          status: 'completed',
        };
        if (existing >= 0) {
          guestCs[existing] = { ...guestCs[existing], ...entry };
        } else {
          guestCs.unshift(entry);
        }
        localStorage.setItem('guestContributions', JSON.stringify(guestCs.slice(0, 50)));
      } catch {}

      // Load all past contributions from localStorage
      try {
        const guestCs = JSON.parse(localStorage.getItem('guestContributions') || '[]');
        setHistory(guestCs.filter(c => c.amount > 0 || c.giftName));
      } catch {}

      launchConfetti();
      setLoading(false);
    };

    loadData();
  }, [giftId, launchConfetti]);

  useEffect(() => {
    if (cancelled === 'true' && giftId) {
      api.post(`/gifts/${giftId}/unlock`).catch(() => {});
    }
  }, [cancelled, giftId]);

  const handleShare = () => {
    const shareData = {
      title: 'ZeAlpha Wedding Gift Contribution',
      text: `I just contributed to "${currentContribution?.gift?.name || 'a wedding gift'}" on ZeAlpha! 🎉`,
      url: window.location.origin + (user ? '/my-gifts' : '/'),
    };
    if (navigator.share) { try { navigator.share(shareData); } catch {} }
    else { try { navigator.clipboard.writeText(shareData.url); } catch {} }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: '#faf6f0', useCORS: true, logging: false });
      const link = document.createElement('a');
      link.download = `zealpha-thankyou-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { window.print(); }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: '#faf6f0', useCORS: true, logging: false });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try { const item = new ClipboardItem({ 'image/png': blob }); await navigator.clipboard.write([item]); }
        catch { const link = document.createElement('a'); link.download = `zealpha-thankyou-${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click(); }
      });
    } catch { window.print(); }
  };

  // Helper to format date
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ''; }
  };

  if (cancelled) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f2ea] via-[#f9f5ef] to-[#eadfce] px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} className={`w-full max-w-md ${glassCard} p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <ArrowLeft className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-[#2d2218]">Payment Cancelled</h1>
          <p className="mt-3 text-sm text-[#6f6257]">Your contribution was not processed. You can try again anytime.</p>
          <Link to="/" className={`mt-6 inline-flex rounded-2xl ${goldGradient} px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110`}>Back to Home</Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-10 w-10 rounded-full border-3 border-[#B8860B] border-t-transparent" />
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Thank You Card */}
            <motion.div
              ref={cardRef}
              variants={itemVariants}
              className="rounded-[32px] border border-[#e7d6c1] bg-gradient-to-br from-[#fffdf9]/95 via-[#f8efe2]/92 to-[#ecdcc7]/90 p-8 md:p-12 shadow-[0_12px_40px_rgba(120,90,40,0.12)] backdrop-blur-xl text-center relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#D4AF37]/5"></div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.3 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-200"
              >
                <CheckCircle className="h-12 w-12 text-green-600" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-[#2d2218]"
              >
                Thank You!
              </motion.h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className={`mx-auto mt-4 h-1.5 w-20 rounded-full ${goldGradient} origin-center`}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-4 text-base text-[#6f6257] max-w-md mx-auto leading-relaxed"
              >
                Your generous contribution has been confirmed. The couple will be notified immediately.
              </motion.p>

              {/* Contribution Summary — always visible */}
              {currentContribution && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="mt-8 rounded-[24px] border border-[#ead9c0] bg-white/60 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-center gap-2 text-sm text-[#8B5A00] font-bold uppercase tracking-wider">
                    <Gift className="h-4 w-4" />
                    Contribution Summary
                  </div>
                  <div className="mt-4 space-y-3 text-left">
                    <div className="flex justify-between border-b border-[#eedcc9]/50 pb-2">
                      <span className="text-sm text-[#6f6257]">Gift</span>
                      <span className="text-sm font-bold text-[#2d2218]">{currentContribution.gift?.name || 'Wedding Gift'}</span>
                    </div>
                    {currentContribution.amount > 0 && (
                      <div className="flex justify-between border-b border-[#eedcc9]/50 pb-2">
                        <span className="text-sm text-[#6f6257]">Amount</span>
                        <span className="text-lg font-black text-[#8B5A00]">ETB {currentContribution.amount.toLocaleString()}</span>
                      </div>
                    )}
                    {currentContribution.guestName && (
                      <div className="flex justify-between border-b border-[#eedcc9]/50 pb-2">
                        <span className="text-sm text-[#6f6257]">From</span>
                        <span className="text-sm font-bold text-[#2d2218]">{currentContribution.guestName}</span>
                      </div>
                    )}
                    {currentContribution.message && (
                      <div className="flex justify-between border-b border-[#eedcc9]/50 pb-2">
                        <span className="text-sm text-[#6f6257]">Message</span>
                        <span className="text-sm italic text-[#2d2218]">"{currentContribution.message}"</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1">
                      <span className="text-sm text-[#6f6257]">Status</span>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                        <CheckCircle className="h-4 w-4" /> Confirmed
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-6 flex items-center justify-center gap-2 text-sm text-[#8c755e]"
              >
                <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                Your support makes a difference
                <PartyPopper className="h-4 w-4 text-[#B8860B]" />
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3">
              <Link to={user ? '/my-gifts' : '/'} className={`inline-flex items-center gap-2 rounded-2xl ${goldGradient} px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl active:scale-95`}>
                <ArrowLeft className="h-4 w-4" />
                {user ? 'View My Gifts' : 'Back to Home'}
              </Link>
              <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-2xl border border-[#dcc6a7] bg-white/60 px-6 py-3.5 text-sm font-bold text-[#6f6257] transition-all duration-300 hover:bg-white hover:shadow-md hover:border-[#B8860B]/30 active:scale-95">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-2xl border border-[#dcc6a7] bg-white/60 px-6 py-3.5 text-sm font-bold text-[#6f6257] transition-all duration-300 hover:bg-white hover:shadow-md hover:border-[#B8860B]/30 active:scale-95">
                <Download className="h-4 w-4" /> Download
              </button>
              <button onClick={handleSaveImage} className="inline-flex items-center gap-2 rounded-2xl border border-[#dcc6a7] bg-white/60 px-6 py-3.5 text-sm font-bold text-[#6f6257] transition-all duration-300 hover:bg-white hover:shadow-md hover:border-[#B8860B]/30 active:scale-95">
                <Camera className="h-4 w-4" /> Save Image
              </button>
            </motion.div>

            {/* Past Contributions History */}
            {history.length > 1 && (
              <motion.div variants={itemVariants} className="mt-8">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`w-full rounded-2xl ${glassCard} p-4 flex items-center justify-between transition hover:bg-white/80`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#B8860B]" />
                    <span className="text-sm font-bold text-[#2d2218]">Your Contribution History</span>
                    <span className="rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B5A00]">{history.length}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[#6f6257] transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>

                {showHistory && (
                  <div className="mt-4 space-y-3">
                    {history.map((c, idx) => (
                      <motion.div
                        key={c._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`rounded-2xl p-4 ${getHistoryLayout(idx)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Gift size={14} className="text-[#B8860B] flex-shrink-0" />
                              <p className="text-sm font-bold text-[#2d2218]">{c.giftName || 'Wedding Gift'}</p>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6f6257]">
                              {c.amount > 0 && <span className="font-bold text-[#8B5A00]">{c.amount.toLocaleString()} ETB</span>}
                              {c.guestName && <span>by {c.guestName}</span>}
                              {c.createdAt && <span>{fmtDate(c.createdAt)}</span>}
                            </div>
                            {c.message && (
                              <p className="mt-1 text-xs italic text-[#6f6257]">"{c.message}"</p>
                            )}
                          </div>
                          <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 flex items-center gap-1">
                            <CheckCircle size={10} /> Done
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ThankYou;
