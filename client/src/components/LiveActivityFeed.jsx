import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

const LiveActivityFeed = () => {
  const { socket, isConnected } = useSocket();
  const [events, setEvents] = useState([]);

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

    socket.on('liveActivity', onActivity);
    socket.on('gift:update', onActivity);

    return () => {
      socket.off('liveActivity', onActivity);
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
          events.map((event, index) => (
            <div key={`${event.message}-${index}`} className="rounded-3xl bg-primary/5 p-4">
              <p className="text-sm text-primary-dark">{event.message}</p>
              <p className="mt-2 text-xs text-secondary">{event.time}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
