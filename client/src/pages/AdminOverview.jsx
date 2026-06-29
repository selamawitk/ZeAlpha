import { motion } from 'framer-motion';
import AnalyticsCard from '../components/AnalyticsCard.jsx';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Shield, CheckCircle, BadgeCheck } from 'lucide-react';

import {
  fetchPendingContributions,
  updateContributionStatus,
  fetchPlatformStats,
  getContributions
} from '../api/api.js';
import api from '../api/api.js';

const AdminOverview = () => {
  const [pendingContributions, setPendingContributions] = useState([]);
  const [stats, setStats] = useState({
    weddingCount: 0,
    totalRaised: 0,
    contributionCount: 0,
    completedPayments: 0,
    pendingPayments: 0
  });

  const [loading, setLoading] = useState(true);
  const [allWeddings, setAllWeddings] = useState([]);
  const [vendorAnalytics, setVendorAnalytics] = useState({
    totalOrders: 0, deliveredOrders: 0, pendingOrders: 0,
    cancelledOrders: 0, fulfillmentRate: 0, mostUsedVendors: [],
  });

  // Background
  const pageBackground =
    'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';

  const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

  const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';

  // Shared button gradient
  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  const textPrimary = 'text-[#2d2218]';
  const textMuted = 'text-[#6f6257]';

  // LOAD REAL DATA
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch everything from database
        const [
          pendingData,
          statsData,
          allContributions,
          vendorData
        ] = await Promise.all([
          fetchPendingContributions(),
          fetchPlatformStats(),
          getContributions(),
          api.get('/vendors/analytics/summary').then(r => r.data).catch(() => null),
        ]);

        if (vendorData) setVendorAnalytics(vendorData);

        const weddingsRes = await api.get('/weddings');
        setAllWeddings(Array.isArray(weddingsRes.data) ? weddingsRes.data : []);

        // Real contribution stats
        const totalRaised = allContributions
          .filter(c => c.status === 'completed')
          .reduce(
            (sum, c) => sum + Number(c.amount || 0),
            0
          );

        const completedPayments =
          allContributions.filter(
            c => c.status === 'completed'
          ).length;

        const pendingPayments =
          allContributions.filter(
            c => c.status === 'pending'
          ).length;

        // REAL pending contributions
        setPendingContributions(pendingData);

        // REAL analytics data
        setStats({
          weddingCount:
            statsData?.weddingCount || 0,

          totalRaised,

          contributionCount:
            allContributions.length,

          completedPayments,

          pendingPayments
        });
      } catch (err) {
        console.error(
          'Failed to load admin overview data',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // APPROVE / REJECT REAL DATA
  const handleStatusUpdate = async (
    id,
    status
  ) => {
    try {
      await updateContributionStatus(id, status);

      // remove instantly from UI
      setPendingContributions(prev =>
        prev.filter(c => c._id !== id)
      );

      // update pending count live
      setStats(prev => ({
        ...prev,
        pendingPayments:
          status === 'completed'
            ? Math.max(prev.pendingPayments - 1, 0)
            : prev.pendingPayments
      }));
    } catch (err) {
      console.error(
        'Failed to update status',
        err
      );
    }
  };

  return (
    <div
      className={`relative min-h-screen ${pageBackground} px-4 pb-6 md:px-6 md:pb-8 w-full max-w-full overflow-x-hidden`}
    >
      {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-3xl"></div>

        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-6"
      >
        {/* Header */}
        <section
          className={`rounded-[28px] ${cardElevated} px-6 py-5 md:px-7 md:py-6`}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1
                className={`text-3xl md:text-[34px] font-black tracking-tight ${textPrimary}`}
              >
                Global Metrics
              </h1>

              <p className={`mt-2 text-sm md:text-[15px] ${textMuted}`}>
                Real-time analytics, contribution monitoring,
                and operational visibility across the platform.
              </p>
            </div>

            <div
              className={`${goldGradient} rounded-2xl px-5 py-3 shadow-lg shadow-[#8B5A00]/20`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75">
                Live Platform Status
              </p>

              <p className="mt-1 text-xl font-black text-white">
                Active
              </p>
            </div>
          </div>
        </section>

        {/* Analytics Cards */}
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Total Weddings", value: stats.weddingCount, subtitle: "Registered weddings.", percent: Math.min(Math.round((stats.weddingCount / (stats.weddingCount || 1)) * 100), 100) },
            { title: "Total Raised", value: `ETB ${stats.totalRaised.toLocaleString()}`, subtitle: "Completed contributions.", percent: stats.completedPayments > 0 ? Math.min(Math.round((stats.completedPayments / (stats.completedPayments + stats.pendingPayments || 1)) * 100), 100) : 0 },
            { title: "Pending Payments", value: stats.pendingPayments, subtitle: "Awaiting verification.", percent: stats.pendingPayments > 0 ? Math.min(Math.round((stats.pendingPayments / (stats.completedPayments + stats.pendingPayments || 1)) * 100), 100) : 0 },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <AnalyticsCard
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                percent={card.percent}
                accent={`${goldGradient} text-white shadow-md shadow-[#8B5A00]/20`}
              />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <section className="grid gap-4 lg:grid-cols-2">
          <motion.div
            className={`rounded-[28px] ${glassCard} p-5`}
            whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
          >
            <h2 className={`text-lg font-black ${textPrimary} mb-4`}>Funding Overview</h2>
            <div className="h-64 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Weddings', value: stats.weddingCount || 0 },
                  { name: 'Contributions', value: stats.contributionCount || 0 },
                  { name: 'Completed', value: stats.completedPayments || 0 },
                  { name: 'Pending', value: stats.pendingPayments || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5d7c4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6f6257' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6f6257' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5d7c4', background: 'rgba(255,255,255,0.95)' }} />
                  <Bar dataKey="value" fill="#B8860B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className={`rounded-[28px] ${glassCard} p-5`}
            whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
          >
            <h2 className={`text-lg font-black ${textPrimary} mb-4`}>Revenue Distribution</h2>
            <div className="h-64 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Total Raised', value: stats.totalRaised || 1 },
                      { name: 'Pending', value: stats.pendingPayments || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#B8860B" />
                    <Cell fill="#e5d7c4" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5d7c4', background: 'rgba(255,255,255,0.95)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs text-[#6f6257]">
                  <div className="h-3 w-3 rounded-full bg-[#B8860B]"></div>
                  Completed
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6f6257]">
                  <div className="h-3 w-3 rounded-full bg-[#e5d7c4]"></div>
                  Pending
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Vendor Analytics */}
        <section className={`rounded-[28px] ${glassCard} p-5 relative overflow-hidden`}>
          <div className="absolute top-3 right-3 z-10">
            <span className="rounded-full bg-[#8B5A00]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B5A00] border border-[#8B5A00]/20">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md opacity-60`}><Package className="h-6 w-6" /></div>
            <div>
              <h2 className={`text-xl font-black ${textPrimary}`}>Fulfillment Analytics</h2>
              <p className={`text-sm ${textMuted}`}>Vendor order metrics — coming soon</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#d8c4ac] bg-white/45 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Total Orders</p>
              <p className={`mt-2 text-2xl font-black ${textPrimary}`}>{vendorAnalytics.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-[#d8c4ac] bg-white/45 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Delivered</p>
              <p className="mt-2 text-2xl font-black text-green-700">{vendorAnalytics.deliveredOrders}</p>
            </div>
            <div className="rounded-2xl border border-[#d8c4ac] bg-white/45 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Pending</p>
              <p className="mt-2 text-2xl font-black text-amber-700">{vendorAnalytics.pendingOrders}</p>
            </div>
            <div className="rounded-2xl border border-[#d8c4ac] bg-white/45 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">Fulfillment Rate</p>
              <p className="mt-2 text-2xl font-black text-[#8B5A00]">{vendorAnalytics.fulfillmentRate}%</p>
            </div>
          </div>
          {vendorAnalytics.mostUsedVendors?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold mb-2">Top Vendors</p>
              <div className="flex flex-wrap gap-2">
                {vendorAnalytics.mostUsedVendors.map((v, i) => (
                  <span key={i} className="rounded-full bg-white/60 border border-[#D4C39B] px-3 py-1 text-xs font-semibold text-[#6f6257]">{v.name || 'Unknown'} ({v.count})</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Bottom Cards */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* Security Overview */}
          <div
            className={`rounded-[28px] ${glassCard} p-5`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md`}
              >
                <Shield className="h-6 w-6" />
              </div>

              <div>
                <h2 className={`text-xl font-black ${textPrimary}`}>
                  Security Overview
                </h2>

                <p className={`text-sm ${textMuted}`}>
                  Live monitoring & protection
                </p>
              </div>
            </div>

            <p className={`mt-5 text-sm leading-7 ${textMuted}`}>
              Admin sessions, payment verification logs,
              contribution tracking, and access control
              systems are continuously monitored through
              the secured infrastructure layer.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#d8c4ac] bg-white/45 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">
                  Total Contributions
                </p>

                <p className={`mt-2 text-2xl font-black ${textPrimary}`}>
                  {stats.contributionCount}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8c4ac] bg-white/45 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8c755e] font-bold">
                  Verified Payments
                </p>

                <p className="mt-2 text-2xl font-black text-green-700">
                  {stats.completedPayments}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Verifications */}
          <div
            className={`rounded-[28px] ${glassCard} p-5`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md`}
              >
                <CheckCircle className="h-6 w-6" />
              </div>

              <div>
                <h2 className={`text-xl font-black ${textPrimary}`}>
                  Pending Verifications
                </h2>

                <p className={`text-sm ${textMuted}`}>
                  Real-time review queue
                </p>
              </div>
            </div>

            <p className={`mt-4 text-sm leading-7 ${textMuted}`}>
              Review uploaded payment screenshots and
              validate guest contribution requests before
              final approval.
            </p>

            {loading ? (
              <div className="mt-5 rounded-2xl border border-[#d8c4ac] bg-white/40 p-5">
                <p className={`text-sm font-medium ${textPrimary}`}>
                  Loading real contribution data...
                </p>
              </div>
            ) : pendingContributions.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-[#d8c4ac] bg-white/40 p-5 text-center">
                <p className={`text-sm font-semibold ${textPrimary}`}>
                  No pending contributions.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {pendingContributions
                  .slice(0, 3)
                  .map((contrib, index) => (
                    <motion.div
                      key={contrib._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                      className="rounded-2xl border border-[#d9c5ad] bg-white/50 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <p className={`text-sm font-black ${textPrimary}`}>
                            {contrib.guestId?.name ||
                              'Unknown Guest'}
                          </p>

                          <p className="mt-1 text-lg font-black text-[#8B5A00]">
                            {contrib.amount} ETB
                          </p>

                          <p className={`mt-1 text-xs ${textMuted}`}>
                            {contrib.paymentMethod}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                contrib._id,
                                'completed'
                              )
                            }
                            className={`${goldGradient} rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md shadow-[#8B5A00]/30 transition-all duration-300 hover:brightness-110 hover:scale-[1.02]`}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                contrib._id,
                                'failed'
                              )
                            }
                            className="rounded-xl border border-[#B8860B]/30 bg-gradient-to-r from-[#F2E6D2] via-[#E8D7BC] to-[#D9C2A0] px-4 py-2.5 text-xs font-black text-[#5C3B00] shadow-sm transition-all duration-300 hover:from-[#E8D7BC] hover:to-[#D1B38A] hover:shadow-md"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Wedding Verification */}
        <section className="mt-6">
          <div className={`rounded-[28px] ${cardElevated} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[#B8860B]" />
              <h2 className={`text-2xl font-black ${textPrimary}`}>Wedding Verification</h2>
            </div>
            <p className={`text-sm ${textMuted} mb-4`}>Verify wedding registries to show the verified badge.</p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {allWeddings.length === 0 ? (
                <p className="text-sm text-[#6f6257]">No weddings found.</p>
              ) : allWeddings.map(w => (
                <div key={w._id} className="flex items-center justify-between rounded-2xl border border-[#D4C39B] bg-white/50 p-4">
                  <div className="flex items-center gap-2">
                    {w.isVerifiedWedding && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                    <div>
                      <p className={`text-sm font-bold ${textPrimary}`}>{w.weddingName}</p>
                      <p className={`text-xs ${textMuted}`}>
                        {(w.coupleName || w.couple?.name || 'Couple')} • {w.isVerifiedWedding ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const { verifyWedding } = await import('../api/api.js');
                        await verifyWedding(w._id, !w.isVerifiedWedding);
                        setAllWeddings(prev => prev.map(w2 => w2._id === w._id ? { ...w2, isVerifiedWedding: !w2.isVerifiedWedding } : w2));
                      } catch (err) {
                        alert('Failed to update verification status');
                      }
                    }}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                      w.isVerifiedWedding
                        ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : `${goldGradient} text-white shadow-md shadow-[#8B5A00]/20`
                    }`}
                  >
                    {w.isVerifiedWedding ? 'Remove Badge' : 'Verify'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default AdminOverview;
