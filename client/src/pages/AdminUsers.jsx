import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Ban, CheckCircle, Trash2, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import api from '../api/api.js';

const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const textMuted = 'text-[#6f6257]';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/users');
        setUsers(data);
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'guest' : 'admin';
    try {
      const { data } = await api.put(`/users/${id}`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === id ? data : u));
    } catch {
      setError('Failed to update role');
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q));
  });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2d2218]">User Management</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f6257]" />
          <input
            type="text" placeholder="Search users..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#D4C39B] bg-white/60 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30"
          />
        </div>
      </div>

      {error && <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <motion.div key={user._id} layout className={`${glassCard} p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B8860B] to-[#8B5A00] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2d2218] truncate">{user.name || 'N/A'}</p>
                    <p className="text-xs text-[#6f6257] truncate">{user.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'couple' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                  <button onClick={() => setExpanded(expanded === user._id ? null : user._id)} className="p-1.5 rounded-xl hover:bg-black/5 transition-colors">
                    {expanded === user._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {expanded === user._id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-[#D4C39B]/40 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className={textMuted}>ID:</span> {user._id}</div>
                    <div><span className={textMuted}>Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
                    <div><span className={textMuted}>Phone:</span> {user.phoneNumber || 'N/A'}</div>
                    <div><span className={textMuted}>Role:</span> {user.role}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleToggleRole(user._id, user.role)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100 transition-colors">
                      <Shield className="w-3.5 h-3.5" /> {user.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-[#6f6257] py-8">No users found</p>}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
