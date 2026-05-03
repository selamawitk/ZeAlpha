import { motion } from 'framer-motion';
import { Lock, Gift } from 'lucide-react';

const GiftCard = ({ gift, onContribute = () => {} }) => {
  const progress = gift.totalPrice > 0 ? (gift.currentCollected / gift.totalPrice) * 100 : 0;
  const isSurging = progress > 90 || gift.isSurging || gift.isAlmostComplete;
  const isLocked = gift.isLocked && gift.lockedUntil && new Date(gift.lockedUntil) > new Date();
  const isComplete = gift.status === 'fullyFunded';

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-premium p-6 border-2 ${
        isSurging ? 'border-primary animate-surge-pulse' : 'border-gray-200'
      } ${isLocked ? 'opacity-80' : ''}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-primary-dark mb-2">
            {gift.name}
          </h3>
          <p className="text-secondary text-sm mb-3">{gift.description}</p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {gift.type === 'individual' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <Gift size={12} />
                Unique
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <Lock size={12} />
                Reserved
              </span>
            )}
            {isSurging && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-primary rounded-full text-xs font-medium animate-pulse">
                🔥 Surging!
              </span>
            )}
          </div>
        </div>
        {gift.imageUrl && (
          <img
            src={gift.imageUrl}
            alt={gift.name}
            className="w-20 h-20 object-cover rounded-lg ml-4"
          />
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-secondary">Progress</span>
          <span className="font-medium text-primary-dark">
            {gift.currentCollected} ETB / {gift.totalPrice} ETB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-3 rounded-full ${
              isSurging ? 'bg-gradient-to-r from-primary to-accent' : 'bg-primary'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="text-right text-sm font-medium text-primary-dark mt-1">
          {Math.round(progress)}% funded
        </div>
      </div>

      <button
        onClick={() => onContribute(gift)}
        disabled={isLocked || isComplete}
        className={`w-full ${isLocked || isComplete ? 'py-3 rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary hover:shadow-lg'}`}
      >
        {isComplete ? 'Fully Funded' : isLocked ? 'Reserved' : 'Contribute'}
      </button>
    </motion.div>
  );
};

export default GiftCard;
