import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getContributions } from '../api/api';
import { useSocket } from '../context/SocketContext';

const AdminLayout = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const { socket } = useSocket();

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
      return () => socket.off('newContribution');
    }
  }, [socket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 font-sans">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Navigation */}
        <aside className="border-r border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-8 shadow-lg">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500/80 font-bold animate-pulse">System Authority</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">ZeAlpha <span className="text-amber-500">Admin</span></h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500">Live Control Center</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <NavLink 
              to="/admin" 
              end 
              className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-lg scale-105' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:scale-102'}`}
            >
              Global Metrics
            </NavLink>

            <NavLink 
              to="/admin/verify-payments" 
              className={({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-lg scale-105' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:scale-102'}`}
            >
              <span>Payment Verification</span>
              {pendingCount > 0 && (
                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${isActive ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>
                  {pendingCount}
                </span>
              )}
            </NavLink>

            <NavLink 
              to="/admin/orders" 
              className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-lg scale-105' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:scale-102'}`}
            >
              Vendor Fulfillment
            </NavLink>
          </nav>

          <div className="mt-auto pt-10">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-[10px] uppercase text-gray-500">Terminal ID</p>
              <p className="text-xs font-mono text-gray-300 uppercase tracking-tighter">ZA-ROOT-99X-ETH</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-white">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-6 backdrop-blur-md shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Session Active</p>
                <h2 className="text-xl font-medium text-slate-900 bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">Admin Dashboard</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-slate-500 uppercase">Server Status</p>
                  <p className="text-xs text-emerald-600 font-mono animate-pulse">STABLE_PRODUCTION</p>
                </div>
                <div className="h-10 w-10 rounded-full border border-slate-300 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-600 font-bold shadow-sm">
                  A
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;