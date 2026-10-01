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
import userLogRoutes from './routes/userLog.route.js';
import { softAuth } from './middlewares/auth.middleware.js';
import { auditMutations } from './middlewares/audit.middleware.js';
import { checkAndSendPlacementAlerts } from './service/email.service.js';

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Resolve the acting user once and audit successful write requests across portal APIs.
app.use(softAuth);
app.use(auditMutations);

// Routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/workflows', workflowRoutes);
app.use('/rtos', rtoRoutes);
app.use('/industries', industryRoutes);
app.use('/jobs', jobRoutes);
app.use('/notifications', notificationRoutes);
app.use('/users', userRoutes);
app.use('/user-logs', userLogRoutes);

app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// ─── Placement Alert Scheduler ─────────────────────────────────────────────
// Runs once on startup (after 30s to allow DB to settle), then every 24 hours.
// Checks all active placements — if expectedCompletionDate is within 7 days,
// sends an email + in-app notification to the student.
const ALERT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const startPlacementAlertScheduler = () => {
    // Initial run after 30 seconds (gives DB connection time to stabilise)
    setTimeout(async () => {
        console.log('[Scheduler] Running initial placement alert check...');
        try {
            const result = await checkAndSendPlacementAlerts();
            console.log('[Scheduler] Initial check complete:', result);
        } catch (err) {
            console.error('[Scheduler] Initial check failed:', err.message);
        }
    }, 30 * 1000);

    // Then repeat every 24 hours
    setInterval(async () => {
        console.log('[Scheduler] Running daily placement alert check...');
        try {
            const result = await checkAndSendPlacementAlerts();
            console.log('[Scheduler] Daily check complete:', result);
        } catch (err) {
            console.error('[Scheduler] Daily check failed:', err.message);
        }
    }, ALERT_INTERVAL_MS);
};

// Connect to DB then start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
            startPlacementAlertScheduler();
        });
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });
