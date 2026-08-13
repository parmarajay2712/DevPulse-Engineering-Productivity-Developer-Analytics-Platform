import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import organizationRoutes from './routes/organizationRoutes';
import projectRoutes from './routes/projectRoutes';
import ingestRoutes from './routes/ingestRoutes';
import alertRoutes from './routes/alertRoutes';
import logRoutes from './routes/logRoutes';
import deploymentRoutes from './routes/deploymentRoutes';
import errorRoutes from './routes/errorRoutes';
import incidentRoutes from './routes/incidentRoutes';
import systemRoutes from './routes/systemRoutes';
import statsRoutes from './routes/statsRoutes';
import './jobs/alertJob';
import { startTaskRunner } from './jobs/taskRunner';
import { startRetentionJob } from './jobs/retentionJob';
import { startRollupJob } from './jobs/rollupJob';

// @ts-ignore - quiet option for latest dotenv
dotenv.config({ quiet: true });

export const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 5000;

// Socket.io Connection Logic
io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
  });

  socket.on('disconnect', () => {
    // Optionally handle disconnect logic here
  });
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'DevPulse API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/stats', statsRoutes);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Database & Server Initialization
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully');
      
      // Start background task runner
      startTaskRunner();
      
      // Start retention job
      startRetentionJob();
      
      // Start rollup job
      startRollupJob();
    } else {
      console.log('MongoDB URI not provided. Skipping DB connection for now.');
    }

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
