import express from 'express';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import reportRoutes from './routes/report.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
