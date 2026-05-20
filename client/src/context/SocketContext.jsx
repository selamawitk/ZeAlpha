import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useLayoutEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to ZeAlpha WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinWedding = (weddingId) => {
    if (socket && weddingId) {
      socket.emit('joinWedding', weddingId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinWedding,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};