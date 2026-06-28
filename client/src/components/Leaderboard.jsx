import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react';
import { getWeddingAnalytics } from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const rankIcons = [Crown, Trophy, Medal, Award, TrendingUp];
const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700', 'text-blue-500', 'text-green-500'];
const rankBg = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200', 'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200'];

const Leaderboard = ({ weddingId }) => {
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) return;
    const fetchLeaderboard = async () => {
      try {
        const data = await getWeddingAnalytics(weddingId);
        setTopContributors(data.topContributors || []);
      } catch {
        setTopContributors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [weddingId]);

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-6 shadow-premium">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-60 bg-gray-100 rounded" />
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (topContributors.length === 0) return null;

  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-premium border border-[#D4C39B]">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-[#B8860B]" />
        <h2 className="text-xl font-semibold text-primary-dark">Top Contributors</h2>
      </div>
      <p className="text-sm text-secondary mb-4">Most generous contributors to this registry</p>

      <div className="space-y-2">
        {topContributors.map((contributor, index) => {
          const RankIcon = rankIcons[index] || TrendingUp;
          const rankColor = rankColors[index] || 'text-gray-400';
          const rankBackground = rankBg[index] || 'bg-gray-50 border-gray-100';
          const isTop3 = index < 3;

          return (
            <motion.div
              key={contributor.guestId || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between rounded-2xl border p-3 ${rankBackground} ${
                isTop3 ? 'shadow-sm' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isTop3 ? goldGradient + ' text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isTop3 ? (
                    <RankIcon className={`h-4 w-4 ${isTop3 ? 'text-white' : rankColor}`} />
                  ) : (
                    <span className="text-xs font-black">{index + 1}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2d2218] truncate">
                    {contributor.name || 'Guest'}
                    {index === 0 && <span className="ml-1 text-xs text-[#B8860B]">★ Top</span>}
                  </p>
                  <p className="text-xs text-[#6f6257]">
                    {contributor.count} contribution{contributor.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-sm font-black ${isTop3 ? 'text-[#8B5A00]' : 'text-[#6f6257]'}`}>
                  {contributor.total?.toLocaleString()} ETB
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;