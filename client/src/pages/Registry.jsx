import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../api/api.js';
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

  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        const response = await api.get(`/gifts/registry/${slug}`);

        if (response?.data?.success) {
          setWedding(response.data.registry);
          setGifts(response.data.registry.gifts || []);
          joinWedding(response.data.registry._id);
          setError('');
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
    if (!socket) return;

    const handleGiftUpdate = (updatedGift) => {
      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift._id === updatedGift._id ? { ...gift, ...updatedGift } : gift
        )
      );
    };

    socket.on('gift:update', handleGiftUpdate);
    socket.on('gift_updated', handleGiftUpdate);
    socket.on('GIFT_UPDATED', handleGiftUpdate);

    return () => {
      socket.off('gift:update', handleGiftUpdate);
      socket.off('gift_updated', handleGiftUpdate);
      socket.off('GIFT_UPDATED', handleGiftUpdate);
    };
  }, [socket]);

  const openContributionModal = (gift) => {
    setSelectedGift(gift);
  };

  const closeModal = () => {
    setSelectedGift(null);
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
          <LiveActivityFeed />

          <div className="rounded-[2rem] bg-white p-6 shadow-premium">
            <h2 className="text-xl font-semibold text-primary-dark">
              Registry notes
            </h2>
            <p className="mt-3 text-sm text-secondary">
              Guests can make contributions instantly through lazy auth while your wedding page stays polished.
            </p>
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