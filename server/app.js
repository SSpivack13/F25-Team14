import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import aboutRoutes from './routes/about.js';
import userRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', aboutRoutes);
app.use('/api', userRoutes);
app.use('/api', notificationsRoutes);

export default app;
