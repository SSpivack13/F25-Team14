import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import aboutRoutes from './routes/about.js';
import userRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import pointrulesRoutes from './routes/pointrules.js';
import organizationsRoutes from './routes/organizations.js';
import logsRoutes from './routes/logs.js';
import transactionsRoutes from './routes/transactions.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', aboutRoutes);
app.use('/api', userRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', pointrulesRoutes);
app.use('/api', organizationsRoutes);
app.use('/api', logsRoutes);
app.use('/api', transactionsRoutes);

export default app;
