import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';
import { initSocket } from './src/services/socketService.js';

connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Enable CORS for frontend and potential production URL
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Webhook must remain ABOVE express.json() to preserve the raw body for Stripe signature verification
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ status: 'ZeAlpha API', message: 'Collaborative wedding gift platform backend' });
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

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});