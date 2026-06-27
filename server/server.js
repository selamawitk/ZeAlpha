import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import userRoutes from './src/routes/userRoutes.js';
import weddingRoutes from './src/routes/weddingRoutes.js';
import giftRoutes from './src/routes/giftRoutes.js';
import contributionRoutes from './src/routes/contributionRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import payoutRoutes from './src/routes/payoutRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import webhookRoutes from './src/routes/webhookRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import blessingRoutes from './src/routes/blessingRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import vendorRoutes from './src/routes/vendorRoutes.js';
import groupRoutes from './src/routes/groupRoutes.js';
import activityRoutes from './src/routes/activityRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';
import { initSocket } from './src/services/socketService.js';

connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Enable CORS for frontend — supports multiple origins via comma-separated CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com", "ws:", "wss:"],
      frameAncestors: ["'self'"],
    },
  },
}));

// Rate limiting - exempt webhooks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks')) return next();
  return limiter(req, res, next);
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again later.',
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Rate limit for password reset (prevent email bombing)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
});
app.use('/api/users/forgot-password', passwordResetLimiter);
app.use('/api/users/reset-password', passwordResetLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Webhook must remain ABOVE express.json() to preserve the raw body for Stripe signature verification
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// express-mongo-sanitize v2.2.0 assigns req.query = sanitized which throws on Express 5 (query is getter-only).
// Use a custom version that sanitizes body/params normally and query in-place via Object.assign.
app.use((req, res, next) => {
  ['body', 'params', 'headers'].forEach((key) => {
    if (req[key]) {
      const sanitized = mongoSanitize.sanitize(req[key]);
      Object.assign(req[key], sanitized);
    }
  });
  if (req.query) {
    const sanitized = mongoSanitize.sanitize(req.query);
    Object.assign(req.query, sanitized);
  }
  next();
});
app.use(hpp());

app.get('/', (req, res) => {
  res.json({ status: 'ZeAlpha API', message: 'Collaborative wedding gift platform backend' });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: dbState === 1 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus[dbState] || 'unknown',
    memory: process.memoryUsage(),
  });
});

app.use('/api/users', userRoutes);
app.use('/api/weddings', weddingRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blessings', blessingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/activities', activityRoutes);

// Inline support route to avoid creating a new file
app.post('/api/support', async (req, res) => {
  try {
    const { sendSupportEmail } = await import('./src/services/emailService.js');
    await sendSupportEmail(req.body);
    res.json({ message: 'Support request received' });
  } catch (err) {
    console.error('Support email error:', err);
    res.status(500).json({ message: 'Failed to send support request' });
  }
});

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

initSocket(server);

// Periodic cleanup for expired gift locks (every 5 minutes)
import Gift from './src/models/Gift.js';
const unlockExpiredLocks = async () => {
  try {
    const result = await Gift.updateMany(
      { isLocked: true, lockedUntil: { $lt: new Date() } },
      { $set: { isLocked: false, lockedUntil: null } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-unlocked ${result.modifiedCount} expired gift reservations`);
    }
  } catch (err) {
    console.error('Lock cleanup error:', err);
  }
};
setInterval(unlockExpiredLocks, 5 * 60 * 1000);
unlockExpiredLocks();

// Periodic auto-conversion for past-wedding gifts (every hour)
import Wedding from './src/models/Wedding.js';
const autoConvertGifts = async () => {
  try {
    const pastWeddings = await Wedding.find({ weddingDate: { $lt: new Date() } });
    for (const wedding of pastWeddings) {
      const autoConvert = wedding.conversionSettings?.autoConvert === true;
      const gifts = await Gift.find({ weddingId: wedding._id, status: 'open' });
      for (const gift of gifts) {
        const progress = gift.totalPrice > 0 ? (gift.currentCollected / gift.totalPrice) * 100 : 0;
        if (progress >= 100) {
          gift.status = 'fullyFunded';
        } else if (progress > 0) {
          if (autoConvert) {
            gift.status = 'cashedOut';
            gift.deliveryOptions = 'cashout';
          }
        } else {
          gift.status = 'expired';
        }
        await gift.save();
      }
    }
  } catch (err) {
    console.error('Auto-conversion error:', err);
  }
};
setInterval(autoConvertGifts, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});