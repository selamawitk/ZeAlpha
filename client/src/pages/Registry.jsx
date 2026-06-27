import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import api, { fetchBlessings, addBlessing } from '../api/api.js';
import GiftCard from '../components/GiftCard.jsx';
import LiveActivityFeed from '../components/LiveActivityFeed.jsx';
import ContributionModal from '../components/ContributionModal.jsx';

const Registry = () => {
  const { slug } = useParams();
  const { socket, joinWedding } = useSocket();
  const [wedding, setWedding] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [blessings, setBlessings] = useState([]);
  const [blessingForm, setBlessingForm] = useState({ guestName: '', message: '' });
  const [blessingSubmitted, setBlessingSubmitted] = useState(false);

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
      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift._id === updatedGift._id ? { ...gift, ...updatedGift } : gift
        )
      );
    };

    socket.on('gift:update', handleGiftUpdate);

    return () => {
      socket.off('gift:update', handleGiftUpdate);
    };
  }, [socket]);

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
            <h1 className="text-3xl font-bold text-primary-dark">
              {wedding?.weddingName} Registry
            </h1>
            <p className="mt-3 text-sm text-secondary">
              Shop the curated gift list, contribute without friction, and see live updates as contributions arrive.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard
                key={gift._id}
                gift={gift}
                onContribute={openContributionModal}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-6">
                <LiveActivityFeed weddingId={wedding?._id} />

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

      <ContributionModal
        gift={selectedGift}
        isOpen={Boolean(selectedGift)}
        onClose={closeModal}
      />
    </div>
  );
};

export default Registry;