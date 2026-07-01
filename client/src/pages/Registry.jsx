import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, BadgeCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { fetchBlessings, addBlessing } from '../api/api.js';
import GiftCard from '../components/GiftCard.jsx';
import LiveActivityFeed from '../components/LiveActivityFeed.jsx';
import ContributionModal from '../components/ContributionModal.jsx';
import AiSuggestion from '../components/AiSuggestion.jsx';
import GuestGiftForm from '../components/GuestGiftForm.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import CelebrationModal from '../components/CelebrationModal.jsx';

const Registry = () => {
  const { slug } = useParams();
  const { socket, joinWedding } = useSocket();
  const { user } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [showGuestGiftForm, setShowGuestGiftForm] = useState(false);
  const [blessings, setBlessings] = useState([]);
  const [celebratedGift, setCelebratedGift] = useState(null);
  const [blessingForm, setBlessingForm] = useState({ guestName: '', message: '' });
  const [blessingSubmitted, setBlessingSubmitted] = useState(false);
  const [contributedGiftIds, setContributedGiftIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('contributedGiftIds') || '[]'));
    } catch { return new Set(); }
  });

  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/gifts/registry/${slug}`);

        if (response?.data?.success) {
          setWedding(response.data.registry);
          setGifts(response.data.registry.gifts || []);
          joinWedding(response.data.registry._id);
          setError('');
            try {
              const blessingsData = await fetchBlessings(response.data.registry._id);
              setBlessings(blessingsData || []);
            } catch {
              // blessing fetch is non-critical
            }
        } else {
          setError('Registry not found or is unavailable.');
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load registry';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistry();
  }, [slug, joinWedding]);

  useEffect(() => {
    if (!socket || !wedding?._id) return;
    const handleActivity = (activity) => {
      if (activity.type === 'blessing' && activity.weddingId === wedding._id) {
        setBlessings((prev) => [{
          _id: Date.now(),
          guestName: activity.title?.replace(' left a blessing', '') || 'Guest',
          message: activity.message,
          createdAt: new Date().toISOString()
        }, ...prev]);
      }
    };
    socket.on('activity:update', handleActivity);
    return () => socket.off('activity:update', handleActivity);
  }, [socket, wedding?._id]);

  useEffect(() => {
    if (!socket) return;

    const handleGiftUpdate = (updatedGift) => {
      setGifts((currentGifts) => {
        const existing = currentGifts.find(g => g._id === updatedGift._id);
        if (existing && existing.status !== 'fullyFunded' && updatedGift.status === 'fullyFunded') {
          setCelebratedGift(updatedGift);
        }
        return currentGifts.map((gift) =>
          gift._id === updatedGift._id ? { ...gift, ...updatedGift } : gift
        );
      });
    };

    socket.on('gift:update', handleGiftUpdate);

    return () => {
      socket.off('gift:update', handleGiftUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('contributedGiftIds');
      if (stored) {
        try { setContributedGiftIds(new Set(JSON.parse(stored))); } catch {}
      }
      return;
    }
    api.get('/contributions', { params: { limit: 100 } })
      .then(({ data }) => {
        const ids = new Set((data || []).map(c => c.giftId?._id || c.giftId).filter(Boolean));
        setContributedGiftIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const openContributionModal = (gift) => {
    setSelectedGift(gift);
  };

  const closeModal = () => {
    setSelectedGift(null);
  };

  const handleBlessingSubmit = async (e) => {
    e.preventDefault();
    if (!blessingForm.message.trim()) return;
    try {
      await addBlessing(wedding._id, blessingForm.message, blessingForm.guestName || undefined);
      setBlessingSubmitted(true);
      setBlessingForm({ guestName: '', message: '' });
      setTimeout(() => setBlessingSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to post blessing', err);
    }
  };

  const handleAiJoinGift = useCallback((rec) => {
    if (rec.giftId) {
      const gift = gifts.find(g => g._id === rec.giftId);
      if (gift) {
        setSelectedGift(gift);
      }
    }
    setShowAiSuggestion(false);
  }, [gifts]);

  const handleAiCreateGift = useCallback(() => {
    setShowAiSuggestion(false);
    setShowGuestGiftForm(true);
  }, []);

  const handleGuestGiftCreated = useCallback(() => {
    setShowGuestGiftForm(false);
  }, []);

  if (loading) {
    return <div className="text-center py-16">Loading registry...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-xl rounded-[2rem] bg-white p-10 shadow-premium text-center">
          <h1 className="text-3xl font-semibold text-primary-dark mb-4">
            Something went wrong
          </h1>
          <p className="text-secondary mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-dark"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-xl rounded-[2rem] bg-white p-10 shadow-premium text-center">
          <h1 className="text-3xl font-semibold text-primary-dark mb-4">
            Registry not found
          </h1>
          <p className="text-secondary mb-6">
            The registry you are trying to view is unavailable or does not exist.
          </p>
          <Link
            to="/"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-dark"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-premium">
            <h1 className="text-3xl font-bold text-primary-dark flex items-center gap-2">
              {wedding?.weddingName} Registry
              {wedding?.isVerifiedWedding && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </h1>
            {wedding?.weddingCode && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-dark">
                <span>Wedding Code:</span>
                <span className="tracking-widest font-black">{wedding.weddingCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(wedding.weddingCode)}
                  className="ml-1 text-xs underline hover:text-primary"
                >
                  Copy
                </button>
              </div>
            )}
            <p className="mt-3 text-sm text-secondary">
              Shop the curated gift list, contribute without friction, and see live updates as contributions arrive.
            </p>
          </div>

          {gifts.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 shadow-premium text-center">
              <p className="text-secondary text-sm">No gifts in this registry yet. Check back later!</p>
            </div>
          ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard
                key={gift._id}
                gift={gift}
                onContribute={openContributionModal}
                contributedByMe={contributedGiftIds.has(gift._id)}
              />
            ))}
          </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="space-y-3">
            <button
              onClick={() => setShowAiSuggestion(true)}
              className="w-full rounded-2xl bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              AI Gift Suggestion
            </button>
            <button
              onClick={() => setShowGuestGiftForm(true)}
              className="w-full rounded-2xl border-2 border-dashed border-[#B8860B]/40 bg-white/60 px-5 py-3.5 text-sm font-bold text-[#8B5A00] transition-all duration-300 hover:bg-[#f5e7ca] hover:border-[#B8860B] flex items-center justify-center gap-2"
            >
              + Create Custom Gift
            </button>
          </div>
          <Leaderboard weddingId={wedding?._id} />

          <div className="rounded-[2rem] bg-white p-6 shadow-premium">
            <h2 className="text-xl font-semibold text-primary-dark">Registry notes</h2>
            <p className="mt-3 text-sm text-secondary">
              Guests can make contributions instantly through lazy auth while your wedding page stays polished.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-premium">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Blessings Wall</h2>
            <form onSubmit={handleBlessingSubmit} className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={blessingForm.guestName}
                onChange={(e) => setBlessingForm(p => ({ ...p, guestName: e.target.value }))}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                placeholder="Leave your congratulations and blessings..."
                value={blessingForm.message}
                onChange={(e) => setBlessingForm(p => ({ ...p, message: e.target.value }))}
                rows={3}
                maxLength={500}
                required
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button type="submit" className="btn-primary w-full text-sm">Send Blessing</button>
              {blessingSubmitted && (
                <p className="text-sm text-green-600 font-medium">Blessing sent!</p>
              )}
            </form>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {blessings.length === 0 ? (
                  <p className="text-sm text-secondary">No blessings yet. Be the first to leave one!</p>
                ) : (
                  blessings.slice(0, 20).map((b) => (
                    <div key={b._id} className="rounded-2xl bg-primary/5 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-primary-dark">{b.isAnonymous ? 'Anonymous' : b.guestName || 'Anonymous'}</p>
                      </div>
                      <p className="mt-1 text-sm text-secondary">{b.message}</p>
                      {/* Reactions */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {b.reactions && Object.entries(b.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={async () => {
                              try {
                                const reactionName = blessingForm.guestName || 'Guest';
                                await api.post(`/blessings/${b._id}/reactions`, { emoji, guestName: reactionName });
                                const data = await fetchBlessings(wedding._id);
                                setBlessings(data);
                              } catch (err) {
                                console.error('Reaction failed:', err);
                              }
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition ${
                              users.includes(blessingForm.guestName || 'Guest') ? 'bg-primary/20' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-500">{users.length}</span>
                          </button>
                        ))}
                        <button
                          onClick={async () => {
                            const emojis = ['❤️', '🎉', '🙏', '🎊'];
                            const next = emojis.find(e => !b.reactions?.[e]);
                            if (next) {
                              try {
                                const reactionName = blessingForm.guestName || 'Guest';
                                await api.post(`/blessings/${b._id}/reactions`, { emoji: next, guestName: reactionName });
                                const data = await fetchBlessings(wedding._id);
                                setBlessings(data);
                              } catch (err) {
                                console.error('Reaction failed:', err);
                              }
                            }
                          }}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>
        </aside>
      </div>

      {showAiSuggestion && (
        <AiSuggestion
          weddingId={wedding?._id}
          weddingName={wedding?.weddingName}
          coupleName={wedding?.coupleName}
          onJoinGift={handleAiJoinGift}
          onCreateGift={handleAiCreateGift}
          onClose={() => setShowAiSuggestion(false)}
        />
      )}

      {showGuestGiftForm && (
        <GuestGiftForm
          weddingId={wedding?._id}
          onCreated={handleGuestGiftCreated}
          onClose={() => setShowGuestGiftForm(false)}
        />
      )}

      <ContributionModal
        gift={selectedGift}
        isOpen={Boolean(selectedGift)}
        onClose={closeModal}
      />

      <CelebrationModal
        gift={celebratedGift}
        isOpen={Boolean(celebratedGift)}
        onClose={() => setCelebratedGift(null)}
      />
    </div>
  );
};

export default Registry;