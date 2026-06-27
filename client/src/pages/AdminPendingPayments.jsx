import React, { useState, useEffect } from 'react';
import {
  getContributions,
  updateContributionStatus
} from '../api/api.js';
import { motion } from 'framer-motion';

import { useSocket } from '../context/SocketContext.jsx';
import PaymentVerificationModal from '../components/PaymentVerificationModal';

const AdminPendingPayments = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContribution, setSelectedContribution] = useState(null);

  const { socket } = useSocket();

  // Luxury background
  const pageBackground =
    'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';

  const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

  const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';

  // Gold button gradient
  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  const textPrimary = 'text-[#2d2218]';
  const textMuted = 'text-[#6f6257]';

  const fetchPending = async () => {
    try {
      setLoading(true);

      const data = await getContributions();

      const pending = data.filter(
        (c) => c.status === 'pending'
      );

      setContributions(pending);
    } catch (err) {
      setError('Failed to fetch pending payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();

    // Live updates
    if (socket) {
      socket.on('newContribution', fetchPending);

      return () =>
        socket.off('newContribution', fetchPending);
    }
  }, [socket]);

  const handleStatusUpdate = async (
    id,
    newStatus
  ) => {
    try {
      await updateContributionStatus(id, newStatus);

      setContributions((prev) =>
        prev.filter((c) => c._id !== id)
      );

      setSelectedContribution(null);
    } catch (err) {
      alert(
        'Error updating status: ' + err.message
      );
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${pageBackground} flex items-center justify-center max-w-full overflow-x-hidden`}
      >
        <div
          className={`rounded-[28px] ${cardElevated} px-8 py-6`}
        >
          <p
            className={`text-sm font-bold ${textPrimary}`}
          >
            Loading verification queue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen ${pageBackground} px-4 pb-6 md:px-6 md:pb-8 w-full max-w-full overflow-x-hidden`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-3xl"></div>

        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <section
          className={`rounded-[28px] ${cardElevated} px-6 py-5 md:px-7 md:py-6`}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1
                className={`text-3xl md:text-[34px] font-black tracking-tight ${textPrimary}`}
              >
                Payment Verification
              </h1>

              <p
                className={`mt-2 text-sm md:text-[15px] ${textMuted}`}
              >
                Verify bank transfer
                payment receipts submitted by guests.
              </p>
            </div>

            <div
              className={`${goldGradient} rounded-2xl px-5 py-3 shadow-lg shadow-[#8B5A00]/20`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75">
                Pending Queue
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {contributions.length}
              </p>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-100 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Empty State */}
        {contributions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex h-64 flex-col items-center justify-center rounded-[28px] ${glassCard}`}
          >
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${goldGradient} text-2xl text-white shadow-lg`}
            >
              ✔
            </div>

            <p
              className={`text-lg font-black ${textPrimary}`}
            >
              All caught up!
            </p>

            <p className={`mt-2 text-sm ${textMuted}`}>
              No pending payments to verify.
            </p>
          </motion.div>
        ) : (
          <section
            className={`overflow-hidden rounded-[28px] ${glassCard}`}
          >
            {/* Table Top */}
            <div className="border-b border-[#cfa97a]/50 px-6 py-5">
              <h2
                className={`text-xl font-black ${textPrimary}`}
              >
                Verification Queue
              </h2>

              <p
                className={`mt-1 text-sm ${textMuted}`}
              >
                Real-time payment verification records.
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">
                      Guest
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">
                      Gift / Wedding
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">
                      Amount
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">
                      Method
                    </th>

                    <th className="px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">
                      Receipt
                    </th>

                    <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {contributions.map((c, index) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="transition-all duration-300 hover:bg-white/20"
                    >
                      {/* Guest */}
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <div
                          className={`font-black ${textPrimary}`}
                        >
                          {c.guestId?.name || 'Guest'}
                        </div>

                        <div
                          className={`mt-1 text-xs ${textMuted}`}
                        >
                          {c.guestId?.email}
                        </div>
                      </td>

                      {/* Gift */}
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <div
                          className={`text-sm font-bold ${textPrimary}`}
                        >
                          {c.giftId?.name || 'Gift'}
                        </div>

                        <div
                          className={`mt-1 text-xs ${textMuted}`}
                        >
                          ID:{' '}
                          {c.weddingId
                            ? c.weddingId.slice(-6)
                            : 'N/A'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td
                        className={`border-t border-[#d4bc99]/40 px-5 py-4 text-sm font-black text-[#8B5A00]`}
                      >
                        {c.amount} ETB
                      </td>

                      {/* Method */}
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <span className="inline-flex items-center rounded-full border border-[#d4bc99] bg-gradient-to-r from-[#F2E6D2] to-[#E8D7BC] px-3 py-1 text-xs font-black capitalize text-[#5C3B00] shadow-sm">
                          {c.paymentMethod}
                        </span>
                      </td>

                      {/* Receipt */}
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4 text-center">
                        {c.screenshotUrl ? (
                          <button
                            onClick={() =>
                              setSelectedContribution(c)
                            }
                            className={`text-sm font-black text-[#8B5A00] transition hover:underline`}
                          >
                            View Proof
                          </button>
                        ) : (
                          <span className="text-xs italic text-red-500">
                            No screenshot
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                c._id,
                                'completed'
                              )
                            }
                            className={`${goldGradient} rounded-xl px-4 py-2 text-xs font-black text-white shadow-md shadow-[#8B5A00]/25 transition-all duration-300 hover:brightness-110 hover:scale-[1.02]`}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                c._id,
                                'failed'
                              )
                            }
                            className="rounded-xl border border-[#B8860B]/30 bg-gradient-to-r from-[#F2E6D2] via-[#E8D7BC] to-[#D9C2A0] px-4 py-2 text-xs font-black text-[#5C3B00] shadow-sm transition-all duration-300 hover:from-[#E8D7BC] hover:to-[#D1B38A] hover:shadow-md"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Modal */}
      {selectedContribution && (
        <PaymentVerificationModal
          contribution={selectedContribution}
          onClose={() =>
            setSelectedContribution(null)
          }
          onApprove={() =>
            handleStatusUpdate(
              selectedContribution._id,
              'completed'
            )
          }
        />
      )}
    </div>
  );
};

export default AdminPendingPayments;
