import { motion } from 'framer-motion';
import { Package, Clock } from 'lucide-react';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
const textMuted = 'text-[#6f6257]';

const DashboardFulfillment = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`min-h-full ${pageBackground} text-[#2d2218] overflow-x-hidden max-w-full`}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[32%] h-[32%] bg-primary-gold/20 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[32%] h-[32%] bg-[#8a5a2b]/20 blur-[130px] rounded-full"></div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 lg:px-6 pt-8 pb-12 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${glassCard} p-12 md:p-16 text-center w-full`}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] ${goldGradient} shadow-lg shadow-[#8B5A00]/20`}
          >
            <Package size={36} className="text-white" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-black leading-tight mb-3">
            Order{' '}
            <span className={`italic ${goldGradient} bg-clip-text text-transparent font-black`}>
              Fulfillment
            </span>
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock size={16} className="text-[#8B5A00]" />
            <span className="rounded-full bg-[#8B5A00]/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#8B5A00] border border-[#8B5A00]/20">
              Coming Soon
            </span>
          </div>

          <p className={`text-sm ${textMuted} leading-relaxed max-w-sm mx-auto`}>
            Vendor-based fulfillment is on its way. Once live, your fully funded gifts will automatically flow into vendor orders with real-time tracking and delivery updates.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardFulfillment;
