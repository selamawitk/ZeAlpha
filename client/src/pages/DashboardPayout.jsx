import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { fetchPayouts } from '../api/api.js';
import api from '../api/api.js';
import { Banknote, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

const DashboardPayout = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [accountDetails, setAccountDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    country: '',
  });

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [requesting, setRequesting] = useState(false);
  const [gifts, setGifts] = useState([]);

  const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
  const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
  const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';
  const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
  const textPrimary = 'text-[#2d2218]';
  const textMuted = 'text-[#6f6257]';

  const loadData = useCallback(async () => {
    if (!user?.managedWedding) return;

    try {
      const [payoutData, giftsData, weddingData] = await Promise.all([
        fetchPayouts(user.managedWedding),
        api.get(`/gifts/wedding/${user.managedWedding}`),
        api.get(`/weddings/${user.managedWedding}`)
      ]);
      setHistory(payoutData);
      setGifts(giftsData.data || []);

      const ps = weddingData.data?.payoutSettings;
      if (ps) {
        setAccountDetails({
          accountHolderName: ps.accountHolderName || '',
          bankName: ps.bankName || '',
          accountNumber: ps.accountNumber || '',
          swiftCode: ps.swiftCode || '',
          country: ps.country || '',
        });
      }
    } catch (err) {
      console.error('Unable to load data', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => loadData();
    socket.on('withdrawal:update', handler);
    return () => socket.off('withdrawal:update', handler);
  }, [socket]);

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      await api.put(`/weddings/${user?.managedWedding}`, {
        payoutSettings: {
          preferredMethod: 'bank_transfer',
          accountHolderName: accountDetails.accountHolderName,
          bankName: accountDetails.bankName,
          accountNumber: accountDetails.accountNumber,
          swiftCode: accountDetails.swiftCode,
          country: accountDetails.country,
        }
      });

      setMessageType('success');
      setMessage('Bank account details saved successfully.');
    } catch {
      setMessageType('error');
      setMessage('Failed to save. Check your connection.');
    }
  };

  const handleRequestPayout = async () => {
    setRequesting(true);
    try {
      const fundedGifts = gifts.filter(g =>
        g.status === 'fullyFunded' || g.currentCollected >= g.totalPrice
      );
      const giftIds = fundedGifts.map(g => g._id);
      const totalAmount = fundedGifts.reduce((sum, g) => sum + g.totalPrice, 0);

      await api.post('/payouts', {
        weddingId: user?.managedWedding,
        giftIds,
        totalAmount,
        method: 'bank_transfer',
        accountDetails,
      });
      setMessageType('success');
      setMessage(`Payout of ETB ${totalAmount.toLocaleString()} requested for ${giftIds.length} gift(s)!`);
      const data = await fetchPayouts(user?.managedWedding);
      setHistory(data);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-300' },
    approved: { icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-300' },
    processing: { icon: Loader2, color: 'text-purple-600 bg-purple-50 border-purple-300' },
    completed: { icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-400' },
    rejected: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-300' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-full ${pageBackground} px-5 py-10 w-full max-w-full overflow-x-hidden`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${textPrimary}`}>
              Payout{' '}
              <span className={`italic ${goldGradient} bg-clip-text text-transparent font-black`}>
                Center
              </span>
            </h1>
            <p className={`mt-2 text-sm ${textMuted}`}>
              Request bank transfers for your funded gifts.
            </p>
          </div>
          <Link
            to="/dashboard"
            className={`inline-flex items-center justify-center rounded-2xl ${goldGradient} px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110`}
          >
            Back to Dashboard
          </Link>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Bank Account Details */}
          <motion.div
            variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } } }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`rounded-[28px] p-7 ${cardElevated}`}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Banknote size={22} className="text-[#8B5A00]" />
                <h2 className={`text-2xl font-black ${textPrimary}`}>Bank Information</h2>
              </div>
              <p className={`text-sm ${textMuted}`}>
                Enter your bank account details to receive payouts.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${textMuted}`}>Account Holder Name</label>
                <input
                  value={accountDetails.accountHolderName}
                  onChange={(e) => setAccountDetails(p => ({ ...p, accountHolderName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${textMuted}`}>Bank Name</label>
                <input
                  value={accountDetails.bankName}
                  onChange={(e) => setAccountDetails(p => ({ ...p, bankName: e.target.value }))}
                  placeholder="Commercial Bank of Ethiopia"
                  className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${textMuted}`}>Account Number</label>
                <input
                  value={accountDetails.accountNumber}
                  onChange={(e) => setAccountDetails(p => ({ ...p, accountNumber: e.target.value }))}
                  placeholder="1000134567890"
                  className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${textMuted}`}>Swift Code</label>
                  <input
                    value={accountDetails.swiftCode}
                    onChange={(e) => setAccountDetails(p => ({ ...p, swiftCode: e.target.value }))}
                    placeholder="CBETETAA (optional)"
                    className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                  />
                </div>
                <div>
                  <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${textMuted}`}>Country</label>
                  <input
                    value={accountDetails.country}
                    onChange={(e) => setAccountDetails(p => ({ ...p, country: e.target.value }))}
                    placeholder="Ethiopia"
                    className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full rounded-2xl ${goldGradient} px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110`}
              >
                Save Payout Details
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#dcc6a7]/50">
              <button
                type="button"
                disabled={requesting}
                onClick={handleRequestPayout}
                className={`w-full rounded-2xl border-2 border-[#B8860B] bg-transparent px-5 py-3.5 text-sm font-black text-[#8B5A00] transition-all duration-300 hover:bg-[#B8860B] hover:text-white flex items-center justify-center gap-2`}
              >
                {requesting ? (
                  <>Processing... <Loader2 size={16} className="animate-spin" /></>
                ) : (
                  <>Request Payout <ArrowRight size={16} /></>
                )}
              </button>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${messageType === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
              >
                {message}
              </motion.div>
            )}
          </motion.div>

          {/* Payout History */}
          <motion.div
            variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } } }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`rounded-[28px] p-7 ${cardElevated}`}
          >
            <div className="mb-6">
              <h2 className={`text-2xl font-black ${textPrimary}`}>Payout Requests</h2>
              <p className={`mt-1 text-sm ${textMuted}`}>
                Track the status of your payout requests.
              </p>
            </div>

            {loadingHistory ? (
              <div className="rounded-2xl border border-[#dcc6a7] bg-white/40 px-5 py-5">
                <p className={`text-sm font-semibold ${textPrimary}`}>Loading payout history...</p>
              </div>
            ) : history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[#dcc6a7] bg-white/40 px-5 py-8 text-center"
              >
                <Banknote size={36} className="mx-auto mb-3 text-[#D4C39B]" />
                <p className={`text-sm font-bold ${textPrimary}`}>No payouts requested yet</p>
                <p className={`mt-1 text-xs ${textMuted}`}>Funded gifts will appear here once you request a payout.</p>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-3"
              >
                {history.map((payout) => {
                  const cfg = statusConfig[payout.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={payout._id}
                      variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } }}
                      className="rounded-2xl border border-[#dcc6a7] bg-white/45 p-5 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-1.5 ${cfg.color.split(' ').slice(0, 2).join(' ')}`}>
                            <Icon size={16} className={cfg.color.split(' ')[0]} />
                          </div>
                          <div>
                            <p className={`text-sm font-black capitalize ${textPrimary}`}>
                              ETB {payout.totalAmount?.toLocaleString()}
                            </p>
                            <p className={`mt-0.5 text-xs ${textMuted}`}>
                              {new Date(payout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
                          {payout.status}
                        </span>
                      </div>
                      {payout.accountDetails?.bankName && (
                        <p className={`mt-2 text-xs ${textMuted} pl-[52px]`}>
                          {payout.accountDetails.bankName} · {payout.accountDetails.accountNumber?.slice(-4) ? `****${payout.accountDetails.accountNumber.slice(-4)}` : ''}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPayout;