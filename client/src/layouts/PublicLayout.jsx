import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f8f3eb] via-[#fcfaf7] to-[#ede1cf] text-[#2d2218] selection:bg-[#d4af37]/20 selection:text-[#5c3b00]">
      
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>

        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#eadcc9] bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          
          {/* Logo */}
          <Link
            to="/"
            className="group relative flex items-center gap-2 text-2xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] bg-clip-text text-transparent">
              ZeAlpha
            </span>

            <div className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#B8860B] transition-all duration-300 group-hover:w-full"></div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-3 md:flex">
            {[
              { to: '/', label: 'Home' },
              { to: '/auth', label: 'Login' },
              { to: '/guest?tab=gifts', label: 'My Gifts' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-6 py-2.5 text-sm font-black transition-all duration-300 ${
                    isActive
                      ? `${goldGradient} text-white shadow-lg shadow-[#8B5A00]/20`
                      : 'text-[#6f6257] hover:bg-[#f3e7d4] hover:text-[#8B5A00]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-[#6f6257] transition hover:scale-110 md:hidden"
          >
            <div className={`mb-1 h-0.5 w-6 bg-current transition ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`mb-1 h-0.5 w-6 bg-current transition ${mobileOpen ? 'opacity-0' : ''}`}></div>
            <div className={`h-0.5 bg-current transition ${mobileOpen ? 'w-6 -rotate-45 -translate-y-1.5' : 'w-4'}`}></div>
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#eadcc9] bg-white/90 backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-2 px-6 py-4">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/auth', label: 'Login' },
                  { to: '/guest?tab=gifts', label: 'My Gifts' },
                ].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2.5 text-sm font-black transition ${
                        isActive
                          ? 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] text-white'
                          : 'text-[#6f6257] hover:bg-[#f3e7d4]'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="relative flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-[#d4c0a5] bg-gradient-to-br from-[#f5ede0] via-[#efe4d2] to-[#e2ceb2] pt-16 pb-8">
        
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-10 h-56 w-56 rounded-full bg-[#B8860B]/8 blur-3xl"></div>

          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#8B5A00]/10 blur-3xl"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6">
          
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Brand */}
            <div className="space-y-5">
              <h3 className="text-2xl font-black bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] bg-clip-text text-transparent">
                ZeAlpha
              </h3>

              <p className="max-w-xs text-sm leading-7 text-[#5c4d3e]">
                Elegant wedding registry experiences crafted for modern couples,
                seamless gifting, and memorable celebrations.
              </p>
            </div>

            {/* Explore */}
            <div className="space-y-5">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#8B5A00]">
                Explore
              </h4>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Start Registry', to: '/auth' },
                  { label: 'Find Wedding', to: '/my-gifts' },
                ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="text-sm font-medium text-[#5c4d3e] transition-all duration-300 hover:translate-x-1 hover:text-[#8B5A00]"
                    >
                      {item.label}
                    </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-5">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#8B5A00]">
                Legal
              </h4>

              <div className="flex flex-col gap-3">
                {[
                  'Privacy Policy',
                  'Terms of Service',
                  'Support',
                ].map((item) => (
                    <Link
                      key={item}
                      to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm font-medium text-[#5c4d3e] transition-all duration-300 hover:translate-x-1 hover:text-[#8B5A00]"
                    >
                      {item}
                    </Link>
                ))}
              </div>
            </div>

            {/* Social */}
<div className="space-y-5">
  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#8B5A00]">
    Social
  </h4>

  <div className="flex gap-4">
    {[
      { label: 'F', href: 'https://facebook.com' },
      { label: 'I', href: 'https://instagram.com' },
      { label: 'X', href: 'https://twitter.com' },
    ].map((social) => (
      <a
        key={social.label}
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfa97a] bg-gradient-to-br from-[#fff8ef] via-[#f3e2c8] to-[#dfbf95] text-sm font-black text-[#5C3B00] shadow-md transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:from-[#B8860B] hover:via-[#A0700A] hover:to-[#8B5A00] hover:text-white hover:shadow-lg hover:shadow-[#8B5A00]/25 hover:border-transparent"
      >
        {social.label}
      </a>
    ))}
  </div>
</div>
          </div>

          {/* Bottom */}
          <div className="mt-14 border-t border-[#d4c0a5]/50 pt-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6257]">
              ZeAlpha © {new Date().getFullYear()} — All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;