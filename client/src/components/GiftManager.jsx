import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';

const GiftManager = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('individual');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentType = mode === 'individual' ? 'Unique Gifts' : 'Shareable Gifts';

  useEffect(() => {
    if (user?.managedWedding) {
      loadRecommendations();
    }
  }, [mode, user]);

  const loadRecommendations = async () => {
    if (!user?.managedWedding) return;
    setLoading(true);
    try {
      const res = await api.get(`/gifts/recommendations/${user.managedWedding}`);
      setSuggestions(res.data?.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggest = () => {
    loadRecommendations();
  };

  const filterByMode = () => {
    return suggestions
      .filter((s) => s.type === mode || !s.type)
      .slice(0, 6);
  };

  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

  return (
    <div className={`rounded-[28px] ${glassCard} p-8 mb-10`}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h2 className="text-3xl font-black text-[#2d2218]">
            Gift Manager
          </h2>

          <div
            className={`mt-3 h-1 w-16 rounded-full ${goldGradient}`}
          ></div>

          <p className="mt-4 text-sm text-[#6f6257]">
            Toggle registry styles and get elegant
            AI-inspired gift recommendations.
          </p>
        </div>

        {/* AI Button */}
        <button
          onClick={handleAISuggest}
          className={`${goldGradient} rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl`}
        >
          AI Suggest
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-3">
        {['unique', 'shareable'].map((option) => (
          <button
            key={option}
            onClick={() => setMode(option)}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
              mode === option
                ? `${goldGradient} text-white shadow-md`
                : 'border border-[#d8c2a5] bg-white/60 text-[#8B5A00] hover:bg-[#f5e7ca]'
            }`}
          >
            {option === 'unique'
              ? 'Unique'
              : 'Shareable'}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">

        {loading ? (
          <div className="col-span-3 text-center text-sm text-[#6f6257] py-8">Loading recommendations...</div>
        ) : suggestions.length === 0 ? (
          <div className="col-span-3 text-center text-sm text-[#6f6257] py-8">
            No recommendations yet. Add gifts to your registry first.
          </div>
        ) : (
          filterByMode().map((suggestion, idx) => (
            <div
              key={suggestion.id || idx}
              className="rounded-[28px] border border-[#ead9c0] bg-[#fffaf4] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b08b57]">
                {currentType}
              </p>

              <h3 className="mt-4 text-lg font-black leading-snug text-[#2d2218]">
                {suggestion.name}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-[#6f6257]">
                {suggestion.progress}% funded • {suggestion.remaining} ETB remaining
              </p>

            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default GiftManager;