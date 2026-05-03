import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';

const DashboardPayout = () => {
  const { user, loading } = useAuth();
  const [accountType, setAccountType] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState({ bankName: '', accountNumber: '', telebirrNumber: '' });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState('');

  const weddingId = user?.weddingId || localStorage.getItem('weddingId');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/payouts');
        setHistory(response.data);
      } catch (err) {
        console.error('Unable to load payout history');
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const handleSave = (event) => {
    event.preventDefault();
    localStorage.setItem('payoutDetails', JSON.stringify({ accountType, accountDetails }));
    setMessage('Payout settings saved.');
  };

  useEffect(() => {
    const stored = localStorage.getItem('payoutDetails');
    if (stored) {
      const parsed = JSON.parse(stored);
      setAccountType(parsed.accountType || 'bank_transfer');
      setAccountDetails(parsed.accountDetails || { bankName: '', accountNumber: '', telebirrNumber: '' });
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Payout & Settings</h1>
          <p className="text-secondary mt-2">Keep withdrawal details secure and review payout history.</p>
        </div>
        <Link to="/dashboard" className="btn-primary inline-flex">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-premium">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">Account details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Payout method</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="telebirr">TeleBirr</option>
              </select>
            </div>

            {accountType === 'bank_transfer' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Bank name</label>
                  <input
                    value={accountDetails.bankName}
                    onChange={(e) => setAccountDetails((prev) => ({ ...prev, bankName: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Account number</label>
                  <input
                    value={accountDetails.accountNumber}
                    onChange={(e) => setAccountDetails((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">TeleBirr wallet number</label>
                <input
                  value={accountDetails.telebirrNumber}
                  onChange={(e) => setAccountDetails((prev) => ({ ...prev, telebirrNumber: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <button className="btn-primary" type="submit">
              Save payout details
            </button>
            {message && <div className="rounded-2xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">{message}</div>}
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-premium">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">Withdrawal history</h2>
          {loadingHistory ? (
            <div className="text-secondary">Loading payout history...</div>
          ) : history.length === 0 ? (
            <div className="text-secondary">No payouts requested yet.</div>
          ) : (
            <div className="space-y-4">
              {history.map((payout) => (
                <div key={payout._id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary-dark">{payout.method}</p>
                      <p className="text-sm text-secondary">{new Date(payout.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-primary">ETB {payout.totalAmount}</p>
                  </div>
                  <p className="mt-2 text-sm text-secondary">Status: {payout.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPayout;
