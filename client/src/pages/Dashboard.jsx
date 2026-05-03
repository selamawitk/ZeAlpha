import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { updateGiftSettlement } from '../api/api.js';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [wedding, setWedding] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [settlementLoading, setSettlementLoading] = useState({});

  useEffect(() => {
    if (user?.managedWedding) {
      const fetchData = async () => {
        try {
          const weddingRes = await api.get(`/weddings/${user.managedWedding}`);
          setWedding(weddingRes.data);
          const giftsRes = await api.get(`/gifts/wedding/${user.managedWedding}`);
          setGifts(giftsRes.data);
        } catch (err) {
          console.error('Failed to fetch data', err);
        }
      };
      fetchData();
    } else if (user && user.role === 'couple' && !loading) {
      navigate('/setup');
    }
  }, [user, loading, navigate]);

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

  const gold =
    "bg-gradient-to-r from-[#f7e7b0] via-[#d4af37] to-[#8a6310]";

  const cardBg =
    "bg-gradient-to-br from-[#fffdf8] via-[#fbf4e6] to-[#f2e6cc]";

  const glow =
    "shadow-[0_25px_80px_-30px_rgba(212,175,55,0.35)]";

  const deepShadow =
    "shadow-[0_35px_120px_-40px_rgba(0,0,0,0.18)]";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf7]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-100 rounded-full"></div>
          <div className="absolute inset-0 border border-t-[#d4af37] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'couple') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf7] px-4">
        <div className={`max-w-sm w-full text-center p-8 rounded-3xl ${cardBg} border border-[#f2e2bf] ${glow}`}>
          <h1 className="text-2xl font-serif font-bold text-[#2a1f14] mb-2">
            Private Studio
          </h1>
          <p className="text-gray-500 text-sm mb-6 font-medium">
            Sign in to access your registry
          </p>

          <Link
            to="/auth"
            className={`block w-full py-3 rounded-xl text-white text-sm font-semibold ${gold} hover:scale-[1.03] active:scale-95 transition`}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#fbfaf7] text-[#2a1f14]">

      {/* background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[32%] h-[32%] bg-[#d4af37]/20 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[32%] h-[32%] bg-[#8a5a2b]/20 blur-[130px] rounded-full"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl -mt-[30px] md:text-5xl font-serif font-extrabold leading-tight">
              Hello,{" "}
              <span className="italic bg-gradient-to-r from-[#d4af37] via-[#b8892e] to-[#7a4f12] bg-clip-text text-transparent font-bold">
                {user.firstName || 'Partner'}
              </span>
            </h1>

            <p className="text-sm text-gray-500 font-medium">
              Your wedding registry overview
            </p>
          </div>

          <Link
            to="/dashboard/settings"
            className={`px-5 py-3 rounded-xl text-sm font-semibold text-white ${gold} ${deepShadow} hover:scale-[1.03] active:scale-95 transition`}
          >
            Settings
          </Link>
        </header>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-10">

          {/* BALANCE CARD */}
          <div className={`md:col-span-5 p-6 rounded-3xl ${cardBg} border border-[#f3e2bf] ${glow} transition duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
            <div className="flex justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a78b5a] font-bold">
                  Balance
                </p>
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  Live
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-bold text-[#2a1f14]">
                0
              </span>
              <span className="text-sm text-gray-400 font-medium">ETB</span>
            </div>

            <div className="mt-6 pt-4 border-t border-[#f2e2bf] text-xs flex justify-between text-gray-500 font-medium">
              <span>Ready for payout</span>
              <Link
                to="/dashboard/wallet"
                className="text-[#b8892e] font-semibold hover:opacity-70"
              >
                Withdraw →
              </Link>
            </div>
          </div>

          {/* ACTION CARDS */}
          <div className="md:col-span-7 grid md:grid-cols-2 gap-5">

            <Link
              to="/dashboard/gifts"
              className={`p-6 rounded-3xl ${cardBg} border border-[#f3e2bf] ${glow} transition hover:-translate-y-2 hover:shadow-2xl group`}
            >
              <h3 className="text-lg font-serif font-bold text-[#2a1f14] mb-1">
                Gift Manager
              </h3>
              <p className="text-xs text-gray-500 mb-5 font-medium">
                Edit items & goals
              </p>
              <span className="text-sm text-[#b8892e] group-hover:translate-x-1 inline-block transition">
                →
              </span>
            </Link>

            <Link
              to="/dashboard/wallet"
              className={`p-6 rounded-3xl ${cardBg} border border-[#f3e2bf] ${glow} transition hover:-translate-y-2 hover:shadow-2xl group`}
            >
              <h3 className="text-lg font-serif font-bold text-[#2a1f14] mb-1">
                Payouts
              </h3>
              <p className="text-xs text-gray-500 mb-5 font-medium">
                Manage transfers
              </p>
              <span className="text-sm text-[#b8892e] group-hover:translate-x-1 inline-block transition">
                →
              </span>
            </Link>

          </div>
        </div>

        {/* PREVIEW SECTION */}
        <div className={`p-8 rounded-3xl bg-[#2a2017] text-white flex flex-col md:flex-row justify-between items-center gap-5 ${deepShadow}`}>
          <div>
            <h2 className="text-2xl font-serif font-bold ">
              Preview your registry
            </h2>
            <p className="text-sm text-white/70 font-medium">
              See exactly what your guests experience
            </p>
          </div>

          <Link
            to="/registry/preview"
            className={`px-6 py-3 rounded-xl ${gold} text-sm font-semibold hover:scale-[1.03] active:scale-95 transition`}
          >
            Preview
          </Link>
        </div>

        {/* SETTLEMENT SECTION */}
        {wedding && new Date() > new Date(wedding.weddingDate) && (
          <div className={`p-8 rounded-3xl ${cardBg} border border-[#f3e2bf] ${glow} mb-10`}>
            <h2 className="text-2xl font-serif font-bold text-[#2a1f14] mb-4">Post-Wedding Settlement</h2>
            <p className="text-sm text-gray-500 mb-6">Choose how to handle your gifts now that the wedding has passed.</p>
            <div className="space-y-4">
              {gifts.map(gift => (
                <div key={gift._id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <p className="font-semibold">{gift.name}</p>
                    <p className="text-sm text-gray-500">Collected: {gift.currentCollected} / {gift.totalPrice} ETB</p>
                  </div>
                  <div className="flex gap-2">
                    {gift.currentCollected >= gift.totalPrice ? (
                      <>
                        <button
                          onClick={() => handleSettlement(gift._id, 'store')}
                          disabled={settlementLoading[gift._id]}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Receive Physical Gift
                        </button>
                        <button
                          onClick={() => handleSettlement(gift._id, 'cashout')}
                          disabled={settlementLoading[gift._id]}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Cash Out
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSettlement(gift._id, 'cashout')}
                        disabled={settlementLoading[gift._id]}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Cash Out Partial
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-3 text-center text-[10px] text-gray-900 font-large">
          © 2026 ZeAlpha
        </footer>

      </div>
    </div>
  );
};

export default Dashboard;