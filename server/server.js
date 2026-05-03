import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
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
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';
import { initSocket } from './src/services/socketService.js';

connectDB();
const app = express();

// Enable CORS for frontend and potential production URL
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

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

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});