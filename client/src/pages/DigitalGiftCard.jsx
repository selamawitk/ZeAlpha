import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gift, Heart, Users, CheckCircle, Calendar, Share2, Download, PartyPopper, Sparkles } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const DigitalGiftCard = () => {
  const { id } = useParams();
  const [gift, setGift] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: giftData } = await api.get(`/gifts/${id}`);
        const { data: contribs } = await api.get('/contributions', { params: { giftId: id } });
        setGift(giftData);
        setContributions(Array.isArray(contribs) ? contribs : []);
      } catch {
        setGift(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const progress = gift ? Math.min((gift.currentCollected / gift.totalPrice) * 100, 100) : 0;
  const isComplete = progress >= 100;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: gift?.name || 'Digital Gift Card',
          text: `Check out this gift on ZeAlpha!`,
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#B8860B] border-t-transparent"></div>
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-[#dec8ab] bg-gradient-to-br from-[#f5ecde]/95 via-[#ead9c0]/92 to-[#d8b78f]/90 p-8 text-center shadow-[0_16px_40px_rgba(90,60,20,0.12)] backdrop-blur-xl">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-2xl font-black text-[#2d2218]">Gift Not Found</h1>
          <p className="mt-3 text-sm text-[#6f6257]">This digital gift card could not be found.</p>
          <Link to="/" className={`mt-6 inline-flex rounded-2xl ${goldGradient} px-6 py-3 text-sm font-bold text-white shadow-lg`}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Main Card */}
          <div className="rounded-[32px] border border-[#e7d6c1] bg-gradient-to-br from-[#fffdf9]/95 via-[#f8efe2]/92 to-[#ecdcc7]/90 p-8 shadow-[0_12px_40px_rgba(120,90,40,0.12)] backdrop-blur-xl">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-6">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold ${
                isComplete
                  ? 'bg-green-100 text-green-700'
                  : gift.status === 'open'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isComplete ? <PartyPopper className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isComplete ? 'Fully Funded' : gift.status === 'open' ? 'Accepting Contributions' : gift.status}
              </span>
              <button onClick={handleShare} className="rounded-xl border border-[#dcc6a7] bg-white/60 p-2 text-[#6f6257] transition-all hover:bg-white hover:shadow-md">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {gift.image && (
              <img src={gift.image} alt={gift.name} className="w-full h-56 object-cover rounded-2xl mb-6" />
            )}

            <h1 className="text-3xl font-black tracking-tight text-[#2d2218]">{gift.name}</h1>

            <div className="mt-2 flex items-center gap-4 text-sm text-[#6f6257]">
              <span className="inline-flex items-center gap-1">
                <Gift className="h-4 w-4" />
                {gift.type === 'individual' ? 'Unique Gift' : 'Shareable Gift'}
              </span>
              {gift.weddingId?.weddingDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(gift.weddingId.weddingDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {gift.description && (
              <p className="mt-4 text-sm leading-relaxed text-[#6f6257]">{gift.description}</p>
            )}

            {/* Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6f6257] uppercase tracking-wider">Progress</span>
                <span className="text-sm font-black text-[#8B5A00]">ETB {gift.currentCollected} / {gift.totalPrice}</span>
              </div>
              <div className="h-3 rounded-full bg-[#ead9c0] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-green-500' : goldGradient}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-[#8c755e]">{Math.round(progress)}% funded</p>
            </div>

            {isComplete && gift.digitalCardUrl && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50/80 p-4 text-center">
                <PartyPopper className="mx-auto h-8 w-8 text-green-600" />
                <p className="mt-2 text-sm font-bold text-green-800">This gift has been fully funded!</p>
                <p className="text-xs text-green-600 mt-1">Digital card available for the couple.</p>
              </div>
            )}
          </div>

          {/* Contributors Sidebar */}
          <div className="space-y-6">
            <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-6 shadow-md backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#8B5A00]" />
                <h2 className="text-lg font-black text-[#2d2218]">Contributors</h2>
                <span className="ml-auto text-xs font-bold text-[#6f6257]">{contributions.length}</span>
              </div>

              {contributions.length === 0 ? (
                <p className="text-sm text-[#6f6257] text-center py-6">No contributions yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {contributions.map((c, i) => (
                    <div key={c._id || i} className="flex items-center gap-3 rounded-xl border border-[#ead9c0] bg-white/50 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/15 text-xs font-bold text-[#8B5A00]">
                        {c.isAnonymous ? '👤' : (c.guestId?.name || c.guestName || 'G')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2d2218] truncate">
                          {c.isAnonymous ? 'Anonymous' : c.guestId?.name || c.guestName || 'Guest'}
                        </p>
                        {c.message && <p className="text-xs text-[#6f6257] truncate mt-0.5">{c.message}</p>}
                      </div>
                      <span className="text-sm font-black text-[#8B5A00] shrink-0">ETB {c.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-6 shadow-md backdrop-blur-xl">
              <Link
                to="/my-gifts"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl ${goldGradient} px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110`}
              >
                <Heart className="h-4 w-4" />
                View All My Gifts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalGiftCard;
