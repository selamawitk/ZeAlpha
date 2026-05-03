import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Gift,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logoutAndDelete } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItem = ({ isActive }) =>
    `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
    ${isActive
      ? 'bg-gradient-to-r from-[#f1d27a] via-[#d4af37] to-[#a67c1b] text-white shadow-lg'
      : 'text-gray-600 hover:bg-white/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:backdrop-blur-md'
    }`;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#faf9f7] via-white to-[#f3efe7] text-[#2a2a2a] overflow-hidden">
      
      <div className={`flex transition-all duration-300 w-full ${collapsed ? 'pl-20' : 'pl-60'}`}>

        {/* SIDEBAR */}
        <aside className={`fixed left-0 top-0 h-full border-r border-white/40 bg-white/60 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'}`}>

          <div className="flex items-center justify-between px-4 py-5">
            {!collapsed && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-semibold">
                  Couple Studio
                </p>
                <h1 className="text-lg font-serif font-black text-gray-900">
                  ZeAlpha
                </h1>
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-xl hover:bg-white/70 hover:shadow-md transition ${collapsed ? 'mx-auto' : ''}`}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {!collapsed && (
            <div className="px-4 mb-6">
              <p className="text-xs text-gray-500 font-medium truncate">
                {user?.name || 'Partner'}
              </p>
            </div>
          )}

          <nav className="space-y-1 px-2">
            <NavLink to="/dashboard" end className={navItem}>
              <LayoutDashboard size={18} className="shrink-0" />
              {!collapsed && <span className="animate-fadeIn">Overview</span>}
            </NavLink>

            <NavLink to="/dashboard/gifts" className={navItem}>
              <Gift size={18} className="shrink-0" />
              {!collapsed && <span>Gifts</span>}
            </NavLink>

            <NavLink to="/dashboard/wallet" className={navItem}>
              <Wallet size={18} className="shrink-0" />
              {!collapsed && <span>Payouts</span>}
            </NavLink>

            <NavLink to="/dashboard/settings" className={navItem}>
              <Settings size={18} className="shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </nav>

          <div className="absolute bottom-6 w-full px-2">
            <button
              onClick={logoutAndDelete}
              className="group flex items-center justify-center gap-2 w-full rounded-xl border border-[#e8dcc0] bg-white/40 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-500 hover:shadow-lg"
            >
              <LogOut size={16} className="shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>

        </aside>

        {/* MAIN BODY */}
        <div className="flex flex-col flex-1 min-h-screen w-full">

          <header className="sticky top-0 z-40 px-6 pt-5 backdrop-blur-xl bg-white/70 border-b border-white/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-semibold">
                  Dashboard
                </p>
                <h2 className="text-2xl font-serif font-black text-gray-900">
                  Welcome back, {user?.name || 'Couple'}
                </h2>
              </div>
              <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-[#f1d27a]/20 to-[#d4af37]/20 text-[#a67c1b] border border-[#f1e7d0]">
                Live Studio
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-2">
            <Outlet />
          </main>

        </div>
      </div>

      <style>{`
        .group:hover {
          transform: translateY(-1px);
        }
      `}</style>

    </div>
  );
};

export default DashboardLayout;