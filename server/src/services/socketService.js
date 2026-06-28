import { Server } from 'socket.io';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
let io;

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: clientOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        socket.userId = decoded.id;
      } catch {
        // optional auth - user stays anonymous
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, socket.userId ? `user:${socket.userId}` : 'anonymous');
    
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

const persistActivity = async (activity) => {
  try {
    await Activity.create({
      weddingId: activity.weddingId,
      type: activity.type || 'general',
      title: activity.title || '',
      message: activity.message || '',
      timestamp: activity.timestamp || new Date(),
    });
  } catch (err) {
    console.error('Failed to persist activity:', err);
  }
};

export const emitGiftUpdate = (gift) => {
  if (!io) return;
  const room = gift.weddingId?._id || gift.weddingId;
  if (room) {
    io.to(String(room)).emit('gift:update', gift);
  }
};

export const emitNewContribution = (contribution) => {
  if (!io) return;
  const room = contribution.weddingId?._id || contribution.weddingId;
  if (room) {
    io.to(String(room)).emit('newContribution', contribution);
  }
};

export const emitActivity = (activity) => {
  if (!io) return;
  if (activity.weddingId) {
    io.to(String(activity.weddingId)).emit('activity:update', activity);
    persistActivity(activity);
  }
};

export const emitNotification = (notification) => {
  if (!io) return;
  if (notification.weddingId) {
    io.to(String(notification.weddingId)).emit('notification:update', notification);
  }
};

export const emitWithdrawalUpdate = (payout) => {
  if (!io) return;
  const room = payout.weddingId?._id || payout.weddingId;
  if (room) {
    io.to(String(room)).emit('withdrawal:update', payout);
  }
};

export const emitGiftSurge = async (gift) => {
  if (!io) return;
  const room = gift.weddingId?._id || gift.weddingId;
  if (room) {
    io.to(String(room)).emit('gift:surge', gift);

    try {
      const Wedding = (await import('../models/Wedding.js')).default;
      const wedding = await Wedding.findById(room);
      if (wedding) {
        const surgeNotify = {
          recipient: wedding.couple,
          weddingId: room,
          type: 'gift_surge',
          title: `${gift.name} is surging!`,
          message: `${gift.name} is over 80% funded (${Math.round((gift.currentCollected / gift.totalPrice) * 100)}%). Guests are rallying!`,
          link: '/dashboard/gifts',
        };
        await Notification.create(surgeNotify);
        io.to(String(room)).emit('notification:update', surgeNotify);
      }
    } catch (err) {
      console.error('Failed to persist gift_surge notification:', err);
    }
  }
};

export const emitVendorOrderUpdate = (order) => {
  if (!io) return;
  const room = order.wedding?._id || order.wedding;
  if (room) {
    io.to(String(room)).emit('vendorOrder:update', order);
  }
};