import { useMemo, useState } from 'react';

const sampleSuggestions = {
  unique: [
    'Handcrafted Ethiopian coffee table set',
    'Personalized honeymoon journal',
    'Luxury kitchen espresso machine',
  ],
  shareable: [
    'Couples weekend photography experience',
    'Community wedding brunch fund',
    'Group dinner gift card package',
  ],
};

const GiftManager = () => {
  const [mode, setMode] = useState('unique');
  const [suggestions, setSuggestions] = useState(sampleSuggestions.unique);

  const currentType = useMemo(() => (mode === 'unique' ? 'Unique Gifts' : 'Shareable Gifts'), [mode]);

  const handleAISuggest = () => {
    const nextSuggestions = sampleSuggestions[mode] || [];
    setSuggestions([...nextSuggestions].sort(() => 0.5 - Math.random()));
  };

  return (
    <div className="rounded-[2rem] bg-white p-8 shadow-premium">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary-dark">Gift Manager</h2>
          <p className="mt-2 text-sm text-secondary">Toggle your registry style and get AI-based inspiration.</p>
        </div>
        <button
          onClick={handleAISuggest}
          className="btn-primary"
        >
          AI Suggest
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {['unique', 'shareable'].map((option) => (
          <button
            key={option}
            onClick={() => {
              setMode(option);
              setSuggestions(sampleSuggestions[option]);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === option ? 'bg-primary text-white' : 'border border-primary/20 text-primary hover:bg-primary/10'}`}
          >
            {option === 'unique' ? 'Unique' : 'Shareable'}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion} className="rounded-3xl border border-gray-200 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary">{currentType}</p>
            <h3 className="mt-3 text-lg font-semibold text-primary-dark">{suggestion}</h3>
            <p className="mt-3 text-sm text-secondary">Designed for fast sharing, flexible contributions, and memorable gift discovery.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GiftManager;
