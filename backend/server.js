import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db_config.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import studentRoutes from './routes/student.route.js';
import workflowRoutes from './routes/workflow.route.js';
import rtoRoutes from './routes/rto.route.js';
import industryRoutes from './routes/industry.route.js';
import jobRoutes from './routes/job.route.js';
import notificationRoutes from './routes/notification.route.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';

dotenv.config();

const app = express();

// Dynamic CORS Configuration
const allowedList = [
  'https://portal.mantisplacements.com.au',
  'https://mantisplacements.com.au',
  'https://www.mantisplacements.com.au',
  'http://portal.mantisplacements.com.au',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedList.includes(trimmed)) {
      allowedList.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedList.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, origin);
      }
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/workflows', workflowRoutes);
app.use('/rtos', rtoRoutes);
app.use('/industries', industryRoutes);
app.use('/jobs', jobRoutes);
app.use('/notifications', notificationRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// Connect to DB then start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });