import AnalyticsCard from '../components/AnalyticsCard.jsx';
import { useEffect, useState } from 'react';
import { fetchPendingContributions, updateContributionStatus, fetchPlatformStats } from '../api/api.js';

const AdminOverview = () => {
  const [pendingContributions, setPendingContributions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pendingData, statsData] = await Promise.all([
          fetchPendingContributions(),
          fetchPlatformStats()
        ]);
        setPendingContributions(pendingData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateContributionStatus(id, status);
      setPendingContributions(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-[#121212] p-8 text-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]">
        <h1 className="text-3xl font-semibold text-white">Global Metrics</h1>
        <p className="mt-2 text-sm text-gray-400">Operational visibility for the platform, vendor workflows, and fulfillment readiness.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <AnalyticsCard title="Total weddings" value={stats.weddingCount || 0} subtitle="All weddings served across the platform." percent={76} accent="bg-amber-100 text-amber-800" />
        <AnalyticsCard title="Total contributions" value={`ETB ${stats.totalRaised?.toLocaleString() || 0}`} subtitle="Total contributed across active registries." percent={84} accent="bg-amber-100 text-amber-800" />
        <AnalyticsCard title="Fulfillment health" value="92%" subtitle="Vendor order completion success rate." percent={92} accent="bg-emerald-100 text-emerald-800" />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-[#171717] p-6 text-white">
          <h2 className="text-xl font-semibold">Security Overview</h2>
          <p className="mt-3 text-sm text-gray-400">Admin sessions, audit trails, and master-level access control are centrally monitored.</p>
        </div>
        <div className="rounded-[2rem] bg-[#171717] p-6 text-white">
          <h2 className="text-xl font-semibold">Pending Verifications</h2>
          <p className="mt-3 text-sm text-gray-400">Review manual payment screenshots and approve or reject contributions.</p>
          {loading ? (
            <p>Loading...</p>
          ) : pendingContributions.length === 0 ? (
            <p>No pending contributions.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingContributions.map(contrib => (
                <div key={contrib._id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                  <div>
                    <p className="text-sm">{contrib.guestId?.name} - {contrib.amount} ETB</p>
                    <p className="text-xs text-gray-400">{contrib.paymentMethod}</p>
                    {contrib.screenshotUrl && (
                      <img src={contrib.screenshotUrl} alt="Screenshot" className="w-20 h-20 mt-2" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(contrib._id, 'completed')}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(contrib._id, 'failed')}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
