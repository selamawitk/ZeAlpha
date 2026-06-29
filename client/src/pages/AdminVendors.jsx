import { motion } from 'framer-motion';
import { Store, Clock } from 'lucide-react';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';

const AdminVendors = () => {
  return (
    <div className={`relative min-h-screen ${pageBackground} px-4 pb-8 md:px-6 w-full max-w-full overflow-x-hidden`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${cardElevated} p-12 md:p-16 text-center max-w-lg`}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] ${goldGradient} shadow-lg shadow-[#8B5A00]/20`}
          >
            <Store size={36} className="text-white" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-black text-[#2d2218] mb-3">
            Vendor Marketplace
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock size={16} className="text-[#8B5A00]" />
            <span className="rounded-full bg-[#8B5A00]/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#8B5A00] border border-[#8B5A00]/20">
              Coming Soon
            </span>
          </div>

          <p className="text-[#6f6257] text-sm leading-relaxed max-w-sm mx-auto">
            We're building a curated vendor network so you can manage fulfillment partners, products, and catalogs — all in one place.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminVendors;
