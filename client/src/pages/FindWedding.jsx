import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const FindWedding = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allWeddings, setAllWeddings] = useState([]);
  const [filteredWeddings, setFilteredWeddings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await api.get('/weddings');
        setAllWeddings(Array.isArray(data) ? data : []);
      } catch {
        setAllWeddings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredWeddings(allWeddings);
      return;
    }
    const filtered = allWeddings.filter(
      (w) =>
        w.weddingName?.toLowerCase().includes(q) ||
        w.coupleName?.toLowerCase().includes(q) ||
        w.slug?.toLowerCase().includes(q) ||
        w.venue?.toLowerCase().includes(q)
    );
    setFilteredWeddings(filtered);
  }, [searchQuery, allWeddings]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-[#2d2218]">Find a Wedding</h1>
          <div className={`mx-auto mt-4 h-1 w-20 rounded-full ${goldGradient}`}></div>
          <p className="mt-4 text-base text-[#6f6257] max-w-lg mx-auto">
            Search by couple name, wedding title, venue, or enter a wedding code.
          </p>
        </div>

        <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-7 shadow-md backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
              <Search className="h-5 w-5 text-[#8B5A00]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2d2218]">Search Weddings</h2>
              <p className="text-xs text-[#6f6257]">Search by name, venue, or wedding code</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Sarah & John, ABC123, Grand Palace..."
              className="flex-1 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
            />
          </div>

          <div className="mt-5 space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-[#6f6257] text-center py-8">Loading weddings...</p>
            ) : filteredWeddings.length === 0 ? (
              <p className="text-sm text-[#6f6257] text-center py-8">No weddings found matching your search.</p>
            ) : (
              filteredWeddings.map((w) => (
                <Link
                  key={w._id}
                  to={`/w/${w.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[#ead9c0] bg-white/60 p-4 transition-all hover:bg-[#f5e7ca] hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#B8860B]/15">
                    <Heart className="h-5 w-5 text-[#8B5A00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2d2218] truncate group-hover:text-[#8B5A00]">{w.weddingName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[#6f6257]">
                      {w.coupleName && <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{w.coupleName}</span>}
                      {w.weddingDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(w.weddingDate).toLocaleDateString()}</span>}
                      {w.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.venue}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />Code: {w.slug}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#8B5A00] opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindWedding;
