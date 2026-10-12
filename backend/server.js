import dotenv from 'dotenv';
import connectDB from './src/core/config/db_config.js';
import app from './src/app.js';
import { checkAndSendPlacementAlerts } from './src/modules/email/email.service.js';

dotenv.config();

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
