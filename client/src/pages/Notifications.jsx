import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, RefreshCw, Clock, Gift, CreditCard, MessageSquare, Award, UserPlus, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const NOTIFICATION_ICONS = {
  contribution: <Gift className="h-5 w-5" />,
  payment: <CreditCard className="h-5 w-5" />,
  blessing: <MessageSquare className="h-5 w-5" />,
  milestone: <Award className="h-5 w-5" />,
  guest: <UserPlus className="h-5 w-5" />,
  gift_surge: <TrendingUp className="h-5 w-5" />,
  gift_completed: <Award className="h-5 w-5" />,
  admin_alert: <AlertTriangle className="h-5 w-5" />,
};

const NOTIFICATION_BG = {
  contribution: 'bg-blue-50 border-blue-200',
  payment: 'bg-green-50 border-green-200',
  blessing: 'bg-purple-50 border-purple-200',
  milestone: 'bg-amber-50 border-amber-200',
  guest: 'bg-pink-50 border-pink-200',
  gift_surge: 'bg-orange-50 border-orange-200',
  gift_completed: 'bg-emerald-50 border-emerald-200',
  admin_alert: 'bg-red-50 border-red-200',
};

const Notifications = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on('notification:update', handler);
    return () => socket.off('notification:update', handler);
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#faf6f0] via-[#f8f3eb] to-[#efe2d1] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#2d2218]">Notifications</h1>
            <div className={`mt-2 h-1 w-14 rounded-full ${goldGradient}`}></div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-2.5 text-xs font-bold text-[#6f6257] transition-all hover:bg-white hover:shadow-md"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-2.5 text-xs font-bold text-[#6f6257] transition-all hover:bg-white hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'contribution', label: 'Contributions', count: notifications.filter(n => n.type === 'contribution').length },
            { key: 'gift_completed', label: 'Completed', count: notifications.filter(n => n.type === 'gift_completed').length },
            { key: 'gift_surge', label: 'Surging', count: notifications.filter(n => n.type === 'gift_surge').length },
            { key: 'admin_alert', label: 'Alerts', count: notifications.filter(n => n.type === 'admin_alert').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filter === tab.key
                  ? `${goldGradient} text-white shadow-md`
                  : 'bg-white/60 border border-[#dcc6a7] text-[#6f6257] hover:bg-white hover:shadow-sm'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === tab.key ? 'bg-white/20' : 'bg-[#B8860B]/10 text-[#8B5A00]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-[32px] border border-[#e7d6c1] bg-white/80 p-6 shadow-md backdrop-blur-xl">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#B8860B] border-t-transparent"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B8860B]/10">
                <Bell className="h-8 w-8 text-[#8B5A00]" />
              </div>
              <p className="mt-4 text-xl font-black text-[#2d2218]">All caught up!</p>
              <p className="mt-2 text-sm text-[#6f6257]">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((notif) => (
                <div
                  key={notif._id}
                  className={`group relative rounded-2xl border p-4 transition-all hover:shadow-md ${
                    !notif.isRead
                      ? 'border-[#B8860B]/30 bg-[#B8860B]/5'
                      : NOTIFICATION_BG[notif.type] || 'bg-white/60 border-[#e3d0b7]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      !notif.isRead ? 'bg-[#B8860B]/20 text-[#8B5A00]' : 'bg-white/80 text-[#6f6257]'
                    }`}>
                      {NOTIFICATION_ICONS[notif.type] || <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notif.isRead ? 'font-bold text-[#2d2218]' : 'font-medium text-[#6f6257]'}`}>
                            {notif.title}
                          </p>
                          <p className="mt-1 text-xs text-[#8c755e] leading-relaxed">{notif.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-[10px] text-[#8c755e] whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {timeAgo(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif._id)}
                              className="rounded-lg p-1.5 text-[#8B5A00] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#B8860B]/10"
                              title="Mark as read"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotif(notif._id)}
                            className="rounded-lg p-1.5 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div className="absolute top-4 left-4 -ml-0.5 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-[#B8860B]"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
