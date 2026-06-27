import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ dashboardType = 'couple' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const profileRoutes = {
    admin: '/admin',
    couple: '/dashboard/settings',
    guest: '/guest',
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#B8860B] to-[#8B5A00] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
        title={user?.name || 'User'}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[#D4C39B] bg-white shadow-xl backdrop-blur-xl z-50 py-2 animate-fadeIn">
          <div className="px-4 py-3 border-b border-[#D4C39B]/40">
            <p className="text-sm font-bold text-[#2d2218] truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[#6f6257] truncate">{user?.email || ''}</p>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate(profileRoutes[dashboardType] || '/dashboard/settings');
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4A3D25] hover:bg-[#F2EDE1] transition"
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
