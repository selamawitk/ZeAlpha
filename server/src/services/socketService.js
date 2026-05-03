import { Server } from 'socket.io';
let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    socket.on('joinWedding', (weddingId) => {
      if (weddingId) {
        socket.join(String(weddingId));
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};

export const emitGiftUpdate = (gift) => {
  if (!io) return;
  io.emit('gift:update', gift);
  if (gift.weddingId) {
    io.to(String(gift.weddingId)).emit('gift:update', gift);
  }
};

export const emitActivity = (activity) => {
  if (!io) return;
  io.emit('activity:update', activity);
  if (activity.weddingId) {
    io.to(String(activity.weddingId)).emit('activity:update', activity);
  }
};

export const emitNotification = (notification) => {
  if (!io) return;
  io.emit('notification:update', notification);
  if (notification.weddingId) {
    io.to(String(notification.weddingId)).emit('notification:update', notification);
  }
};