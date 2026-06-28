import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, PartyPopper, Sparkles, Heart, X } from 'lucide-react';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const CelebrationModal = ({ gift, isOpen, onClose }) => {
  const confettiLaunched = useRef(false);

  useEffect(() => {
    if (isOpen && !confettiLaunched.current && gift) {
      confettiLaunched.current = true;

      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
          colors: ['#B8860B', '#D4AF37', '#FFD700', '#8B5A00', '#FF6B6B'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
          colors: ['#B8860B', '#D4AF37', '#FFD700', '#8B5A00', '#FF6B6B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#B8860B', '#D4AF37', '#C49B52', '#FFD700', '#8B5A00', '#FF6B6B', '#00C853'],
        });
      }, 500);

      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.4, x: 0.3 },
          colors: ['#FF6B6B', '#FFD700', '#00C853', '#448AFF'],
        });
      }, 1000);
    }

    if (!isOpen) {
      confettiLaunched.current = false;
    }
  }, [isOpen, gift]);

  if (!isOpen || !gift) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-full max-w-md rounded-[32px] border border-[#D4AF37] bg-gradient-to-br from-[#fffdf9]/95 via-[#f8efe2]/92 to-[#ecdcc7]/90 p-8 shadow-[0_20px_60px_rgba(120,90,40,0.15)] backdrop-blur-xl text-center relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-[#B8860B]/10" />

          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/60 transition text-[#6f6257] hover:text-[#2d2218] z-10">
            <X className="h-5 w-5" />
          </button>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-50 border-2 border-green-300 shadow-lg"
          >
            <PartyPopper className="h-12 w-12 text-green-600" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <h2 className="text-3xl font-black text-[#2d2218]">Fully Funded! 🎉</h2>
            <div className={`mx-auto mt-3 h-1 w-16 rounded-full ${goldGradient}`} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 space-y-3"
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="h-5 w-5 text-[#B8860B]" />
              <p className="text-xl font-bold text-[#2d2218]">{gift.name}</p>
            </div>
            <div className="rounded-2xl bg-white/60 border border-[#CFA97A] p-4">
              <p className="text-3xl font-black text-[#8B5A00]">
                {gift.currentCollected?.toLocaleString()} ETB
              </p>
              <p className="text-sm text-[#6f6257] mt-1">
                raised of {gift.totalPrice?.toLocaleString()} ETB goal
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-[#8c755e]">
              <Heart className="h-4 w-4 text-red-400 fill-red-400" />
              Thanks to all contributors!
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={onClose}
            className={`mt-6 rounded-2xl ${goldGradient} px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110`}
          >
            Celebrate! 🎊
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CelebrationModal;