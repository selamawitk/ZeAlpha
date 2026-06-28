import { useState } from 'react';
import { Sparkles, X, ChevronRight, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

const SUGGESTED_QUESTIONS = [
  'What gifts should we add?',
  'What does a new Ethiopian couple need?',
  'What should be shareable?',
  'Suggest traditional Ethiopian wedding gifts',
  'What kitchen items do we need?',
  'Suggest modern home electronics',
];

const AiPlanner = ({ weddingId, onClose }) => {
  const [question, setQuestion] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingGifts, setAddingGifts] = useState({});

  const getQuestion = () => {
    if (useCustom) return customQuestion;
    return question;
  };

  const handleAsk = async () => {
    const q = getQuestion();
    if (!q.trim()) {
      setError('Please select or enter a question.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/planner', {
        weddingId,
        question: q,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to get AI planning suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGift = async (suggestion) => {
    setAddingGifts(prev => ({ ...prev, [suggestion.name]: true }));
    try {
      await api.post('/gifts', {
        weddingId,
        name: suggestion.name,
        category: suggestion.category || 'Other',
        totalPrice: suggestion.estimatedPrice || 1000,
        type: suggestion.type || 'fractional',
        description: suggestion.reason || '',
      });
      setAddingGifts(prev => ({ ...prev, [suggestion.name]: false }));
      setResult(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.name !== suggestion.name),
        summary: prev.summary + `\n✓ "${suggestion.name}" added to registry.`,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add gift');
      setAddingGifts(prev => ({ ...prev, [suggestion.name]: false }));
    }
  };

  const reset = () => {
    setQuestion('');
    setCustomQuestion('');
    setUseCustom(false);
    setResult(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-[28px] bg-white shadow-2xl border border-[#D4C39B] max-h-[90vh] overflow-y-auto">
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
              <h3 className="text-lg font-black text-[#2d2218]">AI Wedding Planner</h3>
              <p className="text-xs text-[#6f6257]">Powered by Gemini</p>
            </div>
          </div>

          {!result ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-2 block">Ask a question</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuestion(q); setUseCustom(false); }}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold text-left transition-all ${
                        !useCustom && question === q
                          ? `${goldGradient} text-white shadow-md`
                          : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    onClick={() => { setUseCustom(true); setQuestion(''); }}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-left transition-all ${
                      useCustom
                        ? `${goldGradient} text-white shadow-md`
                        : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                    }`}
                  >
                    Custom question...
                  </button>
                </div>
                {useCustom && (
                  <input
                    type="text"
                    placeholder="Type your question..."
                    value={customQuestion}
                    onChange={e => setCustomQuestion(e.target.value)}
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
                onClick={handleAsk}
                disabled={loading}
                className={`w-full rounded-2xl ${goldGradient} px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
              >
                {loading ? 'Asking AI...' : 'Ask AI Planner'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {result.summary && (
                <div className={`rounded-2xl ${glassCard} p-4`}>
                  <p className="text-sm text-[#2d2218] leading-relaxed whitespace-pre-line">{result.summary}</p>
                </div>
              )}

              {result.suggestions && result.suggestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#6f6257] uppercase tracking-wider">Suggested Gifts</p>
                  {result.suggestions.map((s, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#D4C39B] bg-[#fdf8f0] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Plus size={16} className="text-[#B8860B] flex-shrink-0" />
                            <p className="text-sm font-bold text-[#2d2218]">{s.name}</p>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B5A00]">
                              {s.category || 'General'}
                            </span>
                            <span className="rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B5A00]">
                              {s.estimatedPrice?.toLocaleString()} ETB
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              s.type === 'fractional' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {s.type === 'fractional' ? 'Shareable' : 'Unique'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#6f6257]">{s.reason}</p>
                          {s.shareableNote && (
                            <p className="mt-1 text-xs font-semibold text-blue-700 italic">
                              💡 {s.shareableNote}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddGift(s)}
                          disabled={addingGifts[s.name]}
                          className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 ${goldGradient}`}
                        >
                          {addingGifts[s.name] ? 'Adding...' : 'Add Gift'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 rounded-2xl border border-[#D4C39B] bg-white/60 px-5 py-3 text-sm font-bold text-[#6f6257] transition-all hover:bg-[#f5e7ca]"
                >
                  Ask Another Question
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-[#D4C39B] bg-white/60 px-5 py-3 text-sm font-bold text-[#6f6257] transition-all hover:bg-[#f5e7ca]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPlanner;
