import { useState } from 'react';
import { Search, Hash, MapPin, Calendar, Users, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const FindWedding = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [codeResult, setCodeResult] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/weddings?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCodeLookup = async () => {
    if (!codeInput.trim()) return;
    setCodeError('');
    setCodeResult(null);
    setCodeLoading(true);
    try {
      const { data } = await api.get(`/weddings/slug/${encodeURIComponent(codeInput.trim().toLowerCase())}`);
      setCodeResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setCodeError('No wedding found with that code.');
      } else {
        setCodeError('Failed to look up code. Please try again.');
      }
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-[#2d2218]">Find a Wedding</h1>
          <div className={`mx-auto mt-4 h-1 w-20 rounded-full ${goldGradient}`}></div>
          <p className="mt-4 text-base text-[#6f6257] max-w-lg mx-auto">
            Search for a wedding by name or use the code from your invitation to find the perfect gift.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-7 shadow-md backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                <Search className="h-5 w-5 text-[#8B5A00]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#2d2218]">Search by Name</h2>
                <p className="text-xs text-[#6f6257]">Find by couple name, wedding title, or venue</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Sarah & John, Grand Palace..."
                className="flex-1 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className={`rounded-2xl ${goldGradient} px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 disabled:opacity-50`}
              >
                {searching ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Searching
                  </span>
                ) : 'Search'}
              </button>
            </div>

            <div className="mt-5 space-y-3 max-h-72 overflow-y-auto">
              {searched && !searching && searchResults.length === 0 && (
                <p className="text-sm text-[#6f6257] text-center py-8">No weddings found matching your search.</p>
              )}
              {searchResults.map((w) => (
                <Link
                  key={w._id}
                  to={`/w/${w.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[#ead9c0] bg-white/60 p-4 transition-all hover:bg-[#f5e7ca] hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#B8860B]/15 text-xl">
                    💒
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2d2218] truncate group-hover:text-[#8B5A00]">{w.weddingName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[#6f6257]">
                      {w.coupleName && <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{w.coupleName}</span>}
                      {w.weddingDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(w.weddingDate).toLocaleDateString()}</span>}
                      {w.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.venue}</span>}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#8B5A00] opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-7 shadow-md backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                <Hash className="h-5 w-5 text-[#8B5A00]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#2d2218]">Wedding Code</h2>
                <p className="text-xs text-[#6f6257]">Enter the unique code from your invitation</p>
              </div>
            </div>
            <p className="text-xs text-[#6f6257] mb-3">
              Each invitation includes a unique wedding code (e.g., ABC123). Enter it below for instant access.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeLookup()}
                placeholder="Enter wedding code"
                className="flex-1 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none uppercase tracking-wider transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              />
              <button
                onClick={handleCodeLookup}
                disabled={codeLoading}
                className={`rounded-2xl ${goldGradient} px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 disabled:opacity-50`}
              >
                {codeLoading ? (
                  <span className="h-4 w-4 block animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : 'Go'}
              </button>
            </div>

            {codeResult && (
              <Link
                to={`/w/${codeResult.slug}`}
                className="mt-5 group flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50/80 p-4 transition-all hover:bg-green-100 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                  🎉
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-green-800 group-hover:text-green-900">{codeResult.weddingName}</p>
                  <p className="text-xs text-green-600 mt-1">Click to view registry and contribute</p>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            )}
            {codeError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/80 p-4">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <span>⚠️</span> {codeError}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-8 shadow-md backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B8860B]/10">
              <Users className="h-6 w-6 text-[#8B5A00]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2d2218]">How It Works</h2>
              <div className={`mt-2 h-0.5 w-12 rounded-full ${goldGradient}`}></div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: '01', title: 'Find', desc: 'Search by couple name or enter the wedding code from your invitation.', icon: '🔍' },
              { step: '02', title: 'Browse', desc: 'Explore their curated gift registry and choose the perfect contribution.', icon: '🎁' },
              { step: '03', title: 'Celebrate', desc: 'Contribute seamlessly and leave a blessing for the happy couple.', icon: '✨' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-[#ead9c0] bg-white/50 p-5 text-center transition-all hover:shadow-md">
                <span className="text-3xl">{item.icon}</span>
                <p className="mt-3 text-sm font-bold text-[#8B5A00]">{item.step}</p>
                <p className="mt-1 text-base font-black text-[#2d2218]">{item.title}</p>
                <p className="mt-2 text-xs text-[#6f6257]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindWedding;
