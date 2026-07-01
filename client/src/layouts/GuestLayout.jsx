import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../api/api.js';
import {
  Bell,
  Search,
  Gift,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  X,
  Settings,
  Heart,
} from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import GuestDashboard from '../pages/GuestDashboard.jsx';
import Notifications from '../pages/Notifications.jsx';
import FindWedding from '../pages/FindWedding.jsx';
import MyGifts from '../pages/MyGifts.jsx';

const SettingsPanel = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const { updateUserProfile } = await import('../api/api.js');
      const updated = await updateUserProfile({ name });
      updateUser({ name: updated.name, token: updated.token });
      if (updated.token) localStorage.setItem('token', updated.token);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-black text-[#2d2218] mb-6">Settings</h2>
      <div className="rounded-[28px] bg-gradient-to-br from-[#F4EBDD]/95 via-[#E7D3B7]/92 to-[#D6B58B]/90 border border-[#CFA97A] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.07)]">
        <label className="block text-sm font-bold text-[#6f6257] mb-2">Display Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10" />
        <button onClick={handleSave} disabled={saving} className="mt-4 rounded-2xl bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        {saved && <p className="mt-2 text-sm text-green-700 font-medium">Saved successfully</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

const ThankYouPanel = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-black text-[#2d2218] mb-6">Thank You Cards</h2>
      <div className="rounded-[28px] bg-gradient-to-br from-[#F4EBDD]/95 via-[#E7D3B7]/92 to-[#D6B58B]/90 border border-[#CFA97A] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.07)] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f1d27a]/30 mb-4">
          <Heart className="h-8 w-8 text-[#8B5A00]" />
        </div>
        <p className="text-sm text-[#6f6257]">Your digital thank-you cards will appear here after you contribute to a gift.</p>
        <p className="text-xs text-[#8c755e] mt-2">Go to <strong>My Gifts</strong> to find a gift you have contributed to.</p>
        {(user?.digitalCards?.length > 0) && (
          <p className="text-sm font-bold text-[#8B5A00] mt-4">{user.digitalCards.length} card{user.digitalCards.length !== 1 ? 's' : ''} available</p>
        )}
      </div>
    </div>
  );
};

const GuestLayout = () => {
  const { user, logout } = useAuth();
  const { socket, joinWedding } = useSocket();
  const [searchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('guestSidebarCollapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
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
      if (activeTab !== 'notifications') {
        setNotifCount(c => c + 1);
      }
      setToast(notif);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    };
    socket.on('notification:update', handler);
    // Also join any wedding rooms for notification delivery
    const tryJoinWedding = () => {
      const path = window.location.pathname;
      const match = path.match(/\/w\/([^/]+)/);
      if (match) joinWedding(match[1]);
    };
    tryJoinWedding();
    return () => {
      socket.off('notification:update', handler);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [socket, activeTab, joinWedding]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      setNotifCount(0);
      fetchUnreadCount();
    }
  }, [activeTab, fetchUnreadCount]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('guestSidebarCollapsed', next);
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'gifts', label: 'My Gifts', icon: <Gift size={18} /> },
    { id: 'find', label: 'Find Wedding', icon: <Search size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <span className="relative"><Bell size={18} />{notifCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{notifCount > 9 ? '9+' : notifCount}</span>}</span> },
    { id: 'thankyou', label: 'Thank You Cards', icon: <Heart size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4] text-[#2d2218] overflow-hidden">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 h-full border-r border-[#D4C39B] bg-gradient-to-b from-[#F2EDE1] to-[#E8E0CE] z-50 transition-all duration-300
        ${collapsed ? 'w-20' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}>

        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#8B5A00]">
                Guest Studio
              </p>
              <h1 className="text-lg font-black text-[#2d2218]">
                ZeAlpha
              </h1>
            </div>
          )}

          <button
            onClick={() => { toggleCollapsed(); closeMobile(); }}
            className={`p-2 rounded-xl hover:bg-white/70 hover:shadow-md transition ${collapsed ? 'mx-auto' : ''} hidden lg:block`}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            onClick={closeMobile}
            className="p-2 rounded-xl hover:bg-white/70 hover:shadow-md transition lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 px-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); closeMobile(); }}
              className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left
                ${activeTab === item.id
                  ? 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] text-white shadow-lg'
                  : 'text-[#4A3D25] hover:bg-[#D4C39B]/40'
                }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
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

      {/* MAIN BODY */}
      <div className={`flex flex-col flex-1 min-h-screen w-full transition-all duration-300
        ${collapsed ? 'lg:pl-20' : 'lg:pl-60'}`}>

        <header className="sticky top-0 z-40 px-6 pt-5 backdrop-blur-xl bg-[#F7F3EA]/90 border-b border-[#D4C39B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-xl hover:bg-[#D4C39B]/40 transition lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#8B5A00]">
                  Guest Portal
                </p>
                <h2 className="text-2xl font-black text-[#2d2218]">
                  Welcome, {user?.name || 'Guest'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-[#f1d27a]/20 to-primary-gold/20 text-[#a67c1b] border border-[#f1e7d0]">
                Guest Access
              </div>
              <ProfileDropdown dashboardType="guest" />
            </div>
          </div>
        </header>

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
        <div className="flex-1 px-6 py-2">
          {activeTab === 'dashboard' && <GuestDashboard />}
          {activeTab === 'gifts' && <MyGifts />}
          {activeTab === 'find' && <FindWedding />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'thankyou' && <ThankYouPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>

      </div>
    </div>
  );
};

export default GuestLayout;
