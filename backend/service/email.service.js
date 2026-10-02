/**
 * Email Service - Placement Portal
 * Sends email alerts using nodemailer (SMTP).
 * Falls back to console log + in-app Notification if SMTP not configured.
 */

import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import NotificationModel from '../model/notification.model.js';
import WorkflowModel, { AppointmentModel } from '../model/workflow.model.js';
import StudentModel from '../model/student.model.js';
import RtoModel from '../model/rto.model.js';
import { calculatePlacementEndDate } from '../utils/dateCalculation.js';

// ─── SMTP Config ─────────────────────────────────────────────────────────────

const isSmtpConfigured = () => !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let _transporter = null;
const getTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
};

// ─── HTML Email Template: Placement Ending Soon ──────────────────────────────

const buildHtml = ({ studentName, companyName, endDate, daysLeft, coordinatorName }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f0f4f8;margin:0;padding:0}
.wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 36px}
.hdr h1{color:#fff;margin:0;font-size:22px}
.hdr p{color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px}
.badge{display:inline-block;background:rgba(255,255,255,.25);color:#fff;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;margin-top:10px}
.body{padding:32px 36px}
.card{background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:20px 24px;margin:0 0 24px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #fde68a}
.row:last-child{border-bottom:none}
.lbl{color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.val{color:#1e293b;font-size:13px;font-weight:700}
.days{color:#d97706;font-size:18px;font-weight:800}
.acts{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 24px;margin-bottom:24px}
.acts h3{color:#1e293b;font-size:13px;font-weight:700;margin:0 0 8px}
.acts ul{color:#64748b;font-size:13px;margin:0;padding-left:18px;line-height:2}
.ftr{background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0}
.ftr p{color:#94a3b8;font-size:11px;margin:0;line-height:1.6}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <h1>&#x23F0; Placement Ending Soon</h1>
    <p>Your work placement is coming to an end.</p>
    <span class="badge">&#x1F5D3; ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Remaining</span>
  </div>
  <div class="body">
    <p style="color:#1e293b;font-size:15px;font-weight:600">Dear ${studentName},</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Your work placement at <strong>${companyName}</strong> is ending in
      <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. Please take the steps below to ensure a smooth completion.
    </p>
    <div class="card">
      <div class="row"><span class="lbl">Company</span><span class="val">${companyName}</span></div>
      <div class="row"><span class="lbl">End Date</span><span class="val">${new Date(endDate).toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
      <div class="row"><span class="lbl">Days Remaining</span><span class="val days">${daysLeft} days</span></div>
    </div>
    <div class="acts">
      <h3>&#x1F4CB; What to do next:</h3>
      <ul>
        <li>Confirm your completion date with your supervisor</li>
        <li>Submit your final timesheet and logbook entries</li>
        <li>Collect any reference letters or certificates</li>
        <li>Contact your placement coordinator if you have concerns</li>
      </ul>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      If you need assistance, contact your placement coordinator${coordinatorName ? ' <strong>' + coordinatorName + '</strong>' : ''}.
    </p>
  </div>
  <div class="ftr"><p><strong>Placement Portal</strong> &mdash; Automated reminder. Do not reply.</p></div>
</div></body></html>`;

const buildText = ({ studentName, companyName, endDate, daysLeft }) =>
  `Dear ${studentName},\n\nYour placement at ${companyName} ends in ${daysLeft} day(s).\nEnd Date: ${new Date(endDate).toLocaleDateString('en-AU')}\n\nNext steps:\n- Confirm end date with supervisor\n- Submit timesheet & logbook\n- Collect reference letters\n- Contact coordinator if needed\n\nRegards,\nPlacement Portal`;

// ─── In-App Notification Fallback: Ending Soon ───────────────────────────────

const saveInAppNotification = async (payload) => {
  try {
    await NotificationModel.create({
      title: `Placement Ending Soon — ${payload.studentName}`,
      desc: `${payload.studentName}'s placement at ${payload.companyName} ends in ${payload.daysLeft} day(s) (${new Date(payload.endDate).toLocaleDateString('en-AU')}).`,
      type: 'system',
      isRead: false,
      link: '/workflow?step=4',
    });
  } catch (err) {
    console.warn('[EmailService] Could not save in-app notification:', err.message);
  }
};

// ─── HTML Template: Placement Started ────────────────────────────────────────

const buildStartedHtml = ({ studentName, companyName, commencementDate, expectedCompletionDate }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f0f4f8;margin:0;padding:0}
.wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#059669,#047857);padding:32px 36px}
.hdr h1{color:#fff;margin:0;font-size:22px}
.hdr p{color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px}
.badge{display:inline-block;background:rgba(255,255,255,.25);color:#fff;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;margin-top:10px}
.body{padding:32px 36px}
.card{background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:20px 24px;margin:0 0 24px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #a7f3d0}
.row:last-child{border-bottom:none}
.lbl{color:#065f46;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.val{color:#1e293b;font-size:13px;font-weight:700}
.acts{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 24px;margin-bottom:24px}
.acts h3{color:#1e293b;font-size:13px;font-weight:700;margin:0 0 8px}
.acts ul{color:#64748b;font-size:13px;margin:0;padding-left:18px;line-height:2}
.ftr{background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0}
.ftr p{color:#94a3b8;font-size:11px;margin:0;line-height:1.6}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <h1>&#x1F680; Placement Started</h1>
    <p>Congratulations! Your placement has officially begun.</p>
    <span class="badge">&#x2705; Placement Confirmed</span>
  </div>
  <div class="body">
    <p style="color:#1e293b;font-size:15px;font-weight:600">Dear ${studentName},</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      We're pleased to confirm that your work placement at <strong>${companyName}</strong> has officially commenced. Welcome to the placement!
    </p>
    <div class="card">
      <div class="row"><span class="lbl">Company</span><span class="val">${companyName}</span></div>
      <div class="row"><span class="lbl">Start Date</span><span class="val">${formatDate(commencementDate)}</span></div>
      ${expectedCompletionDate ? `<div class="row"><span class="lbl">Expected End</span><span class="val">${formatDate(expectedCompletionDate)}</span></div>` : ''}
    </div>
    <div class="acts">
      <h3>&#x1F4CB; Getting started checklist:</h3>
      <ul>
        <li>Confirm your start time and location with your supervisor</li>
        <li>Begin recording your placement hours and logbook entries</li>
        <li>Contact your placement coordinator if you have any questions</li>
        <li>Complete any required induction or onboarding documents</li>
      </ul>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      Good luck with your placement! If you need any assistance, please reach out to your placement coordinator.
    </p>
  </div>
  <div class="ftr"><p><strong>Placement Portal</strong> &mdash; Automated notification. Do not reply.</p></div>
</div></body></html>`;
};

const buildStartedText = ({ studentName, companyName, commencementDate, expectedCompletionDate }) => {
  const fmt = (d) => { if (!d) return 'TBD'; const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-AU'); };
  return `Dear ${studentName},\n\nCongratulations! Your placement at ${companyName} has officially started.\nStart Date: ${fmt(commencementDate)}${expectedCompletionDate ? `\nExpected End: ${fmt(expectedCompletionDate)}` : ''}\n\nChecklist:\n- Confirm start time with supervisor\n- Begin recording hours and logbook\n- Contact coordinator if needed\n\nGood luck!\nPlacement Portal`;
};

// ─── In-App Notification: Placement Started ───────────────────────────────────

const saveStartedInAppNotification = async (payload) => {
  try {
    const dateLabel = payload.commencementDate
      ? (() => { const d = new Date(payload.commencementDate); return isNaN(d.getTime()) ? payload.commencementDate : d.toLocaleDateString('en-AU'); })()
      : 'TBD';
    await NotificationModel.create({
      title: `Placement Started — ${payload.studentName}`,
      desc: `${payload.studentName}'s placement at ${payload.companyName} has commenced on ${dateLabel}.`,
      type: 'system',
      isRead: false,
      link: '/workflow?step=4',
    });
  } catch (err) {
    console.warn('[EmailService] Could not save placement started in-app notification:', err.message);
  }
};

// ─── Send Placement Started Email ─────────────────────────────────────────────

/**
 * sendPlacementStartedEmail
 * Called when an appointment outcome is set to 'successful' and placement begins.
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.studentName
 * @param {string} options.companyName
 * @param {string} options.commencementDate  - ISO date string
 * @param {string} [options.expectedCompletionDate] - ISO date string
 * @param {string} [options.studentId]
 */
export const sendPlacementStartedEmail = async (options) => {
  const { toEmail, studentName, companyName, commencementDate, expectedCompletionDate, studentId } = options;
  const payload = { studentName, companyName, commencementDate, expectedCompletionDate, studentId };

  // Always save in-app notification (non-blocking for the email attempt below)
  await saveStartedInAppNotification(payload);

  if (!toEmail) {
    console.warn('[EmailService] sendPlacementStartedEmail called with NO toEmail — cannot send. Student:', studentName);
    return { sent: false, method: 'none', message: 'No recipient email address was provided.' };
  }

  if (!isSmtpConfigured()) {
    console.log('\n[EmailService] SMTP not configured. Would send placement started email:');
    console.log(`  To: ${toEmail} | Subject: Your placement at ${companyName} has started`);
    return { sent: false, method: 'console', message: 'SMTP not configured. In-app notification saved.' };
  }

  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"Placement Portal" <${from}>`,
      to: toEmail,
      subject: `🚀 Your placement at ${companyName} has started!`,
      text: buildStartedText(payload),
      html: buildStartedHtml(payload),
    });
    console.log(`[EmailService] Placement started email sent to ${toEmail} (${info.messageId})`);
    return { sent: true, method: 'smtp', message: `Email sent to ${toEmail}`, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Placement started email send failed:', err.message);
    return { sent: false, method: 'in-app', message: `Email failed: ${err.message}. In-app notification saved.` };
  }
};

// ─── HTML Template: Placement Outcome (Rejected / Withdrawn / Not Suitable) ──

const OUTCOME_META = {
  industry_rejected: {
    label: 'Industry Did Not Proceed With Placement',
    theme: { grad: '#e11d48,#be123c', bg: '#fff1f2', border: '#fecdd3', label: '#9f1239' },
    emoji: '&#x1F4EC;',
  },
  student_withdrawal: {
    label: 'Placement Withdrawn',
    theme: { grad: '#ea580c,#c2410c', bg: '#fff7ed', border: '#fed7aa', label: '#9a3412' },
    emoji: '&#x21A9;&#xFE0F;',
  },
  not_suitable_site: {
    label: 'Placement Site Not Suitable',
    theme: { grad: '#d97706,#b45309', bg: '#fffbeb', border: '#fcd34d', label: '#92400e' },
    emoji: '&#x26A0;&#xFE0F;',
  },
};

const buildOutcomeHtml = ({ studentName, companyName, outcome, reason }) => {
  const meta = OUTCOME_META[outcome] || {
    label: 'Placement Update',
    theme: { grad: '#64748b,#475569', bg: '#f8fafc', border: '#cbd5e1', label: '#334155' },
    emoji: '&#x2139;&#xFE0F;',
  };
  const { grad, bg, border, label } = meta.theme;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f0f4f8;margin:0;padding:0}
.wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,${grad});padding:32px 36px}
.hdr h1{color:#fff;margin:0;font-size:22px}
.hdr p{color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px}
.body{padding:32px 36px}
.card{background:${bg};border:1px solid ${border};border-radius:10px;padding:20px 24px;margin:0 0 24px}
.lbl{color:${label};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.val{color:#1e293b;font-size:14px;font-weight:700;margin-top:4px}
.reason{color:#334155;font-size:13px;margin-top:4px;line-height:1.6}
.acts{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 24px;margin-bottom:24px}
.acts h3{color:#1e293b;font-size:13px;font-weight:700;margin:0 0 8px}
.acts ul{color:#64748b;font-size:13px;margin:0;padding-left:18px;line-height:2}
.ftr{background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0}
.ftr p{color:#94a3b8;font-size:11px;margin:0;line-height:1.6}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <h1>${meta.emoji} Placement Update</h1>
    <p>${meta.label}</p>
  </div>
  <div class="body">
    <p style="color:#1e293b;font-size:15px;font-weight:600">Dear ${studentName},</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">
      We're writing to update you on your placement application at <strong>${companyName}</strong>.
    </p>
    <div class="card">
      <p class="lbl">Status</p>
      <p class="val">${meta.label}</p>
      ${reason ? `<p class="lbl" style="margin-top:14px">Details</p><p class="reason">${reason}</p>` : ''}
    </div>
    <div class="acts">
      <h3>&#x1F4CB; What happens next:</h3>
      <ul>
        <li>Your placement coordinator has been notified automatically</li>
        <li>They will follow up with you regarding alternative placement options</li>
        <li>Please check your student portal for updates on your placement status</li>
        <li>Contact your placement coordinator if you have any questions</li>
      </ul>
    </div>
  </div>
  <div class="ftr"><p><strong>Placement Portal</strong> &mdash; Automated notification. Do not reply.</p></div>
</div></body></html>`;
};

const buildOutcomeText = ({ studentName, companyName, outcome, reason }) => {
  const meta = OUTCOME_META[outcome] || { label: 'Placement Update' };
  return `Dear ${studentName},\n\nUpdate on your placement at ${companyName}: ${meta.label}\n${reason ? `\nDetails: ${reason}\n` : ''}\nYour placement coordinator will follow up with next steps.\n\nRegards,\nPlacement Portal`;
};

const saveOutcomeInAppNotification = async ({ studentName, companyName, outcome }) => {
  try {
    const meta = OUTCOME_META[outcome] || { label: 'Placement Update' };
    await NotificationModel.create({
      title: `Placement Update — ${studentName}`,
      desc: `${studentName}'s placement at ${companyName}: ${meta.label}`,
      type: 'system',
      isRead: false,
      link: '/workflow?step=4',
    });
  } catch (err) {
    console.warn('[EmailService] Could not save outcome in-app notification:', err.message);
  }
};

/**
 * sendPlacementOutcomeEmail
 * Called when an appointment outcome is set to:
 *   - 'industry_rejected'   → Industry declined the student
 *   - 'student_withdrawal'  → Student withdrew from placement
 *   - 'not_suitable_site'   → Placement site deemed not suitable
 *
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.studentName
 * @param {string} options.companyName
 * @param {string} options.outcome - one of 'industry_rejected' | 'student_withdrawal' | 'not_suitable_site'
 * @param {string} [options.reason]
 * @param {string} [options.studentId]
 */
export const sendPlacementOutcomeEmail = async (options) => {
  const { toEmail, studentName, companyName, outcome, reason, studentId } = options;
  const payload = { studentName, companyName, outcome, reason, studentId };

  await saveOutcomeInAppNotification(payload);

  if (!toEmail) {
    console.warn('[EmailService] sendPlacementOutcomeEmail called with NO toEmail — cannot send. Student:', studentName, 'Outcome:', outcome);
    return { sent: false, method: 'none', message: 'No recipient email address was provided.' };
  }

  if (!isSmtpConfigured()) {
    console.log(`\n[EmailService] SMTP not configured. Would send outcome email (${outcome}) to ${toEmail}`);
    return { sent: false, method: 'console', message: 'SMTP not configured. In-app notification saved.' };
  }

  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const meta = OUTCOME_META[outcome] || { label: 'Placement Update' };
    const info = await transporter.sendMail({
      from: `"Placement Portal" <${from}>`,
      to: toEmail,
      subject: `Placement Update: ${meta.label} — ${companyName}`,
      text: buildOutcomeText(payload),
      html: buildOutcomeHtml(payload),
    });
    console.log(`[EmailService] Outcome email (${outcome}) sent to ${toEmail} (${info.messageId})`);
    return { sent: true, method: 'smtp', message: `Email sent to ${toEmail}`, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Outcome email send failed:', err.message);
    return { sent: false, method: 'in-app', message: `Email failed: ${err.message}. In-app notification saved.` };
  }
};

// ─── Placement Alert Checker ───────────────────────────────────────────────────
// Called on server start + every 24 hours
// Checks all active placements - if end date is within 7 days, sends alert

export const checkAndSendPlacementAlerts = async () => {
  console.log('[PlacementAlerts] Running placement ending-soon check...');

  try {
    // Load all workflows with their appointments and students populated
    const workflows = await WorkflowModel.find().populate('students').lean();

    const now = new Date();

    let alertsSent = 0;
    let alertsSkipped = 0;

    for (const workflow of workflows) {
      const appointments = workflow.appointments || [];

      for (const appt of appointments) {
        // Only active / placed appointments
        if (
          !appt.commencementDate ||
          ['Cancelled', 'Withdrawn', 'Declined', 'No Show', 'Not Suitable Site'].includes(appt.status)
        ) {
          continue;
        }

        const studentId = appt.studentId;
        const studentName = appt.student || 'Student';

        // Single student lookup — used for both end-date calculation and email address
        let cachedStudentDoc = null;
        if (studentId) {
          try {
            const stuQuery = [{ studentId }];
            if (mongoose.Types.ObjectId.isValid(studentId)) stuQuery.push({ _id: studentId });
            cachedStudentDoc = await StudentModel.findOne({ $or: stuQuery }).lean();
          } catch (_) {}
        }

        // Resolve end date — use stored value, or calculate from student hours + availability
        let resolvedEndDate = appt.expectedCompletionDate || '';
        if (!resolvedEndDate && cachedStudentDoc) {
          resolvedEndDate = calculatePlacementEndDate(
            appt.commencementDate,
            cachedStudentDoc.placementHours,
            cachedStudentDoc.availabilityDays,
            cachedStudentDoc.availabilityFrom,
            cachedStudentDoc.availabilityTo
          );
        }

        if (!resolvedEndDate) continue;

        const endDate = new Date(resolvedEndDate);
        if (isNaN(endDate.getTime())) continue;

        const diffMs = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Only alert if within 7 days and end date hasn't passed
        if (daysLeft < 0 || daysLeft > 7) continue;

        // ── Persistent deduplication ────────────────────────────────────
        // Only send one alert per 23 hours (slightly under 24h to handle
        // scheduler drift). We check the DB field so this survives restarts.
        if (appt.endingAlertSentAt) {
          const lastSent = new Date(appt.endingAlertSentAt);
          const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLast < 23) {
            alertsSkipped++;
            console.log(`[PlacementAlerts] Skipping ${studentName} — alert already sent ${Math.round(hoursSinceLast)}h ago`);
            continue;
          }
        }

        // Resolve student email from appointment or student doc
        let toEmail = appt.email || cachedStudentDoc?.emailAddress || cachedStudentDoc?.email || '';

        if (!toEmail) {
          console.log(`[PlacementAlerts] No email found for ${studentName}, skipping`);
          continue;
        }

        try {
          await sendPlacementEndingSoonEmail({
            toEmail,
            studentName,
            companyName: appt.company || 'the placement site',
            endDate: resolvedEndDate,
            daysLeft,
            coordinatorName: appt.interviewer || '',
            studentId: studentId || '',
            internshipId: String(appt._id || appt.apptId || ''),
          });

          // Persist the timestamp so we don't re-alert on the next server restart
          await WorkflowModel.updateOne(
            { 'appointments._id': appt._id },
            { $set: { 'appointments.$.endingAlertSentAt': now } }
          );
          // Also update the standalone AppointmentModel if it exists
          try {
            if (appt._id && mongoose.Types.ObjectId.isValid(appt._id)) {
              await AppointmentModel.findByIdAndUpdate(appt._id, { endingAlertSentAt: now });
            } else if (appt.apptId) {
              await AppointmentModel.updateOne({ apptId: appt.apptId }, { endingAlertSentAt: now });
            }
          } catch (_) {}

          alertsSent++;
          console.log(`[PlacementAlerts] Alert sent for ${studentName} at ${appt.company} — ${daysLeft} day(s) left`);
        } catch (sendErr) {
          console.error(`[PlacementAlerts] Failed to alert ${studentName}:`, sendErr.message);
        }
      }
    }

    console.log(`[PlacementAlerts] Done. Sent: ${alertsSent}, Skipped (already alerted): ${alertsSkipped}`);
    return { alertsSent, alertsSkipped };
  } catch (err) {
    console.error('[PlacementAlerts] Check failed:', err.message);
    return { alertsSent: 0, error: err.message };
  }
};

// ─── Send Placement Ending Soon Email ─────────────────────────────────────────

/**
 * sendPlacementEndingSoonEmail
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.studentName
 * @param {string} options.companyName
 * @param {string} options.endDate      - ISO date string
 * @param {number} options.daysLeft
 * @param {string} [options.coordinatorName]
 * @param {string} [options.studentId]
 * @param {string} [options.internshipId]
 */
export const sendPlacementEndingSoonEmail = async (options) => {
  const { toEmail, studentName, companyName, endDate, daysLeft, coordinatorName, studentId, internshipId } = options;
  const payload = { studentName, companyName, endDate, daysLeft, coordinatorName, studentId, internshipId };

  // Always save in-app notification
  await saveInAppNotification(payload);

  if (!isSmtpConfigured()) {
    console.log('\n[EmailService] SMTP not configured. Would send:');
    console.log(`  To: ${toEmail} | Subject: Placement ending soon (${daysLeft} days)`);
    return { sent: false, method: 'console', message: 'SMTP not configured. In-app notification saved.' };
  }

  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"Placement Portal" <${from}>`,
      to: toEmail,
      subject: `⏰ Your placement at ${companyName} ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      text: buildText(payload),
      html: buildHtml(payload),
    });
    console.log(`[EmailService] Email sent to ${toEmail} (${info.messageId})`);
    return { sent: true, method: 'smtp', message: `Email sent to ${toEmail}`, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Send failed:', err.message);
    return { sent: false, method: 'in-app', message: `Email failed: ${err.message}. In-app notification saved.` };
  }
};

// ─── Send Payment Tax Invoice Email ──────────────────────────────────────────

/**
 * sendPaymentInvoiceEmail
 * Called when payment status is updated to 'Invoice Sent'
 * Sends formatted Tax Invoice HTML email to RTO contact email & student email.
 * Also creates an In-App Notification.
 *
 * @param {Object} payment - Payment model object
 */
export const sendPaymentInvoiceEmail = async (payment) => {
  try {
    let recipientEmails = [];

    // 1. Resolve student email
    if (payment.student) {
      const studentDoc = await StudentModel.findById(payment.student).lean();
      if (studentDoc && studentDoc.emailAddress) {
        recipientEmails.push(studentDoc.emailAddress);
      }
    }

    // 2. Resolve RTO contact email
    if (payment.rto) {
      const rtoDoc = await RtoModel.findOne({
        name: new RegExp('^' + payment.rto.trim() + '$', 'i'),
      }).lean();
      if (rtoDoc && rtoDoc.contactEmail) {
        recipientEmails.push(rtoDoc.contactEmail);
      }
    }

    // Clean & deduplicate recipient emails
    recipientEmails = [...new Set(recipientEmails.filter(Boolean))];

    // Build Invoice Details
    const cleanId = String(payment.studentId || payment._id)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-5)
      .toUpperCase();
    const invNum = `INV-${new Date().getFullYear()}-${cleanId}`;
    const subtotal = payment.paymentAmount || 0;
    const gst = Number((subtotal * 0.10).toFixed(2));
    const totalDue = Number((subtotal + gst).toFixed(2));

    // Create In-App Notification
    await NotificationModel.create({
      title: `Tax Invoice Sent — ${invNum}`,
      desc: `Tax invoice ${invNum} of AUD $${totalDue.toFixed(
        2
      )} sent for ${payment.studentName} (${payment.rto || 'RTO'}).`,
      type: 'system',
      isRead: false,
      link: '/workflow?step=5',
    });

    if (recipientEmails.length === 0) {
      console.log(
        `[EmailService] Tax Invoice ${invNum} created for ${payment.studentName}. In-app notification created.`
      );
      return {
        sent: false,
        method: 'in-app',
        message: 'Invoice created. In-app notification saved.',
      };
    }

    const htmlBody = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;color:#1e293b}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05)}
.hdr{background:#0f172a;padding:24px 32px;color:#fff;display:flex;justify-content:space-between;align-items:center}
.body{padding:32px}
.inv-badge{display:inline-block;padding:4px 12px;background:#dbeafe;color:#1e40af;font-weight:700;border-radius:20px;font-size:11px;text-transform:uppercase}
.tbl{width:100%;border-collapse:collapse;margin:20px 0}
.tbl th{background:#f1f5f9;padding:10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase}
.tbl td{padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px}
.total-box{background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-top:20px}
.ftr{background:#f1f5f9;padding:16px 32px;text-align:center;font-size:11px;color:#64748b}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div>
      <h2 style="margin:0;font-size:18px">Placement Portal Services</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">ABN: 48 123 456 789</p>
    </div>
    <div style="text-align:right">
      <h3 style="margin:0;font-size:16px;color:#38bdf8">TAX INVOICE</h3>
      <p style="margin:4px 0 0;font-size:13px;font-family:monospace">${invNum}</p>
    </div>
  </div>
  <div class="body">
    <div style="margin-bottom:20px">
      <span class="inv-badge">Status: Invoice Sent</span>
      <p style="margin:12px 0 0;font-size:14px"><strong>Billed To:</strong> ${payment.rto || 'Registered Training Organisation'}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b">Student: <strong>${payment.studentName}</strong> (ID: ${payment.studentId || 'N/A'})</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b">Course: ${payment.course || 'Vocational Placement'}</p>
    </div>
    <table class="tbl">
      <thead>
        <tr><th>Description</th><th style="text-align:center">Tier</th><th style="text-align:right">Amount (AUD)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Vocational Student Placement Fee — ${payment.studentName}<br><small style="color:#64748b">${payment.placementStatus}</small></td>
          <td style="text-align:center"><strong>${payment.chargePercentage}%</strong></td>
          <td style="text-align:right;font-weight:700">$${subtotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    <div class="total-box">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
        <span>Subtotal (Excl. GST):</span><strong>AUD $${subtotal.toFixed(2)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
        <span>GST (10%):</span><strong>AUD $${gst.toFixed(2)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:8px;font-size:15px;color:#0f172a">
        <span><strong>Total Amount Due:</strong></span><strong style="color:#2563eb">AUD $${totalDue.toFixed(2)}</strong>
      </div>
    </div>
    <div style="margin-top:24px;padding:12px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1e40af">
      <strong>EFT Remittance Details:</strong><br>
      Bank: Commonwealth Bank of Australia | BSB: 062-000 | Acc: 1234 5678 | Ref: ${invNum}
    </div>
  </div>
  <div class="ftr">
    <p>Terms: Net 14 Days. Thank you for partnering with Placement Portal.</p>
  </div>
</div></body></html>`;

    if (!isSmtpConfigured()) {
      console.log(
        `\n[EmailService] SMTP not configured. Would send Tax Invoice email (${invNum}) to: ${recipientEmails.join(
          ', '
        )}`
      );
      return {
        sent: false,
        method: 'console',
        message: `Tax Invoice ${invNum} generated & logged. In-app notification created.`,
      };
    }

    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"Placement Portal Billing" <${from}>`,
      to: recipientEmails.join(','),
      subject: `📄 Tax Invoice Generated: ${invNum} — ${payment.studentName}`,
      html: htmlBody,
    });

    console.log(
      `[EmailService] Tax Invoice ${invNum} sent to ${recipientEmails.join(
        ', '
      )} (${info.messageId})`
    );
    return {
      sent: true,
      method: 'smtp',
      message: `Invoice sent to ${recipientEmails.join(', ')}`,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error('[EmailService] sendPaymentInvoiceEmail error:', err.message);
    return { sent: false, method: 'error', message: err.message };
  }
};

export { isSmtpConfigured };