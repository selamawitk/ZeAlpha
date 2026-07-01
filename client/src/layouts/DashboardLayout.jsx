import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import {
  LayoutDashboard,
  Gift,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Bell,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';
import api from '../api/api.js';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('dashboardSidebarCollapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      if (Array.isArray(data)) {
        setNotifCount(data.filter(n => !n.isRead).length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifCount(c => c + 1);
      setToast(notif);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    };
    socket.on('notification:update', handler);
    return () => {
      socket.off('notification:update', handler);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [socket]);

  useEffect(() => {
    if (location.pathname === '/dashboard/notifications') {
      setNotifCount(0);
      fetchUnreadCount();
    }
  }, [location.pathname, fetchUnreadCount]);

  const navItem = ({ isActive }) =>
    `group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300
    ${isActive
      ? 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] text-white shadow-lg'
      : 'text-[#4A3D25] hover:bg-[#D4C39B]/40'
    }`;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4] text-[#2d2218] overflow-x-hidden">

      <div className={`flex transition-all duration-300 w-full ${collapsed ? 'lg:pl-20' : 'lg:pl-60'}`}>

        {/* SIDEBAR */}
        <aside className={`fixed left-0 top-0 h-full border-r border-[#D4C39B] bg-gradient-to-b from-[#F2EDE1] to-[#E8E0CE] z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

          <div className="flex items-center justify-between px-4 py-5">
            {!collapsed && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#8B5A00]">
                  Couple Studio
                </p>
                <h1 className="text-lg font-black text-[#2d2218]">
                  ZeAlpha
                </h1>
              </div>
            )}

            <button
              onClick={() => {
                const next = !collapsed;
                setCollapsed(next);
                localStorage.setItem('dashboardSidebarCollapsed', next);
              }}
              className={`p-2 rounded-xl hover:bg-white/70 hover:shadow-md transition ${collapsed ? 'mx-auto' : ''} hidden lg:block`}
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
            <NavLink to="/dashboard" end className={navItem} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={18} className="shrink-0" />
              {!collapsed && <span className="animate-fadeIn">Overview</span>}
            </NavLink>

            <NavLink to="/dashboard/gifts" className={navItem} onClick={() => setMobileOpen(false)}>
              <Gift size={18} className="shrink-0" />
              {!collapsed && <span>Gifts</span>}
            </NavLink>

            <NavLink to="/dashboard/manage" className={navItem} onClick={() => setMobileOpen(false)}>
              <Package size={18} className="shrink-0" />
              {!collapsed && <span>Add Gifts</span>}
            </NavLink>

            <NavLink to="/dashboard/wallet" className={navItem} onClick={() => setMobileOpen(false)}>
              <Wallet size={18} className="shrink-0" />
              {!collapsed && <span>Payouts</span>}
            </NavLink>

            <NavLink to="/dashboard/fulfillment" className={navItem} onClick={() => setMobileOpen(false)}>
              <Truck size={18} className="shrink-0" />
              {!collapsed && <span>Fulfillment</span>}
              {!collapsed && <span className="ml-auto rounded-full bg-[#8B5A00]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8B5A00] border border-[#8B5A00]/20">Soon</span>}
            </NavLink>

            <NavLink to="/dashboard/settings" className={navItem} onClick={() => setMobileOpen(false)}>
              <Settings size={18} className="shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>

            <NavLink to="/dashboard/notifications" className={navItem} onClick={() => setMobileOpen(false)}>
              <span className="relative shrink-0"><Bell size={18} />{notifCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{notifCount > 9 ? '9+' : notifCount}</span>}</span>
              {!collapsed && <span>Notifications</span>}
            </NavLink>
          </nav>

          <div className="absolute bottom-6 w-full px-2">
            <button
              onClick={logout}
              className="group flex items-center justify-center gap-2 w-full rounded-xl border border-[#e8dcc0] bg-white/40 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-500 hover:shadow-lg"
            >
              <LogOut size={16} className="shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>

        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* MAIN BODY */}
        <div className="flex flex-col flex-1 min-h-screen w-full">

          {toast && (
            <div className="fixed top-4 right-4 z-[100] max-w-sm animate-slide-in rounded-[28px] bg-gradient-to-br from-[#F4EBDD]/98 via-[#E7D3B7]/98 to-[#D6B58B]/98 border border-[#CFA97A] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8860B]/10 shrink-0">
                  <Bell className="h-4 w-4 text-[#8B5A00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2d2218] truncate">{toast.title}</p>
                  <p className="text-xs text-[#6f6257] mt-0.5 line-clamp-2">{toast.message}</p>
                </div>
                <button onClick={() => setToast(null)} className="shrink-0 p-1 rounded-full hover:bg-white/60">
                  <X size={14} className="text-[#6f6257]" />
                </button>
              </div>
            </div>
          )}
          <header className="sticky top-0 z-40 px-4 lg:px-6 pt-5 pb-4 backdrop-blur-xl bg-[#F7F3EA]/90 border-b border-[#D4C39B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-xl hover:bg-[#D4C39B]/40 transition">
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#8B5A00]">
                    Couple Console
                  </p>
                  <h2 className="text-2xl font-black text-[#2d2218]">
                    Welcome back, {user?.name || 'Couple'}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-[#f1d27a]/20 to-primary-gold/20 text-[#a67c1b] border border-[#f1e7d0]">
                  Live Studio
                </div>
                <ProfileDropdown dashboardType="couple" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 lg:px-6 py-2 w-full max-w-full">
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
