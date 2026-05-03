import { useEffect, useState } from 'react';
import GiftManager from '../components/GiftManager.jsx';
import api from '../api/api.js';
import GiftCard from '../components/GiftCard.jsx';

const DashboardGifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGifts = async () => {
      try {
        const response = await api.get('/gifts');
        setGifts(response.data || []);
      } catch (_) {
        setError('Unable to load registry gifts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGifts();
  }, []);

  return (
    <div className="space-y-8">
      <GiftManager />
      <div className="rounded-[2rem] bg-white p-8 shadow-premium">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary-dark">Gift Operations</h2>
            <p className="mt-3 text-sm text-secondary">Manage unique and shareable registry items in one place.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-center text-secondary">Loading gifts...</div>
        ) : error ? (
          <div className="mt-8 rounded-3xl bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : gifts.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-primary/5 p-6 text-sm text-secondary">No gifts found for this couple yet.</div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard key={gift._id} gift={gift} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardGifts;
