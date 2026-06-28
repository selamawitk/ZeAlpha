import { useState } from 'react';
import { Sparkles, X, ChevronRight, Gift, Plus, AlertCircle } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const RELATIONSHIPS = [
  'Best Friend',
  'Friend',
  'Sister',
  'Brother',
  'Cousin',
  'Family Member',
  'Boyfriend/Girlfriend',
  'Classmate',
  'Coworker',
  'Relative',
];

const BUDGET_PRESETS = [500, 1000, 3000, 5000];

const AiSuggestion = ({ weddingId, weddingName, coupleName, onJoinGift, onCreateGift, onClose }) => {
  const [step, setStep] = useState('form');
  const [relationship, setRelationship] = useState('');
  const [budget, setBudget] = useState('');
  const [customBudget, setCustomBudget] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getBudget = () => {
    if (useCustom) return Number(customBudget);
    return Number(budget);
  };

  const handleGetSuggestion = async () => {
    const b = getBudget();
    if (!relationship) {
      setError('Please select your relationship to the couple.');
      return;
    }
    if (!b || b <= 0) {
      setError('Please select or enter a valid budget.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/recommendation', {
        weddingId,
        budget: b,
        relationship,
      });
      setRecommendations(data.recommendations || []);
      setStep('results');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to get AI recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (rec) => {
    if (onJoinGift) onJoinGift(rec);
  };

  const handleCreateNew = () => {
    if (onCreateGift) onCreateGift();
  };

  const reset = () => {
    setStep('form');
    setRelationship('');
    setBudget('');
    setCustomBudget('');
    setUseCustom(false);
    setRecommendations([]);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-[28px] bg-white shadow-2xl border border-[#D4C39B] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose || reset}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-[#D4C39B] text-[#6f6257] hover:bg-[#f5e7ca] transition"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${goldGradient} text-white`}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2d2218]">AI Gift Suggestion</h3>
              <p className="text-xs text-[#6f6257]">Powered by Gemini</p>
            </div>
          </div>

          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-2 block">Your Relationship</label>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONSHIPS.map((rel) => (
                    <button
                      key={rel}
                      onClick={() => setRelationship(rel)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                        relationship === rel
                          ? `${goldGradient} text-white shadow-md`
                          : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-2 block">Your Budget (ETB)</label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setBudget(b); setUseCustom(false); }}
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                        !useCustom && budget === b
                          ? `${goldGradient} text-white shadow-md`
                          : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                      }`}
                    >
                      {b.toLocaleString()} ETB
                    </button>
                  ))}
                  <button
                    onClick={() => { setUseCustom(true); setBudget(''); }}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      useCustom
                        ? `${goldGradient} text-white shadow-md`
                        : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {useCustom && (
                  <input
                    type="number"
                    placeholder="Enter amount in ETB"
                    value={customBudget}
                    onChange={e => setCustomBudget(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#D4C39B] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                  />
                )}
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGetSuggestion}
                disabled={loading}
                className={`w-full rounded-2xl ${goldGradient} px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
              >
                {loading ? 'Getting suggestion...' : 'Get AI Suggestion'}
              </button>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[#6f6257]">
                Based on your relationship as <span className="text-[#2d2218]">{relationship}</span> with a budget of <span className="text-[#2d2218]">{getBudget().toLocaleString()} ETB</span>
              </p>

              {recommendations.length === 0 ? (
                <div className="rounded-2xl border border-[#D4C39B] bg-[#fdf8f0] p-6 text-center">
                  <p className="text-sm text-[#6f6257]">No recommendations right now. Try a different budget or relationship.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className={`rounded-2xl border ${rec.action === 'join_existing' ? 'border-[#B8860B]/30 bg-[#fdf8f0]' : 'border-[#6f9e6f]/30 bg-[#f0faf0]'} p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {rec.action === 'join_existing' ? (
                              <Gift size={16} className="text-[#B8860B] flex-shrink-0" />
                            ) : (
                              <Plus size={16} className="text-[#2d7a3a] flex-shrink-0" />
                            )}
                            <p className="text-sm font-bold text-[#2d2218]">{rec.giftName || 'New Gift Idea'}</p>
                          </div>
                          <p className="mt-1 text-xs text-[#6f6257]">{rec.reason}</p>
                          {rec.recommendedAmount > 0 && (
                            <p className="mt-1 text-sm font-black text-[#8B5A00]">{rec.recommendedAmount.toLocaleString()} ETB</p>
                          )}
                          <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            rec.action === 'join_existing'
                              ? 'bg-[#B8860B]/10 text-[#8B5A00]'
                              : 'bg-[#6f9e6f]/10 text-[#2d7a3a]'
                          }`}>
                            {rec.action === 'join_existing' ? 'Contribute to Existing' : 'New Gift'}
                          </span>
                        </div>
                        <button
                          onClick={() => rec.action === 'join_existing' ? handleJoin(rec) : handleCreateNew()}
                          className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 ${
                            rec.action === 'join_existing' ? goldGradient : 'bg-gradient-to-r from-[#2d7a3a] to-[#1f5c2a]'
                          }`}
                        >
                          {rec.action === 'join_existing' ? 'Join Gift' : 'Create Gift'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={reset}
                className="w-full rounded-2xl border border-[#D4C39B] bg-white/60 px-5 py-3 text-sm font-bold text-[#6f6257] transition-all hover:bg-[#f5e7ca]"
              >
                Try Different Options
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiSuggestion;
