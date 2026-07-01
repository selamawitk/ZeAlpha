import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Gift, Search, Bell, Heart, TrendingUp, Users, ChevronRight } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
const textPrimary = 'text-[#2d2218]';
const textMuted = 'text-[#6f6257]';

const GuestDashboard = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const { data } = await api.get('/contributions');
        const mine = Array.isArray(data)
          ? data.filter(c => String(c.guestId?._id || c.guestId) === String(user?._id))
          : [];
        setContributions(mine);
      } catch {
        setContributions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchContributions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const totalGiven = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const weddingGroups = useMemo(() => {
    const groups = {};
    contributions.forEach(c => {
      const wId = c.weddingId?._id || 'other';
      if (!groups[wId]) {
        groups[wId] = {
          wedding: c.weddingId || { weddingName: 'Other Wedding', slug: '' },
          items: [],
        };
      }
      groups[wId].items.push(c);
    });
    return Object.values(groups).sort((a, b) => {
      const aDate = a.items[0]?.createdAt || 0;
      const bDate = b.items[0]?.createdAt || 0;
      return new Date(bDate) - new Date(aDate);
    });
  }, [contributions]);

  return (
    <div className={`space-y-8 ${pageBackground} ${textPrimary}`}>
      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className={`rounded-[28px] ${glassCard} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
              <Gift className="h-5 w-5 text-[#8B5A00]" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2d2218]">
                {loading ? '...' : contributions.length}
              </p>
              <p className="text-xs text-[#6f6257] font-medium">Contributions</p>
            </div>
          </div>
        </div>

        <div className={`rounded-[28px] ${glassCard} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
              <TrendingUp className="h-5 w-5 text-[#8B5A00]" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2d2218]">
                {loading ? '...' : `ETB ${totalGiven.toLocaleString()}`}
              </p>
              <p className="text-xs text-[#6f6257] font-medium">Total Given</p>
            </div>
          </div>
        </div>

        <div className={`rounded-[28px] ${glassCard} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
              <Heart className="h-5 w-5 text-[#8B5A00]" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2d2218]">
                {contributions.filter(c => c.status === 'completed').length}
              </p>
              <p className="text-xs text-[#6f6257] font-medium">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/find-wedding"
          className={`group rounded-[28px] ${glassCard} p-6 transition-all duration-300 hover:shadow-lg hover:border-[#B8860B]/40 hover:-translate-y-1`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md transition-all duration-300 group-hover:scale-110`}>
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-[#2d2218]">Find a Wedding</h3>
              <p className="text-sm text-[#6f6257] font-medium">Search for weddings to contribute to</p>
            </div>
          </div>
        </Link>

        <Link
          to="/my-gifts"
          className={`group rounded-[28px] ${glassCard} p-6 transition-all duration-300 hover:shadow-lg hover:border-[#B8860B]/40 hover:-translate-y-1`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md transition-all duration-300 group-hover:scale-110`}>
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-[#2d2218]">My Gifts</h3>
              <p className="text-sm text-[#6f6257] font-medium">View your contribution history</p>
            </div>
          </div>
        </Link>

        <Link
          to="/notifications"
          className={`group rounded-[28px] ${glassCard} p-6 transition-all duration-300 hover:shadow-lg hover:border-[#B8860B]/40 hover:-translate-y-1`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md transition-all duration-300 group-hover:scale-110`}>
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-[#2d2218]">Notifications</h3>
              <p className="text-sm text-[#6f6257] font-medium">Stay updated on your contributions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/find-wedding"
          className={`group rounded-[28px] ${glassCard} p-6 transition-all duration-300 hover:shadow-lg hover:border-[#B8860B]/40 hover:-translate-y-1`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${goldGradient} text-white shadow-md transition-all duration-300 group-hover:scale-110`}>
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-[#2d2218]">Browse Weddings</h3>
              <p className="text-sm text-[#6f6257] font-medium">Discover new wedding registries</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Thank You Cards – grouped by wedding */}
      <div className="space-y-5">
        <h2 className={`text-lg font-black text-[#2d2218]`}>
          My Thank You Cards
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-[28px] bg-[#ead9c0]/50 animate-pulse"></div>
            ))}
          </div>
        ) : weddingGroups.length === 0 ? (
          <div className={`rounded-[28px] ${glassCard} p-6 text-center`}>
            <Gift className="mx-auto h-8 w-8 text-[#6f6257]" />
            <p className={`mt-2 text-sm text-[#6f6257] font-medium`}>No contributions yet.</p>
            <Link
              to="/find-wedding"
              className={`mt-3 inline-flex rounded-xl ${goldGradient} px-4 py-2 text-xs font-black text-white shadow-md shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 hover:scale-[1.02]`}
            >
              Find a Wedding
            </Link>
          </div>
        ) : (
          weddingGroups.map((group) => {
            const w = group.wedding;
            const totalForWedding = group.items.reduce((s, c) => s + Number(c.amount || 0), 0);
            const linkTo = w.slug ? `/w/${w.slug}` : '/find-wedding';
            return (
              <Link key={w._id || 'other'} to={linkTo} className={`group block rounded-[28px] ${glassCard} p-5 transition-all duration-300 hover:shadow-lg hover:border-[#B8860B]/40 hover:-translate-y-1`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-[#2d2218] group-hover:text-[#B8860B] transition-colors">
                      {w.weddingName || 'Wedding'}
                    </h3>
                    <p className="text-xs text-[#6f6257] mt-0.5">
                      {group.items.length} contribution{group.items.length > 1 ? 's' : ''} · ETB {totalForWedding.toLocaleString()} total
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <div className="space-y-2">
                  {group.items.slice(-3).reverse().map((c) => (
                    <div key={c._id} className="flex items-center justify-between rounded-xl border border-[#CFA97A]/60 bg-white/40 p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${goldGradient} text-[10px] font-black text-white`}>
                          {c.giftId?.name?.[0] || 'G'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2d2218]">
                            {c.giftId?.name || 'Wedding Gift'}
                          </p>
                          <p className="text-[10px] text-[#6f6257]">
                            {new Date(c.createdAt).toLocaleDateString()}
                            {c.status && (
                              <span className={`ml-1.5 ${c.status === 'completed' ? 'text-green-600' : c.status === 'pending' ? 'text-amber-600' : 'text-red-600'}`}>
                                • {c.status}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-[#8B5A00]">
                        ETB {Number(c.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {group.items.length > 3 && (
                    <p className="text-[11px] text-[#8B5A00] font-medium text-center">
                      +{group.items.length - 3} more
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
