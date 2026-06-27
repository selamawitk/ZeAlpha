import { useEffect, useState } from 'react';
import { Heart, Search, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';

const MyGifts = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Wedding search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeResult, setCodeResult] = useState(null);
  const [codeError, setCodeError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
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
    try {
      const { data } = await api.get(`/weddings/slug/${encodeURIComponent(codeInput.trim().toLowerCase())}`);
      setCodeResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setCodeError('No wedding found with that code. Check with the couple for the correct code.');
      } else {
        setCodeError('Failed to look up code. Please try again.');
      }
    }
  };

  useEffect(() => {
    const loadContributions = async () => {
      if (user) {
        setLoading(true);
        try {
          const data = await api.get('/contributions');
          const userContributions = Array.isArray(data.data)
            ? data.data.filter(c => String(c.guestId?._id || c.guestId) === String(user._id))
            : [];
          setHistory(userContributions.length > 0 ? userContributions : JSON.parse(localStorage.getItem('guestContributions') || '[]'));
        } catch {
          const existing = JSON.parse(localStorage.getItem('guestContributions') || '[]');
          setHistory(existing);
        } finally {
          setLoading(false);
        }
      } else {
        const existing = JSON.parse(localStorage.getItem('guestContributions') || '[]');
        setHistory(existing);
      }
    };

    loadContributions();
  }, [user]);

  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4 py-12">
      
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>

        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Search Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Search by Name */}
          <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-6 shadow-md backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-5 w-5 text-[#8B5A00]" />
              <h2 className="text-lg font-black text-[#2d2218]">Find a Wedding</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, wedding title..."
                className="flex-1 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className={`rounded-2xl ${goldGradient} px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50`}
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((w) => (
                  <Link
                    key={w._id}
                    to={`/w/${w.slug}`}
                    className="block rounded-xl border border-[#ead9c0] bg-white/60 p-3 text-sm transition hover:bg-[#f5e7ca]"
                  >
                    <p className="font-bold text-[#2d2218]">{w.weddingName}</p>
                    <p className="text-[#6f6257] text-xs mt-0.5">
                      {w.couple?.name || 'Couple'} • Code: {w.slug}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="mt-3 text-sm text-[#6f6257]">No weddings found matching your search.</p>
            )}
          </div>

          {/* Lookup by Code */}
          <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-6 shadow-md backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <Hash className="h-5 w-5 text-[#8B5A00]" />
              <h2 className="text-lg font-black text-[#2d2218]">Wedding Code</h2>
            </div>
            <p className="text-xs text-[#6f6257] mb-3">Enter the code from the invitation (e.g., ABC123)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeLookup()}
                placeholder="Enter wedding code"
                className="flex-1 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none uppercase focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              />
              <button
                onClick={handleCodeLookup}
                className={`rounded-2xl ${goldGradient} px-5 py-3 text-sm font-bold text-white shadow-md`}
              >
                Go
              </button>
            </div>
            {codeResult && (
              <Link
                to={`/w/${codeResult.slug}`}
                className="mt-4 block rounded-xl border border-green-200 bg-green-50 p-3 text-sm"
              >
                <p className="font-bold text-green-800">{codeResult.weddingName}</p>
                <p className="text-green-700 text-xs mt-0.5">Click to view registry</p>
              </Link>
            )}
            {codeError && <p className="mt-3 text-sm text-red-600">{codeError}</p>}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">

          {/* Main Card */}
          <div className="rounded-[32px] border border-[#e7d6c1] bg-gradient-to-br from-[#fffdf9]/95 via-[#f8efe2]/92 to-[#ecdcc7]/90 p-8 shadow-[0_12px_40px_rgba(120,90,40,0.10)] backdrop-blur-xl">
            
            <h1 className="text-3xl font-black tracking-tight text-[#2d2218]">
              My Gifts
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#6f6257]">
              Your contribution history and gift activity.
            </p>

            {history.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-[28px] border border-[#eadcc9] bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
                
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${goldGradient} shadow-lg shadow-[#8B5A00]/20`}>
                  <Heart className="h-8 w-8 text-white" />
                </div>

                <p className="mt-6 text-xl font-black text-[#2d2218]">
                  No contributions yet
                </p>

                <p className="mt-3 max-w-md text-sm leading-7 text-[#6f6257]">
                  Browse a registry and support a couple with
                  seamless contribution experiences.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[28px] border border-[#e3d0b7] bg-white/55 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <p className="text-lg font-black text-[#2d2218]">
                          {item.giftName || item.giftId?.name || 'Gift'}
                        </p>

                        <p className="mt-1 text-sm text-[#6f6257]">
                          {item.guestName || item.guestId?.name || 'Guest'} •{' '}
                          {item.paymentMethod || 'N/A'}
                        </p>
                      </div>

                      <p className="text-lg font-black text-[#8B5A00]">
                        ETB {item.amount}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[#6f6257]">
                      {item.message ||
                        'Thanks for your support!'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="rounded-[32px] border border-[#e2cfb5] bg-gradient-to-br from-[#f7ecdc]/95 via-[#ead7bc]/92 to-[#dcb98e]/90 p-8 shadow-[0_12px_40px_rgba(120,90,40,0.10)] backdrop-blur-xl">
            
            <h2 className="text-2xl font-black text-[#2d2218]">
              Guest Access
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#6f6257]">
              Capture guest details gently and allow contributions
              to flow without forcing complicated signup steps.
            </p>

            <Link
              to="/auth"
              className={`mt-8 inline-flex rounded-2xl ${goldGradient} px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110`}
            >
              Manage Contributions
            </Link>

            {/* Decorative Box */}
            <div className="mt-8 rounded-[24px] border border-[#e4d1b7] bg-white/40 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8B5A00]">
                Contribution Experience
              </p>

              <p className="mt-3 text-sm leading-7 text-[#6f6257]">
                Elegant, simple, and modern gifting designed for
                couples and guests alike.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MyGifts;