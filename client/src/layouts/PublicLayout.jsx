import { Link, NavLink, Outlet } from 'react-router-dom';

const PublicLayout = () => {
  const btnGradient = "bg-gradient-to-r from-[#d4af37] via-[#9a793b] to-[#815e08]";

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb] text-[#1a1a1a] selection:bg-rose-100 selection:text-rose-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-rose-100/30 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-amber-50/40 blur-[100px]"></div>
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-rose-50/50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link 
            to="/" 
            className="group relative flex items-center gap-2 text-2xl font-serif font-bold tracking-tight text-[#d4af37]"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e1ba38] to-[#815e08]">
              ZeAlpha
            </span>
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#d4af37] transition-all duration-300 group-hover:w-full"></div>
          </Link>

          <nav className="hidden md:flex items-center gap-3">
            {[
              { to: "/", label: "Home" },
              { to: "/auth", label: "Couple Login" },
              { to: "/my-gifts", label: "My Gifts" }
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => `
                  px-6 py-2 text-sm font-bold rounded-full transition-all duration-500
                  ${isActive 
                    ? `${btnGradient} text-white shadow-lg shadow-[#9a793b]/30 scale-105` 
                    : 'text-gray-600 hover:bg-rose-50 hover:text-[#9a793b] hover:scale-110'}
                `}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button className="md:hidden p-2 text-gray-600 hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-0.5 bg-current mb-1"></div>
            <div className="w-6 h-0.5 bg-current mb-1"></div>
            <div className="w-4 h-0.5 bg-current"></div>
          </button>
        </div>
      </header>

      <main className="relative flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Outlet />
      </main>

      <footer className="relative bg-[#1a1a1a] text-[#fdfcfb] pt-20 pb-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
        
        <div className="container mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold text-[#d4af37]">ZeAlpha</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Redefining the art of giving. Join us in creating shared memories and magical wedding experiences through collaborative gifting.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Explore</h4>
              <div className="flex flex-col gap-3">
                {['Home', 'Start Registry', 'Find Wedding'].map((item) => (
                  <Link 
                    key={item} 
                    to="/" 
                    className="text-sm text-gray-400 hover:text-[#f9e79f] hover:translate-x-2 transition-all duration-300"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Legal</h4>
              <div className="flex flex-col gap-3">
                {['Privacy Policy', 'Terms of Service', 'Support'].map((item) => (
                  <Link 
                    key={item} 
                    to="/" 
                    className="text-sm text-gray-400 hover:text-[#f9e79f] hover:translate-x-2 transition-all duration-300"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#d4af37]">Social</h4>
              <div className="flex gap-4">
                {['F', 'I', 'X'].map((social) => (
                  <button 
                    key={social}
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all duration-300 hover:scale-125 hover:shadow-lg shadow-[#9a793b]/20 border border-gray-700 hover:border-transparent hover:text-white hover:${btnGradient}`}
                  >
                    {social}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">
               ZeAlpha © {new Date().getFullYear()} — All rights reserved.
            </p>
            <div className="flex gap-6">
              <div className="w-12 h-px bg-gray-800"></div>
              <div className="w-12 h-px bg-gray-800"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;