import express from 'express';
import cors from 'cors';
import multer from 'multer';
import authRoutes from './routes/auth.js';
import aboutRoutes from './routes/about.js';
import userRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import { verifyToken } from './middleware/auth.js';
import pointrulesRoutes from './routes/pointrules.js';
import organizationsRoutes from './routes/organizations.js';
import logsRoutes from './routes/logs.js';
import transactionsRoutes from './routes/transactions.js';

const app = express();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Public routes
app.use('/api', authRoutes);
app.use('/api', aboutRoutes);

// Protected routes
app.use('/api', verifyToken, userRoutes);
app.use('/api', verifyToken, notificationsRoutes);
app.use('/api', verifyToken, pointrulesRoutes);
app.use('/api/organizations/bulk-upload', verifyToken, upload.single('file'), organizationsRoutes);
app.use('/api', organizationsRoutes);
app.use('/api', logsRoutes);
app.use('/api', transactionsRoutes);

export default app;
