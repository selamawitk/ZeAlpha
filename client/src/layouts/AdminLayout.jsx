import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, ShieldCheck, Truck, Store, Users, LogOut, Menu, X } from 'lucide-react';
import { getContributions } from '../api/api';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileDropdown from '../components/ProfileDropdown.jsx';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { socket } = useSocket();

  const goldGradient = "bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]";
  const textGoldGradient = "bg-gradient-to-r from-[#8B5A00] to-[#B8860B] bg-clip-text text-transparent";

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('adminSidebarCollapsed', next);
  };

  const updateBadgeCount = async () => {
    try {
      const data = await getContributions();
      const pending = data.filter(c => c.status === 'pending');
      setPendingCount(pending.length);
    } catch (err) {
      console.error("Error fetching pending count", err);
    }
  };

  useEffect(() => {
    updateBadgeCount();
    if (socket) {
      socket.on('newContribution', updateBadgeCount);
      return () => socket.off('newContribution', updateBadgeCount);
    }
  }, [socket]);

  const navIcon = (icon) => <span className="shrink-0">{icon}</span>;

  const navItems = [
    { to: "/admin", label: "Global Metrics", icon: <BarChart3 size={18} /> },
    { to: "/admin/verify-payments", label: "Payment Verification", icon: <ShieldCheck size={18} />, badge: pendingCount },
    { to: "/admin/orders", label: "Vendor Fulfillment", icon: <Truck size={18} /> },
    { to: "/admin/vendors", label: "Vendors", icon: <Store size={18} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={18} /> }
  ];

  const sidebarContent = (
    <>
      <div className={`px-6 py-8 ${collapsed ? 'px-4' : ''}`}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#8B5A00] font-bold">System Authority</p>
              <h1 className={`mt-3 text-2xl font-black tracking-tight ${textGoldGradient}`}>
                ZeAlpha Admin
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-700 animate-pulse"></span>
                <p className="text-xs text-[#705008]">Live Control Center</p>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <div className={`mt-3 text-2xl font-black ${textGoldGradient}`}>ZA</div>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
            className={`p-2 rounded-xl hover:bg-[#D4C39B]/40 transition hidden lg:block ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <nav className="space-y-2 px-3 text-sm">
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <NavLink
              to={item.to}
              end={item.to === "/admin"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300 font-bold
                ${isActive 
                  ? `${goldGradient} text-white shadow-md shadow-[#8B5A00]/30` 
                  : 'text-[#4A3D25] hover:bg-[#D4C39B]/40 hover:text-[#1A150C]'}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={'flex items-center gap-3 ' + (collapsed ? 'mx-auto' : '')}>
                {item.icon}
                {collapsed ? '' : item.label}
              </span>
              {!collapsed && item.badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#8B5A00] px-1.5 text-[10px] font-black text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="absolute bottom-6 w-full px-3">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4C39B] bg-white/30 px-3 py-2.5 text-sm font-bold text-[#4A3D25] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4] text-[#2a1f14] font-sans">
      {/* Desktop sidebar */}
      <aside className={`fixed left-0 top-0 h-full border-r border-[#D4C39B] bg-gradient-to-b from-[#F2EDE1] to-[#E8E0CE] shadow-xl z-50 transition-all duration-300 hidden lg:block ${collapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-[280px] border-r border-[#D4C39B] bg-gradient-to-b from-[#F2EDE1] to-[#E8E0CE] shadow-xl z-50 lg:hidden overflow-y-auto"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={`flex min-h-screen flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        <header className="sticky top-0 z-30 border-b border-[#D4C39B] bg-[#F7F3EA]/90 px-4 lg:px-6 py-4 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-xl hover:bg-[#D4C39B]/40 transition lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B5A00] font-bold">Admin Console</p>
                <h2 className="text-xl font-black tracking-tight text-[#2d2218]">
                  {collapsed ? 'ZA' : 'System Administration'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProfileDropdown dashboardType="admin" />
              <span className="flex h-2 w-2 rounded-full bg-emerald-700 animate-pulse"></span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 overflow-x-auto">
          <div className="min-w-0 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
