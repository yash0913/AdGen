import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import router from './routes';
import { connectDB } from './config/db';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static serving for uploads (optional)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Static serving for generated outputs (CRITICAL)
app.use('/outputs', express.static(path.resolve(__dirname, '../outputs')));

// Health route
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Base API router
app.use('/api', router);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Start server regardless of DB connection status
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Connect to DB asynchronously and log status
connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err);
});

export default app;
