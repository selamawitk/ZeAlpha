import React, { useState, useEffect } from 'react';
import { getContributions, updateContributionStatus } from '../api/api';
import { useSocket } from '../context/SocketContext';
import PaymentVerificationModal from '../components/PaymentVerificationModal';

const AdminPendingPayments = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContribution, setSelectedContribution] = useState(null);
  const { socket } = useSocket();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await getContributions();
      // Filter for manual payments (TeleBirr/Bank) that are still pending
      const pending = data.filter(c => c.status === 'pending');
      setContributions(pending);
    } catch (err) {
      setError('Failed to fetch pending payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();

    // Listen for new contributions in real-time
    if (socket) {
      socket.on('newContribution', () => fetchPending());
      return () => socket.off('newContribution');
    }
  }, [socket]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateContributionStatus(id, { status: newStatus });
      setContributions(prev => prev.filter(c => c._id !== id));
      setSelectedContribution(null);
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading verification queue...</div>;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-primary-dark">Payment Verification</h1>
        <p className="text-secondary">Verify manual TeleBirr and Bank Transfer receipts</p>
      </header>

      {error && <div className="rounded-xl bg-red-50 p-4 text-red-600">{error}</div>}

      {contributions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white">
          <p className="text-secondary">All caught up! No pending payments to verify.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-secondary">
              <tr>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Gift / Wedding</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-center">Receipt</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contributions.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary-dark">{c.guestId?.name || 'Guest'}</div>
                    <div className="text-xs text-secondary">{c.guestId?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{c.giftId?.name}</div>
                    <div className="text-xs text-secondary">ID: {c.weddingId?.slice(-6)}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary">
                    {c.amount} ETB
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                      {c.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.screenshotUrl ? (
                      <button 
                        onClick={() => setSelectedContribution(c)}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        View Proof
                      </button>
                    ) : (
                      <span className="text-xs text-red-400 italic">No screenshot</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleStatusUpdate(c._id, 'completed')}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(c._id, 'failed')}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedContribution && (
        <PaymentVerificationModal 
          contribution={selectedContribution} 
          onClose={() => setSelectedContribution(null)} 
          onApprove={() => handleStatusUpdate(selectedContribution._id, 'completed')}
        />
      )}
    </div>
  );
};

export default AdminPendingPayments;