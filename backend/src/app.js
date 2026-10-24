import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './modules/auth/auth.routes.js';
import studentRoutes from './modules/student/student.routes.js';
import workflowRoutes from './modules/workflow/workflow.routes.js';
import rtoRoutes from './modules/rto/rto.routes.js';
import industryRoutes from './modules/industry/industry.routes.js';
import jobRoutes from './modules/job/job.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import userRoutes from './modules/user/user.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import invoiceRoutes from './modules/invoice/invoice.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import reviewRoutes from './modules/review/review.routes.js';

import { softAuth, authenticate } from './core/guards/auth.guard.js';
import { errorHandler } from './core/middlewares/error.middleware.js';
import { auditMutations } from './core/middlewares/audit.middleware.js';
import { securityHeaders } from './core/middlewares/securityHeaders.js';
import { mongoSanitize } from './core/middlewares/mongoSanitize.js';
import { apiRateLimiter } from './core/middlewares/rateLimiter.js';

const app = express();

// Dynamic CORS Configuration
const allowedList = [
  'https://portal.mantisplacements.com.au',
  'https://mantisplacements.com.au',
  'https://www.mantisplacements.com.au',
  'http://portal.mantisplacements.com.au',
  'https://www.mantisplacements.com.au',
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

app.disable('x-powered-by');
// Behind nginx: use X-Forwarded-For so req.ip is the real client (rate limiter, audit logs)
app.set('trust proxy', 1);

// Log slow requests to help diagnose latency in production
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (ms > 1000) {
      const size = res.getHeader('content-length') || '?';
      console.warn(`[SLOW] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms size=${size}B`);
    }
  });
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedList.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, origin);
      }
      return callback(new Error('CORS policy: Request from origin is not permitted'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
  })
);

app.use(securityHeaders);
app.use(mongoSanitize);
app.use(apiRateLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Resolve acting user context and audit mutations
app.use(softAuth);
app.use(auditMutations);

// Modular Routes (supporting canonical /api/v1 and legacy endpoints)
app.use('/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/students', studentRoutes);
app.use('/api/v1/students', studentRoutes);

// Uploaded student documents (bulk + profile). Auth-protected, not public.
app.use('/uploads', authenticate, express.static(path.resolve(process.cwd(), 'uploads'), { fallthrough: false }));

app.use('/workflows', workflowRoutes);
app.use('/api/v1/workflows', workflowRoutes);

app.use('/rtos', rtoRoutes);
app.use('/api/v1/rtos', rtoRoutes);

app.use('/industries', industryRoutes);
app.use('/api/v1/industries', industryRoutes);

app.use('/jobs', jobRoutes);
app.use('/notifications', notificationRoutes);

app.use('/users', userRoutes);
app.use('/api/v1/admin/users', userRoutes);
app.use('/api/v1/users', userRoutes);

app.use('/user-logs', auditRoutes);
app.use('/payments', paymentRoutes);
app.use('/invoices', invoiceRoutes);

app.use('/attendance', attendanceRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

app.use('/reviews', reviewRoutes);
app.use('/api/v1/reviews', reviewRoutes);

app.get('/', (req, res) => {
  return res.status(200).json({ message: 'Server is running' });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
