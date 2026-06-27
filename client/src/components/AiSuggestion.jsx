import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const AiSuggestion = ({ weddingId, onApply }) => {
  const [budget, setBudget] = useState('');
  const [relationship, setRelationship] = useState('');
  const [intent, setIntent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetSuggestion = async () => {
    if (!budget || Number(budget) <= 0) {
      setError('Please enter a valid budget.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/ai/recommendation', {
        weddingId,
        budget: Number(budget),
        relationship,
        intent,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${goldGradient} text-white`}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#2d2218]">AI Gift Suggestion</h3>
          <p className="text-xs text-[#6f6257]">Powered by Gemini</p>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="number"
          placeholder="Your budget (ETB)"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
        />
        <input
          type="text"
          placeholder="Your relationship (e.g. Groom's cousin)"
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
          className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
        />
        <input
          type="text"
          placeholder="Your intent (e.g. Help complete a gift)"
          value={intent}
          onChange={e => setIntent(e.target.value)}
          className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
        />
      </div>

      {error && (
        <div className="mt-3 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <button
        onClick={handleGetSuggestion}
        disabled={loading}
        className={`mt-4 w-full rounded-2xl ${goldGradient} px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
      >
        {loading ? 'Getting suggestion...' : 'Get AI Suggestion'}
      </button>

      {result && (
        <div className="mt-4 rounded-2xl border border-[#D4C39B] bg-white/50 p-4">
          <p className="text-sm font-bold text-[#2d2218]">{result.recommendedGift || 'No specific recommendation'}</p>
          {result.recommendedAmount > 0 && (
            <p className="text-lg font-black text-[#8B5A00] mt-1">{result.recommendedAmount} ETB</p>
          )}
          <p className="text-xs text-[#6f6257] mt-2">{result.reasoning}</p>
          {onApply && result.recommendedGift && (
            <button
              onClick={() => onApply(result)}
              className={`mt-3 rounded-xl ${goldGradient} px-4 py-2 text-xs font-bold text-white`}
            >
              Apply This Suggestion
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AiSuggestion;
