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
    <div className="min-h-screen bg-[#101010] text-white font-sans">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Navigation */}
        <aside className="border-r border-white/10 bg-[#111111] px-6 py-8">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500/80 font-bold">System Authority</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">ZeAlpha <span className="text-amber-400">Admin</span></h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              <p className="text-xs text-gray-400">Live Control Center</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <NavLink 
              to="/admin" 
              end 
              className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${isActive ? 'bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              Global Metrics
            </NavLink>

            <NavLink 
              to="/admin/verify-payments" 
              className={({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-200 ${isActive ? 'bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span>Payment Verification</span>
              {pendingCount > 0 && (
                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${isActive ? 'bg-black text-amber-500' : 'bg-amber-500 text-black'}`}>
                  {pendingCount}
                </span>
              )}
            </NavLink>

            <NavLink 
              to="/admin/orders" 
              className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${isActive ? 'bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
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
        <div className="flex min-h-screen flex-col bg-[#0D0D0D]">
          <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0D0D0D]/80 px-8 py-6 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/60 font-bold">Session Active</p>
                <h2 className="text-xl font-medium text-white">System Command Interface</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Server Status</p>
                  <p className="text-xs text-green-400 font-mono">STABLE_PRODUCTION</p>
                </div>
                <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-amber-400 font-bold">
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