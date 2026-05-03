import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../api/api.js';
import GiftCard from '../components/GiftCard.jsx';
import LiveActivityFeed from '../components/LiveActivityFeed.jsx';
import ContributionModal from '../components/ContributionModal.jsx';

const Registry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { socket, joinWedding } = useSocket();
  const [wedding, setWedding] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState(null);

  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        const response = await api.get(`/gifts/registry/${slug}`);
        setWedding(response.data.wedding);
        setGifts(response.data.gifts);
        joinWedding(response.data.wedding._id);
      } catch (error) {
        console.error('Error fetching registry:', error);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-premium">
            <h1 className="text-3xl font-bold text-primary-dark">{wedding?.weddingName} Registry</h1>
            <p className="mt-3 text-sm text-secondary">Shop the curated gift list, contribute without friction, and see live updates as contributions arrive.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard key={gift._id} gift={gift} onContribute={openContributionModal} />
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <LiveActivityFeed />

          <div className="rounded-[2rem] bg-white p-6 shadow-premium">
            <h2 className="text-xl font-semibold text-primary-dark">Registry notes</h2>
            <p className="mt-3 text-sm text-secondary">Guests can make contributions instantly through lazy auth while your wedding page stays polished.</p>
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
