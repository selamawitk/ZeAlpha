import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';

const MyGifts = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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
        const seen = new Set();
        const deduped = existing.filter(c => {
          const key = c.giftId?._id || c.giftId || c._id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setHistory(deduped);
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

      <div className="relative z-10 mx-auto max-w-4xl px-0 sm:px-2">

          {/* Main Card */}
          <div className="rounded-[24px] sm:rounded-[32px] border border-[#e7d6c1] bg-gradient-to-br from-[#fffdf9]/95 via-[#f8efe2]/92 to-[#ecdcc7]/90 p-5 sm:p-8 shadow-[0_12px_40px_rgba(120,90,40,0.10)] backdrop-blur-xl">
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#2d2218]">
              My Gifts
            </h1>

            <p className="mt-2 sm:mt-3 text-sm leading-6 sm:leading-7 text-[#6f6257]">
              Your contribution history and gift activity.
            </p>

            {history.length === 0 ? (
              <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center rounded-[24px] sm:rounded-[28px] border border-[#eadcc9] bg-white/60 px-4 sm:px-6 py-10 sm:py-14 text-center shadow-sm backdrop-blur-sm">
                
                <div className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full ${goldGradient} shadow-lg shadow-[#8B5A00]/20`}>
                  <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>

                <p className="mt-4 sm:mt-6 text-lg sm:text-xl font-black text-[#2d2218]">
                  No contributions yet
                </p>

                <p className="mt-3 max-w-md text-sm leading-6 sm:leading-7 text-[#6f6257]">
                  Browse a registry and support a couple with
                  seamless contribution experiences.
                </p>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[24px] sm:rounded-[28px] border border-[#e3d0b7] bg-white/55 p-4 sm:p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3 sm:gap-4">

                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-black text-[#2d2218] truncate">
                          {item.giftName || item.giftId?.name || 'Gift'}
                        </p>

                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[#6f6257] truncate">
                          {item.guestName || item.guestId?.name || 'Guest'} •{' '}
                          {item.paymentMethod || 'N/A'}
                        </p>
                      </div>

                      <p className="text-base sm:text-lg font-black text-[#8B5A00] shrink-0">
                        ETB {item.amount}
                      </p>
                    </div>

                    <p className="mt-3 sm:mt-4 text-sm leading-6 sm:leading-7 text-[#6f6257]">
                      {item.message ||
                        'Thanks for your support!'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default MyGifts;