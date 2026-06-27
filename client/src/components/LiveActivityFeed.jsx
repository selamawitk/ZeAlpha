import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../api/api.js';

const LiveActivityFeed = ({ weddingId }) => {
  const { socket, isConnected } = useSocket();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!weddingId) return;
    api.get(`/activities?weddingId=${weddingId}&limit=10`)
      .then(({ data }) => {
        const loaded = data.map((a) => ({
          message: a.message,
          time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setEvents(loaded);
      })
      .catch(() => {});
  }, [weddingId]);

  useEffect(() => {
    if (!socket) return;

    const onActivity = (payload) => {
      setEvents((current) => [
        {
          message: payload.message || 'New activity on the registry.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...current.slice(0, 8),
      ]);
    };

    socket.on('activity:update', onActivity);
    socket.on('gift:update', onActivity);

    return () => {
      socket.off('activity:update', onActivity);
      socket.off('gift:update', onActivity);
    };
  }, [socket]);

  return (
    <div className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-premium">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary-dark">Live Activity</h2>
          <p className="text-sm text-secondary">Real-time updates from the registry floor.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-secondary">No activity yet. Guest contributions will appear here live.</p>
        ) : (
          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={`${event.message}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl bg-primary/5 p-4"
              >
                <p className="text-sm text-primary-dark">{event.message}</p>
                <p className="mt-2 text-xs text-secondary">{event.time}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
