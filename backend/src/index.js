import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import truckRoutes from './routes/trucks.js';
import trailerRoutes from './routes/trailers.js';
import journeyRoutes from './routes/journeys.js';
import userRoutes from './routes/users.js';
import tireRoutes from './routes/tires.js';
import maintenanceRuleRoutes from './routes/maintenanceRules.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/trailers', trailerRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/tires', tireRoutes);
app.use('/api/maintenance-rules', maintenanceRuleRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FleetFlow API is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


