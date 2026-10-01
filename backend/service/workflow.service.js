import mongoose from "mongoose";
import WorkflowModel, {
  InternshipRequestModel,
  AppointmentModel,
  InternshipModel,
} from "../model/workflow.model.js";
import StudentModel from "../model/student.model.js";
import NotificationModel from "../model/notification.model.js";
import { sendPlacementStartedEmail, sendPlacementOutcomeEmail } from "./email.service.js";

// ===== ID Generators =====
const generateReqId = async () => {
  const prefix = "REQ";
  const lastReq = await InternshipRequestModel.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastReq?.reqId) {
    const lastNumber = parseInt(lastReq.reqId.split("-")[1], 10);
    if (!Number.isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${newIdNumber.toString().padStart(6, "0")}`;
};

const generateApptId = async () => {
  const prefix = "APPT";
  const lastAppt = await AppointmentModel.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastAppt?.apptId) {
    const lastNumber = parseInt(lastAppt.apptId.split("-")[1], 10);
    if (!Number.isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${newIdNumber.toString().padStart(6, "0")}`;
};

const generateIntId = async () => {
  const prefix = "INT";
  const lastInt = await InternshipModel.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastInt?.intId) {
    const lastNumber = parseInt(lastInt.intId.split("-")[1], 10);
    if (!Number.isNaN(lastNumber)) {
      newIdNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${newIdNumber.toString().padStart(6, "0")}`;
};

// ===== Workflow CRUD =====
export const createWorkflow = async (workflowData) => {
  const workflow = await WorkflowModel.create(workflowData);
  return workflow;
};

export const getAllWorkflows = async () => {
  return await WorkflowModel.find().sort({ createdAt: -1 }).populate("students");
};

export const getWorkflowById = async (id) => {
  return await WorkflowModel.findById(id).populate("students");
};

export const updateWorkflow = async (id, workflowData) => {
  return await WorkflowModel.findByIdAndUpdate(id, workflowData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("students");
};

export const deleteWorkflow = async (id) => {
  return await WorkflowModel.findByIdAndDelete(id);
};

// ===== Workflow Step Management =====
export const updateWorkflowStep = async (id, step) => {
  return await WorkflowModel.findByIdAndUpdate(
    id,
    { currentStep: step },
    { returnDocument: "after", runValidators: true }
  );
};

// ===== Students in Workflow =====
export const addStudentsToWorkflow = async (workflowId, studentIds) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found while updating placement request ${normalizedId}`);
  }

  const existingIds = workflow.students.map((s) => s.toString());
  const newIds = studentIds.filter((id) => !existingIds.includes(id));
  workflow.students.push(...newIds);
  await workflow.save({ validateBeforeSave: false });
  return await WorkflowModel.findById(workflowId).populate("students");
};

export const removeStudentFromWorkflow = async (workflowId, studentId) => {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  workflow.students = workflow.students.filter(
    (s) => s.toString() !== studentId
  );
  await workflow.save({ validateBeforeSave: false });
  return await WorkflowModel.findById(workflowId).populate("students");
};

// ===== Internship Requests (Step 2) =====
export const createInternshipRequest = async (workflowId, requestData) => {
  if (!requestData.reqId) {
    requestData.reqId = await generateReqId();
  }
  const request = await InternshipRequestModel.create(requestData);

  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) return null;

  workflow.requests.push(request);
  await workflow.save({ validateBeforeSave: false });

  // ── Set student placementStatus → "In Progress" ───────────────────────
  try {
    const stuQuery = [];
    if (requestData.studentId) {
      stuQuery.push({ studentId: requestData.studentId });
      if (mongoose.Types.ObjectId.isValid(requestData.studentId)) {
        stuQuery.push({ _id: requestData.studentId });
      }
    }
    if (stuQuery.length > 0) {
      await StudentModel.findOneAndUpdate(
        { $or: stuQuery },
        { placementStatus: "In Progress" },
        { runValidators: false }
      );
    }
  } catch (psErr) {
    console.warn("[Workflow] placementStatus→InProgress update skipped:", psErr.message);
  }
  // ─────────────────────────────────────────────────────────────────────

  // Trigger Notification
  try {
    await NotificationModel.create({
      title: "New Internship Request",
      desc: `${request.student} applied for ${request.title || "placement"} at ${request.company}`,
      type: "request",
      link: "/workflow?step=2",
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return request;
};

// FIXED: previously this function replaced the whole subdocument with a
// spread-plain-object built from validated data that ALWAYS included every
// zod-default field (rto: "", workType: "", status: "New", priority:
// "Normal", notes: "" ...) even when the caller only wanted to push a
// contacted-industry record. That silently wiped out real request data on
// every "Add Industry" click and could return null (404) if anything
// downstream choked. Now we only ever touch the subdocument fields that
// were actually passed in `requestData`, and we push contacts without
// touching anything else.
export const updateInternshipRequest = async (workflowId, requestId, requestData) => {
  const normalizedId = String(requestId || "").trim();
  let workflow = null;

  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne({
      $or: [
        { "requests._id": normalizedId },
        { "requests.reqId": normalizedId },
        { "requests.id": normalizedId },
      ],
    });
  }
  if (!workflow) return null;

  const requestIndex = workflow.requests.findIndex((r) => {
    return (
      String(r._id) === normalizedId ||
      (r.reqId && r.reqId === normalizedId) ||
      (r.id && String(r.id) === normalizedId)
    );
  });
  if (requestIndex === -1) {
    throw new Error(`Placement request ${normalizedId} was not found in the workflow`);
  }

  const matchedRequest = workflow.requests[requestIndex];
  const actualDbId = matchedRequest._id;

  const { contactedIndustries: newContacts, ...otherFields } = requestData || {};
  const requestChanges = Object.entries(otherFields)
    .filter(([field]) => field !== 'updatedBy')
    .flatMap(([field, value]) => {
      const before = matchedRequest[field];
      if (JSON.stringify(before ?? null) === JSON.stringify(value ?? null)) return [];
      return [{ field, from: before ?? null, to: value ?? null }];
    });
  if (Array.isArray(newContacts) && newContacts.length > 0) {
    requestChanges.push({
      field: 'Contacted Industries',
      from: matchedRequest.contactedIndustries.length,
      to: matchedRequest.contactedIndustries.length + newContacts.length,
    });
  }

  // Push new contact records — never overwrite the existing array
  if (Array.isArray(newContacts) && newContacts.length > 0) {
    matchedRequest.contactedIndustries.push(...newContacts);
  }

  Object.keys(otherFields).forEach((key) => {
    if (key === 'updatedBy') return;
    matchedRequest[key] = otherFields[key];
  });
  if (requestChanges.length > 0) {
    matchedRequest.changeHistory.push({
      changedAt: new Date(),
      changedBy: String(requestData?.updatedBy || 'User'),
      changes: requestChanges,
    });
  }

  await workflow.save({ validateBeforeSave: false });

  if (Array.isArray(newContacts) && newContacts.length > 0 && matchedRequest.studentId) {
    try {
      const studentQuery = [{ studentId: matchedRequest.studentId }];
      if (mongoose.Types.ObjectId.isValid(matchedRequest.studentId)) {
        studentQuery.push({ _id: matchedRequest.studentId });
      }
      await StudentModel.findOneAndUpdate(
        {
          $and: [
            { $or: studentQuery },
            { placementStatus: { $in: ["Awaiting", "In Progress"] } },
          ],
        },
        { placementStatus: "Industry Contacted" },
        { runValidators: false }
      );
    } catch (statusErr) {
      console.warn("[Workflow] placementStatus→IndustryContacted update skipped:", statusErr.message);
    }
  }

  try {
    if (actualDbId && mongoose.Types.ObjectId.isValid(actualDbId)) {
      if (Array.isArray(newContacts) && newContacts.length > 0) {
        await InternshipRequestModel.findByIdAndUpdate(
          actualDbId,
          { $push: { contactedIndustries: { $each: newContacts } } },
          { runValidators: false }
        );
      }
      if (Object.keys(otherFields).some((key) => key !== 'updatedBy')) {
        const { updatedBy, ...persistedFields } = otherFields;
        await InternshipRequestModel.findByIdAndUpdate(actualDbId, {
          $set: persistedFields,
          ...(requestChanges.length ? { $push: { changeHistory: matchedRequest.changeHistory[matchedRequest.changeHistory.length - 1] } } : {}),
        }, { runValidators: false });
      } else if (requestChanges.length) {
        await InternshipRequestModel.findByIdAndUpdate(actualDbId, {
          $push: { changeHistory: matchedRequest.changeHistory[matchedRequest.changeHistory.length - 1] },
        }, { runValidators: false });
      }
    } else if (matchedRequest.reqId) {
      if (Array.isArray(newContacts) && newContacts.length > 0) {
        await InternshipRequestModel.updateOne(
          { reqId: matchedRequest.reqId },
          { $push: { contactedIndustries: { $each: newContacts } } }
        );
      }
      if (Object.keys(otherFields).some((key) => key !== 'updatedBy')) {
        const { updatedBy, ...persistedFields } = otherFields;
        if (Object.keys(persistedFields).length > 0) {
          await InternshipRequestModel.updateOne(
            { reqId: matchedRequest.reqId },
            { $set: persistedFields }
          );
        }
      }
      if (requestChanges.length > 0) {
        await InternshipRequestModel.updateOne(
          { reqId: matchedRequest.reqId },
          { $push: { changeHistory: matchedRequest.changeHistory[matchedRequest.changeHistory.length - 1] } }
        );
      }
    }
  } catch (dbErr) {
    console.warn("InternshipRequestModel sync skipped:", dbErr.message);
  }

  return workflow.requests[requestIndex];
};

export const deleteInternshipRequest = async (workflowId, requestId) => {
  const normalizedId = String(requestId || '').trim();
  let workflow = null;

  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne({
      $or: [
        { "requests._id": normalizedId },
        { "requests.reqId": normalizedId },
        { "requests.id": normalizedId },
      ],
    });
  }
  if (!workflow) {
    try {
      if (mongoose.Types.ObjectId.isValid(normalizedId)) {
        await InternshipRequestModel.findByIdAndDelete(normalizedId);
      } else {
        await InternshipRequestModel.deleteOne({ reqId: normalizedId });
      }
    } catch (e) {}
    return { success: true };
  }

  const requestIndex = workflow.requests.findIndex(
    (r) =>
      String(r._id) === normalizedId ||
      (r.reqId && r.reqId === normalizedId) ||
      (r.id && String(r.id) === normalizedId)
  );

  let removed = null;
  if (requestIndex !== -1) {
    [removed] = workflow.requests.splice(requestIndex, 1);
    await workflow.save({ validateBeforeSave: false });
  }

  try {
    const idToDelete = removed?._id || normalizedId;
    if (mongoose.Types.ObjectId.isValid(idToDelete)) {
      await InternshipRequestModel.findByIdAndDelete(idToDelete);
    } else {
      await InternshipRequestModel.deleteOne({ reqId: removed?.reqId || normalizedId });
    }
  } catch (dbErr) {
    console.warn("InternshipRequestModel delete sync skipped:", dbErr.message);
  }

  return removed || { success: true };
};

// ===== Appointments (Step 3) =====
export const createAppointment = async (workflowId, appointmentData) => {
  if (!appointmentData.apptId) {
    appointmentData.apptId = await generateApptId();
  }

  // Auto-resolve contactPerson and industryType if not directly supplied
  if (!appointmentData.contactPerson || !appointmentData.industryType) {
    try {
      const checkWf = (workflowId && mongoose.Types.ObjectId.isValid(workflowId))
        ? await WorkflowModel.findById(workflowId)
        : await WorkflowModel.findOne().sort({ createdAt: -1 });
      if (checkWf && checkWf.requests) {
        const studentId = appointmentData.studentId;
        const studentName = (appointmentData.student || '').trim().toLowerCase();
        const companyName = (appointmentData.company || '').trim().toLowerCase();
        checkWf.requests.forEach((req) => {
          const isStudentMatch =
            (studentId && (req.studentId === studentId || req.id === studentId)) ||
            (studentName && req.student && req.student.trim().toLowerCase() === studentName);
          if (isStudentMatch && Array.isArray(req.contactedIndustries)) {
            req.contactedIndustries.forEach((ci) => {
              const orgName = (ci.organizationName || '').trim().toLowerCase();
              if (
                (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) ||
                (appointmentData.industryContactId && (ci._id?.toString() === appointmentData.industryContactId || ci.id === appointmentData.industryContactId))
              ) {
                if (!appointmentData.contactPerson && ci.contactPerson) appointmentData.contactPerson = ci.contactPerson;
                if (!appointmentData.industryType && ci.industryType) appointmentData.industryType = ci.industryType;
              }
            });
          }
        });
      }
    } catch (_) {}
  }

  let appointment = null;
  try {
    appointment = await AppointmentModel.create(appointmentData);
  } catch (e) {
    appointment = appointmentData;
  }

  let workflow = null;
  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne().sort({ createdAt: -1 });
  }
  if (!workflow) return appointment;

  // Dynamically update contacted industry response to 'Appointment Scheduled'
  if (workflow.requests && workflow.requests.length > 0) {
    const studentId = appointment.studentId;
    const studentName = (appointment.student || '').trim().toLowerCase();
    const companyName = (appointment.company || '').trim().toLowerCase();

    workflow.requests.forEach((req) => {
      const isStudentMatch =
        (studentId && (req.studentId === studentId || req.id === studentId)) ||
        (studentName && req.student && req.student.trim().toLowerCase() === studentName);

      if (isStudentMatch && Array.isArray(req.contactedIndustries)) {
        req.contactedIndustries.forEach((ci) => {
          const orgName = (ci.organizationName || '').trim().toLowerCase();
          if (
            (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) ||
            (appointment.industryContactId && (ci._id?.toString() === appointment.industryContactId || ci.id === appointment.industryContactId))
          ) {
            ci.response = 'Appointment Scheduled';
          }
        });
      }
    });
  }

  workflow.appointments.push(appointment);
  await workflow.save({ validateBeforeSave: false });

  try {
    const studentQuery = [];
    if (appointment.studentId) {
      studentQuery.push({ studentId: appointment.studentId });
      if (mongoose.Types.ObjectId.isValid(appointment.studentId)) {
        studentQuery.push({ _id: appointment.studentId });
      }
    }
    if (studentQuery.length > 0) {
      const studentDoc = await StudentModel.findOne({ $or: studentQuery });
      if (studentDoc && Array.isArray(studentDoc.contactedIndustries)) {
        const companyName = (appointment.company || '').trim().toLowerCase();
        let updatedStudent = false;
        studentDoc.contactedIndustries.forEach((ci) => {
          const orgName = (ci.organizationName || '').trim().toLowerCase();
          if (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) {
            ci.response = 'Appointment Scheduled';
            updatedStudent = true;
          }
        });
        if (updatedStudent) await studentDoc.save();
      }
    }
  } catch (syncErr) {
    console.warn('Sync student contactedIndustries skipped:', syncErr.message);
  }

  // ── Set student placementStatus → "Appointment Scheduled" ────────────
  try {
    const stuQuery = [];
    if (appointment.studentId) {
      stuQuery.push({ studentId: appointment.studentId });
      if (mongoose.Types.ObjectId.isValid(appointment.studentId)) {
        stuQuery.push({ _id: appointment.studentId });
      }
    }
    if (stuQuery.length > 0) {
      await StudentModel.findOneAndUpdate(
        { $or: stuQuery },
        { placementStatus: "Appointment Scheduled" },
        { runValidators: false }
      );
    }
  } catch (psErr) {
    console.warn("[Workflow] placementStatus→AppointmentScheduled update skipped:", psErr.message);
  }
  // ─────────────────────────────────────────────────────────────────────

  try {
    await NotificationModel.create({
      title: "Appointment Scheduled",
      desc: `Interview scheduled for ${appointment.student} at ${appointment.company} on ${appointment.date}`,
      type: "appointment",
      link: "/workflow?step=3",
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return appointment;
};

/**
 * Resolve the student's email + Mongo document for a given appointment.
 * Tries: appointment's own email field first, then looks up the Student
 * collection by studentId (business ID or Mongo _id).
 * Never throws — returns { studentDoc: null, email: '' } on any failure.
 */
const resolveStudentAndEmail = async (appt) => {
  const studentId = appt.studentId;
  let studentDoc = null;

  try {
    const stuQuery = [];
    if (studentId) {
      stuQuery.push({ studentId });
      if (mongoose.Types.ObjectId.isValid(studentId)) stuQuery.push({ _id: studentId });
    }
    if (stuQuery.length > 0) {
      studentDoc = await StudentModel.findOne({ $or: stuQuery });
    }
  } catch (findErr) {
    console.warn('[Workflow] Student lookup failed:', findErr.message);
  }

  const email = appt.email || studentDoc?.emailAddress || studentDoc?.email || '';
  return { studentDoc, email };
};

export const updateAppointment = async (workflowId, appointmentId, appointmentData) => {
  const normalizedId = String(appointmentId || '').trim();
  let workflow = null;

  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne({
      $or: [
        { "appointments._id": normalizedId },
        { "appointments.apptId": normalizedId },
        { "appointments.id": normalizedId },
      ],
    });
  }
  if (!workflow) return null;

  const appointmentIndex = workflow.appointments.findIndex(
    (a) =>
      String(a._id) === normalizedId ||
      (a.apptId && a.apptId === normalizedId) ||
      (a.id && String(a.id) === normalizedId)
  );
  if (appointmentIndex === -1) return null;

  const appt = workflow.appointments[appointmentIndex];
  const actualDbId = appt._id;

  Object.assign(workflow.appointments[appointmentIndex], appointmentData);
  await workflow.save({ validateBeforeSave: false });

  // ── Side-effects: PLACEMENT STARTED (outcome = successful) ─────────────────
  if (
    appointmentData.status === 'Confirmed' &&
    appointmentData.appointmentOutcome === 'successful'
  ) {
    const studentId = appt.studentId;
    const studentName = (appt.student || '').trim().toLowerCase();
    const companyName = (appt.company || '').trim().toLowerCase();

    // 1. Update contactedIndustries response → 'Placement Started' on all matching requests
    if (workflow.requests && workflow.requests.length > 0) {
      workflow.requests.forEach((req) => {
        const isStudentMatch =
          (studentId && (req.studentId === studentId || req.id === studentId)) ||
          (studentName && req.student && req.student.trim().toLowerCase() === studentName);

        if (isStudentMatch && Array.isArray(req.contactedIndustries)) {
          req.contactedIndustries.forEach((ci) => {
            const orgName = (ci.organizationName || '').trim().toLowerCase();
            if (
              (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) ||
              (appt.industryContactId && (ci._id?.toString() === appt.industryContactId || ci.id === appt.industryContactId))
            ) {
              ci.response = 'Placement Started';
            }
          });
        }
      });
      await workflow.save({ validateBeforeSave: false });
    }

    // 2. Look up the student record — used for both status update AND the email address.
    //    IMPORTANT: this lookup + the email send are NOT nested inside the same
    //    try/catch as studentDoc.save(). If the save() fails for any reason
    //    (validation, cast error, etc.) the email must still be attempted —
    //    a DB write failure should never silently block a notification.
    const { studentDoc, email: toEmail } = await resolveStudentAndEmail(appt);

    if (studentDoc) {
      // 2a. Sync contactedIndustries responses on the Student doc — failure here
      //     is logged but does NOT stop the email below
      try {
        if (Array.isArray(studentDoc.contactedIndustries)) {
          studentDoc.contactedIndustries.forEach((ci) => {
            const orgName = (ci.organizationName || '').trim().toLowerCase();
            if (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) {
              ci.response = 'Placement Started';
            }
          });
        }
        // Set placementStatus → "Placement Started" — a confirmed successful appointment
        // means the placement has started. This is the single authoritative write;
        // updateInternship will later set it to "Placement Completed" when the end date arrives.
        studentDoc.placementStatus = 'Placement Started';
        await studentDoc.save();
      } catch (saveErr) {
        console.error(
          '[Workflow] Student contactedIndustries save FAILED (email will still be attempted):',
          saveErr.message
        );
      }
    } else {
      console.warn(
        '[Workflow] No student record found for placement-started email — studentId:',
        studentId,
        'studentName:',
        appt.student
      );
      // Fallback: try direct update by studentId / _id
      try {
        const stuQuery = [];
        if (studentId) {
          stuQuery.push({ studentId });
          if (mongoose.Types.ObjectId.isValid(studentId)) stuQuery.push({ _id: studentId });
        }
        if (stuQuery.length > 0) {
          await StudentModel.findOneAndUpdate(
            { $or: stuQuery },
            { placementStatus: 'Placement Started' },
            { runValidators: false }
          );
        }
      } catch (fbErr) {
        console.warn('[Workflow] placementStatus→PlacementStarted fallback update skipped:', fbErr.message);
      }
    }

    // 2b. Send placement started email — always attempted regardless of the save() result above
    const commDate = appointmentData.commencementDate || appt.commencementDate || '';
    const endDate = appointmentData.expectedCompletionDate || appt.expectedCompletionDate || '';

    console.log('[Workflow] Placement-started email attempt →', {
      student: appt.student,
      company: appt.company,
      toEmail: toEmail || '(missing)',
    });

    if (toEmail) {
      try {
        const emailResult = await sendPlacementStartedEmail({
          toEmail,
          studentName: appt.student || studentDoc?.name || 'Student',
          companyName: appt.company || 'the placement site',
          commencementDate: commDate,
          expectedCompletionDate: endDate,
          studentId: studentId || '',
        });
        console.log('[Workflow] Placement-started email result:', emailResult);
      } catch (emailErr) {
        console.error('[Workflow] Placement-started email FAILED to send:', emailErr.message);
      }
    } else {
      console.warn(
        '[Workflow] Skipped placement-started email — no email address available for',
        appt.student
      );
    }

    // 3. Create in-app notification
    try {
      await NotificationModel.create({
        title: 'Placement Started',
        desc: `${appt.student} has started placement at ${appt.company}.`,
        type: 'system',
        isRead: false,
        link: '/workflow?step=4',
      });
    } catch (notifErr) {
      console.warn('[Workflow] Placement started notification failed:', notifErr.message);
    }
  }
  // ── End of PLACEMENT STARTED side-effects ───────────────────────────────

  // ── Side-effects: PLACEMENT OUTCOME = REJECTED / WITHDRAWN / MISSED / NOT SUITABLE ──
  else if (
    ['industry_rejected', 'student_withdrawal', 'student_missed', 'not_suitable_site'].includes(
      appointmentData.appointmentOutcome
    ) ||
    ['Industry Rejected', 'Student Withdraw', 'Student Missed Appointment', 'Withdrawn', 'No Show', 'Not Suitable Site'].includes(
      appointmentData.status
    )
  ) {
    const outcome = appointmentData.appointmentOutcome ||
      (appointmentData.status === 'Industry Rejected' ? 'industry_rejected' :
       appointmentData.status === 'Student Withdraw' || appointmentData.status === 'Withdrawn' ? 'student_withdrawal' :
       appointmentData.status === 'Student Missed Appointment' || appointmentData.status === 'No Show' ? 'student_missed' : 'not_suitable_site');

    const outcomeStatusLabel =
      outcome === 'industry_rejected' ? 'Industry Rejected' :
      outcome === 'student_withdrawal' ? 'Student Withdraw' :
      outcome === 'not_suitable_site' ? 'Not Suitable Site' :
      outcome === 'student_missed' ? 'Student Missed Appointment' : 'Industry Rejected';

    const studentName = (appt.student || '').trim().toLowerCase();
    const companyName = (appt.company || '').trim().toLowerCase();
    const studentId = appt.studentId;

    // 1. Maintain placement request in workflow — DO NOT DELETE REQUEST!
    // Update the request status and contactedIndustries response
    if (workflow.requests && workflow.requests.length > 0) {
      workflow.requests.forEach((req) => {
        const isStudentMatch =
          (studentId && (req.studentId === studentId || req.id === studentId)) ||
          (studentName && req.student && req.student.trim().toLowerCase() === studentName);

        if (isStudentMatch) {
          req.status = outcomeStatusLabel;
          req.returnedToStep1 = true;
          if (Array.isArray(req.contactedIndustries)) {
            req.contactedIndustries.forEach((ci) => {
              const orgName = (ci.organizationName || '').trim().toLowerCase();
              if (
                (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) ||
                (appt.industryContactId && (ci._id?.toString() === appt.industryContactId || ci.id === appt.industryContactId))
              ) {
                ci.response = outcomeStatusLabel;
              }
            });
          }
        }
      });
      await workflow.save({ validateBeforeSave: false });
    }

    // 2. Look up student and update placementStatus to outcomeStatusLabel WITHOUT removing coordinator!
    const { studentDoc, email: toEmail } = await resolveStudentAndEmail(appt);

    if (studentDoc) {
      try {
        studentDoc.placementStatus = outcomeStatusLabel;
        if (Array.isArray(studentDoc.contactedIndustries)) {
          studentDoc.contactedIndustries.forEach((ci) => {
            const orgName = (ci.organizationName || '').trim().toLowerCase();
            if (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) {
              ci.response = outcomeStatusLabel;
            }
          });
        }
        await studentDoc.save({ validateModifiedOnly: true });
      } catch (psSaveErr) {
        console.warn('[Workflow] Student placementStatus save skipped:', psSaveErr.message);
      }
    } else {
      // Fallback: try direct update by studentId / _id
      try {
        const stuQuery = [];
        if (appt.studentId) {
          stuQuery.push({ studentId: appt.studentId });
          if (mongoose.Types.ObjectId.isValid(appt.studentId)) stuQuery.push({ _id: appt.studentId });
        }
        if (stuQuery.length > 0) {
          await StudentModel.findOneAndUpdate(
            { $or: stuQuery },
            { placementStatus: outcomeStatusLabel },
            { runValidators: false }
          );
        }
      } catch (psErr) {
        console.warn('[Workflow] Student placementStatus fallback update skipped:', psErr.message);
      }
    }

    // 3. Keep appointment in Step 3 with updated status
    if (workflow.appointments[appointmentIndex]) {
      workflow.appointments[appointmentIndex].status = outcomeStatusLabel;
      workflow.appointments[appointmentIndex].appointmentOutcome = outcome;
      workflow.appointments[appointmentIndex].cancellationReason = appointmentData.notes || appointmentData.cancellationReason || '';
      await workflow.save({ validateBeforeSave: false });
    }

    console.log('[Workflow] Placement-outcome processed →', {
      outcome,
      student: appt.student,
      company: appt.company,
    });

    if (toEmail) {
      try {
        await sendPlacementOutcomeEmail({
          toEmail,
          studentName: appt.student || studentDoc?.name || 'Student',
          companyName: appt.company || 'the placement site',
          outcome,
          reason: appointmentData.cancellationReason || appointmentData.notes || appt.cancellationReason || '',
          studentId: appt.studentId || '',
        });
      } catch (emailErr) {
        console.error('[Workflow] Placement-outcome email error:', emailErr.message);
      }
    }

    // 4. In-app notification
    try {
      const OUTCOME_TITLE = {
        industry_rejected: 'Industry Rejected Student - Returned to Step 1',
        student_withdrawal: 'Student Withdrew - Returned to Step 1',
        student_missed: 'Student Missed Appointment - Returned to Step 1',
        not_suitable_site: 'Placement Site Not Suitable - Returned to Step 1',
      };
      await NotificationModel.create({
        title: OUTCOME_TITLE[outcome] || 'Placement Update',
        desc: `${appt.student} has returned to Step 1 (${outcome.replace('_', ' ')}).`,
        type: 'system',
        isRead: false,
        link: '/workflow?step=1',
      });
    } catch (notifErr) {
      console.warn('[Workflow] Placement outcome notification failed:', notifErr.message);
    }
  }
  // ── End of PLACEMENT OUTCOME side-effects ───────────────────────────────

  try {
    if (actualDbId && mongoose.Types.ObjectId.isValid(actualDbId)) {
      await AppointmentModel.findByIdAndUpdate(actualDbId, appointmentData, {
        runValidators: false,
      });
    } else if (appt.apptId) {
      await AppointmentModel.updateOne({ apptId: appt.apptId }, { $set: appointmentData });
    }
  } catch (dbErr) {
    console.warn("AppointmentModel sync skipped:", dbErr.message);
  }

  return workflow.appointments[appointmentIndex];
};

export const deleteAppointment = async (workflowId, appointmentId) => {
  const normalizedId = String(appointmentId || '').trim();
  let workflow = null;

  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne({
      $or: [
        { "appointments._id": normalizedId },
        { "appointments.apptId": normalizedId },
        { "appointments.id": normalizedId },
      ],
    });
  }
  if (!workflow) {
    try {
      if (mongoose.Types.ObjectId.isValid(normalizedId)) {
        await AppointmentModel.findByIdAndDelete(normalizedId);
      } else {
        await AppointmentModel.deleteOne({ apptId: normalizedId });
      }
    } catch (e) {}
    return { success: true };
  }

  const appointmentIndex = workflow.appointments.findIndex(
    (a) =>
      String(a._id) === normalizedId ||
      (a.apptId && a.apptId === normalizedId) ||
      (a.id && String(a.id) === normalizedId)
  );

  let removed = null;
  if (appointmentIndex !== -1) {
    [removed] = workflow.appointments.splice(appointmentIndex, 1);
  }

  // Also remove from internships if present
  const intIndex = (workflow.internships || []).findIndex(
    (i) =>
      String(i._id) === normalizedId ||
      (i.intId && i.intId === normalizedId) ||
      (i.id && String(i.id) === normalizedId)
  );
  if (intIndex !== -1) {
    workflow.internships.splice(intIndex, 1);
  }

  await workflow.save({ validateBeforeSave: false });

  try {
    const idToDelete = removed?._id || normalizedId;
    if (mongoose.Types.ObjectId.isValid(idToDelete)) {
      await AppointmentModel.findByIdAndDelete(idToDelete);
    } else {
      await AppointmentModel.deleteOne({ apptId: removed?.apptId || normalizedId });
    }
  } catch (dbErr) {
    console.warn("AppointmentModel delete sync skipped:", dbErr.message);
  }

  return removed || { success: true };
};

// ===== Internships (Step 4) =====
export const createInternship = async (workflowId, internshipData) => {
  if (!internshipData.intId) {
    internshipData.intId = await generateIntId();
  }
  let internship = null;
  try {
    internship = await InternshipModel.create(internshipData);
  } catch (e) {
    internship = internshipData;
  }

  let workflow = null;
  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne().sort({ createdAt: -1 });
  }
  if (!workflow) return internship;

  workflow.internships.push(internship);
  await workflow.save({ validateBeforeSave: false });

  try {
    await NotificationModel.create({
      title: "Internship Placement Created",
      desc: `${internship.student} placed as ${internship.title || "Intern"} at ${internship.company}`,
      type: "internship",
      link: "/workflow?step=4",
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return internship;
};

export const updateInternship = async (workflowId, internshipId, internshipData) => {
  const normalizedId = String(internshipId || '').trim();
  let workflow = null;

  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne({
      $or: [
        { "internships._id": normalizedId },
        { "internships.intId": normalizedId },
        { "internships.id": normalizedId },
        { "appointments._id": normalizedId },
        { "appointments.apptId": normalizedId },
        { "appointments.id": normalizedId },
      ],
    });
  }
  if (!workflow) return null;

  // 1. Check if found in workflow.internships
  const internshipIndex = workflow.internships.findIndex(
    (i) =>
      String(i._id) === normalizedId ||
      (i.intId && i.intId === normalizedId) ||
      (i.id && String(i.id) === normalizedId)
  );

  if (internshipIndex !== -1) {
    Object.assign(workflow.internships[internshipIndex], internshipData);
    await workflow.save({ validateBeforeSave: false });

    // ── Set student placementStatus from internship status ───────────────
    if (internshipData.status) {
      try {
        const studentId = workflow.internships[internshipIndex].studentId;
        const stuQuery = [];
        if (studentId) {
          stuQuery.push({ studentId });
          if (mongoose.Types.ObjectId.isValid(studentId)) stuQuery.push({ _id: studentId });
        }
        if (stuQuery.length > 0) {
          const hasCommencementDate = Boolean(internshipData.commencementDate || internshipData.start || workflow.internships[internshipIndex].start);
          const status = internshipData.status;
          const newPs = ['Completed', 'Placement Completed'].includes(status) ? 'Placement Completed'
            : ['Withdrawn', 'Student Withdraw'].includes(status) ? 'Student Withdraw'
            : status === 'Industry Rejected' ? 'Industry Rejected'
            : status === 'Student Missed Appointment' ? 'Student Missed Appointment'
            : hasCommencementDate ? 'Placement Started'
            : 'Appointment Successful';
          await StudentModel.findOneAndUpdate(
            { $or: stuQuery },
            { placementStatus: newPs },
            { runValidators: false }
          );
        }
      } catch (psErr) {
        console.warn('[Workflow] placementStatus internship (direct) update skipped:', psErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    try {
      const dbId = workflow.internships[internshipIndex]._id;
      if (dbId && mongoose.Types.ObjectId.isValid(dbId)) {
        await InternshipModel.findByIdAndUpdate(dbId, internshipData, { runValidators: false });
      }
    } catch (e) {}
    return workflow.internships[internshipIndex];
  }

  // 2. If not found in internships, check workflow.appointments (since Step 4 reflects appointments)
  const appointmentIndex = workflow.appointments.findIndex(
    (a) =>
      String(a._id) === normalizedId ||
      (a.apptId && a.apptId === normalizedId) ||
      (a.id && String(a.id) === normalizedId)
  );

  if (appointmentIndex !== -1) {
    const appt = workflow.appointments[appointmentIndex];

    // Map display status back to appointment status without wiping placement-critical fields
    if (internshipData.status) {
      if (internshipData.status === 'Completed' || internshipData.status === 'Placement Completed') appt.status = 'Completed';
      else if (internshipData.status === 'Appointment Successful') appt.status = 'Confirmed';
      else if (internshipData.status === 'Placement Started' || internshipData.status === 'Waiting to Join') appt.status = 'Confirmed';
      else if (internshipData.status === 'Declined')                appt.status = 'Declined';
      else if (internshipData.status === 'Industry Rejected')       appt.status = 'Industry Rejected';
      else if (internshipData.status === 'Student Missed Appointment') appt.status = 'No Show';
      else if (internshipData.status === 'Withdrawn' || internshipData.status === 'Student Withdraw') appt.status = 'Withdrawn';
      else if (internshipData.status === 'Cancelled')               appt.status = 'Cancelled';
      // For all active/in-progress statuses keep the appointment as Confirmed so
      // placement-start side-effects (email, student status) are not undone
      // Active placement statuses keep the appointment Confirmed.
    }
    if (internshipData.company) appt.company = internshipData.company;
    if (internshipData.title)   appt.position = internshipData.title;
    if (internshipData.notes !== undefined) appt.notes = internshipData.notes;
    if (internshipData.commencementDate || internshipData.start) {
      appt.commencementDate = internshipData.commencementDate || internshipData.start;
    }
    if (internshipData.expectedCompletionDate || internshipData.end) {
      appt.expectedCompletionDate = internshipData.expectedCompletionDate || internshipData.end;
    }

    // Sync the AppointmentModel standalone record
    try {
      if (appt._id && mongoose.Types.ObjectId.isValid(appt._id)) {
        await AppointmentModel.findByIdAndUpdate(appt._id, {
          status:   appt.status,
          company:  appt.company,
          position: appt.position,
          notes:    appt.notes,
          commencementDate: appt.commencementDate,
          expectedCompletionDate: appt.expectedCompletionDate,
        }, { runValidators: false });
      }
    } catch (e) {}

    // Upsert into workflow.internships — update existing record if one already exists
    // for this appointment, otherwise create it once. This prevents duplicates on
    // repeated saves.
    const derivedIntId = appt.apptId ? `PL-${appt.apptId.substring(4)}` : null;
    const existingIntIndex = workflow.internships.findIndex(
      (i) =>
        (derivedIntId && i.intId === derivedIntId) ||
        (appt.studentId && i.studentId === appt.studentId && i.company === (internshipData.company || appt.company))
    );

    const intRecord = {
      intId: derivedIntId || (await generateIntId()),
      student: appt.student,
      studentId: appt.studentId,
      company: internshipData.company || appt.company,
      title: internshipData.title || appt.position || 'Internship Placement',
      rto: appt.rto || 'TBD',
      // Preserve the display status from the form — this is what the coordinator set
      status: internshipData.status === 'Placement Completed' ? 'Completed' : (internshipData.status || 'Waiting to Join'),
      // Use placement start/end dates — not the appointment interview date
      start: internshipData.start || internshipData.commencementDate || appt.commencementDate || '',
      end: internshipData.end || internshipData.expectedCompletionDate || appt.expectedCompletionDate || '',
      duration: '12 weeks',
      notes: internshipData.notes !== undefined ? internshipData.notes : (appt.notes || ''),
    };

    if (existingIntIndex !== -1) {
      Object.assign(workflow.internships[existingIntIndex], intRecord);
    } else {
      workflow.internships.push(intRecord);
    }

    // ── Set student placementStatus based on internship display status ──────
    try {
      const stuQuery = [];
      if (appt.studentId) {
        stuQuery.push({ studentId: appt.studentId });
        if (mongoose.Types.ObjectId.isValid(appt.studentId)) stuQuery.push({ _id: appt.studentId });
      }
      // Name-based fallback in case studentId lookup misses
      if (appt.student && stuQuery.length === 0) {
        const nameParts = appt.student.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          stuQuery.push({ firstName: nameParts[0], lastName: nameParts[nameParts.length - 1] });
        }
      }
      if (stuQuery.length > 0) {
        const placementStatus = internshipData.status;
        let newPlacementStatus = appt.commencementDate ? 'Placement Started' : 'Appointment Successful';
        if (['Completed', 'Placement Completed'].includes(placementStatus)) newPlacementStatus = 'Placement Completed';
        else if (['Withdrawn', 'Student Withdraw'].includes(placementStatus)) newPlacementStatus = 'Student Withdraw';
        else if (placementStatus === 'Industry Rejected') newPlacementStatus = 'Industry Rejected';
        else if (placementStatus === 'Student Missed Appointment') newPlacementStatus = 'Student Missed Appointment';
        await StudentModel.findOneAndUpdate(
          { $or: stuQuery },
          { placementStatus: newPlacementStatus },
          { runValidators: false }
        );
      }
    } catch (psErr) {
      console.warn('[Workflow] placementStatus internship update skipped:', psErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────

    await workflow.save({ validateBeforeSave: false });
    return existingIntIndex !== -1 ? workflow.internships[existingIntIndex] : workflow.internships[workflow.internships.length - 1];
  }

  return null;
};

export const deleteInternship = async (workflowId, internshipId) => {
  const normalizedId = String(internshipId || '').trim();
  let workflow = null;

  if (workflowId && mongoose.Types.ObjectId.isValid(workflowId)) {
    workflow = await WorkflowModel.findById(workflowId);
  }
  if (!workflow) {
    workflow = await WorkflowModel.findOne({
      $or: [
        { "internships._id": normalizedId },
        { "internships.intId": normalizedId },
        { "internships.id": normalizedId },
        { "appointments._id": normalizedId },
        { "appointments.apptId": normalizedId },
        { "appointments.id": normalizedId },
      ],
    });
  }
  if (!workflow) {
    try {
      if (mongoose.Types.ObjectId.isValid(normalizedId)) {
        await InternshipModel.findByIdAndDelete(normalizedId);
        await AppointmentModel.findByIdAndDelete(normalizedId);
      } else {
        await InternshipModel.deleteOne({ intId: normalizedId });
        await AppointmentModel.deleteOne({ apptId: normalizedId });
      }
    } catch (e) {}
    return { success: true };
  }

  // Remove from workflow.internships
  const internshipIndex = workflow.internships.findIndex(
    (i) =>
      String(i._id) === normalizedId ||
      (i.intId && i.intId === normalizedId) ||
      (i.id && String(i.id) === normalizedId)
  );
  let removed = null;
  if (internshipIndex !== -1) {
    [removed] = workflow.internships.splice(internshipIndex, 1);
  }

  // Also remove from workflow.appointments
  const appointmentIndex = workflow.appointments.findIndex(
    (a) =>
      String(a._id) === normalizedId ||
      (a.apptId && a.apptId === normalizedId) ||
      (a.id && String(a.id) === normalizedId)
  );
  if (appointmentIndex !== -1) {
    const [removedAppt] = workflow.appointments.splice(appointmentIndex, 1);
    removed = removed || removedAppt;
  }

  await workflow.save({ validateBeforeSave: false });

  try {
    const idToDelete = removed?._id || normalizedId;
    if (mongoose.Types.ObjectId.isValid(idToDelete)) {
      await InternshipModel.findByIdAndDelete(idToDelete);
      await AppointmentModel.findByIdAndDelete(idToDelete);
    } else {
      await InternshipModel.deleteOne({ intId: normalizedId });
      await AppointmentModel.deleteOne({ apptId: normalizedId });
    }
  } catch (dbErr) {
    console.warn("Delete sync skipped:", dbErr.message);
  }

  return removed || { success: true };
};

// ===== Workflow Data Aggregation =====
export const getWorkflowDashboardData = async () => {
  const [
    totalWorkflows,
    activeWorkflows,
    totalRequests,
    totalAppointments,
    totalInternships,
    requests,
    appointments,
    internships,
    latestWorkflows,
    workflowRecords
  ] = await Promise.all([
    WorkflowModel.countDocuments(),
    WorkflowModel.countDocuments({ status: "Active" }),
    InternshipRequestModel.countDocuments(),
    AppointmentModel.countDocuments(),
    InternshipModel.countDocuments(),
    InternshipRequestModel.find().sort({ createdAt: -1 }),
    AppointmentModel.find().sort({ createdAt: -1 }),
    InternshipModel.find().sort({ createdAt: -1 }),
    WorkflowModel.find().sort({ updatedAt: -1 }).limit(5),
    WorkflowModel.find({}, { requests: 1, appointments: 1, internships: 1 }).lean()
  ]);

  // ── Placement Status counts — derived from student.placementStatus ──────
  // Cross-reference appointments & internships to auto-correct any stale
  // placementStatus values in the Student collection, then count the corrected values.
  // Reuse already-fetched appointments/internships from the Promise.all above.
  const [students] = await Promise.all([
    StudentModel.find({}, { _id: 1, studentId: 1, placementStatus: 1 }).lean(),
  ]);
  // Embedded workflow records are authoritative. Standalone collections can
  // contain orphaned rows after a student is deleted.
  const allAppointments = workflowRecords.flatMap(wf => wf.appointments || []);
  const allInternships  = workflowRecords.flatMap(wf => wf.internships || []);
  const allRequests     = workflowRecords.flatMap(wf => wf.requests || []);

  // Build lookup maps keyed by studentId (business ID) and _id string
  const apptsByStudent = {};
  for (const a of allAppointments) {
    const keys = [a.studentId, String(a._id || '')].filter(Boolean);
    for (const k of keys) {
      if (!apptsByStudent[k]) apptsByStudent[k] = [];
      apptsByStudent[k].push(a);
    }
  }
  const internshipsByStudent = {};
  for (const i of allInternships) {
    const keys = [i.studentId, String(i._id || '')].filter(Boolean);
    for (const k of keys) {
      if (!internshipsByStudent[k]) internshipsByStudent[k] = [];
      internshipsByStudent[k].push(i);
    }
  }
  const requestsByStudent = {};
  for (const r of allRequests) {
    const keys = [r.studentId].filter(Boolean);
    for (const k of keys) {
      if (!requestsByStudent[k]) requestsByStudent[k] = [];
      requestsByStudent[k].push(r);
    }
  }

  // Derive the correct placementStatus for a student from live appointment/internship data
  const deriveStatus = (stu) => {
    const keys = [stu.studentId, String(stu._id || '')].filter(Boolean);
    const appts = keys.flatMap(k => apptsByStudent[k] || []);
    const ints  = keys.flatMap(k => internshipsByStudent[k] || []);
    const reqs  = keys.flatMap(k => requestsByStudent[k] || []);

    const uniqueAppts = [...new Map(appts.map(a => [String(a._id), a])).values()];
    const uniqueInts  = [...new Map(ints.map(i => [String(i._id), i])).values()];

    const now = new Date();

    // 1. Placement Completed — only when internship record is explicitly Completed
    if (
      uniqueInts.some(i => i.status === 'Completed' || i.status === 'Placement Completed')
    ) return 'Placement Completed';

    // 2. Placement Started — confirmed with commencement date ≤ now, or active internship
    if (
      uniqueInts.some(i => ['Active', 'Placement Started', 'Joined', 'Waiting to Join'].includes(i.status)) ||
      uniqueAppts.some(a =>
        (a.status === 'Confirmed' || a.appointmentOutcome === 'successful') &&
        a.commencementDate && new Date(a.commencementDate) <= now
      )
    ) return 'Placement Started';

    // 3. Appointment Successful — confirmed outcome but no commencement date yet set
    if (
      uniqueAppts.some(a =>
        a.appointmentOutcome === 'successful' &&
        !a.commencementDate
      )
    ) return 'Appointment Successful';

    // 4. Terminal outcomes
    const terminalAppt = uniqueAppts.find(a =>
      ['Industry Rejected', 'Declined', 'No Show', 'Student Missed Appointment', 'Not Suitable Site', 'Withdrawn'].includes(a.status) ||
      ['industry_rejected', 'student_withdrawal', 'not_suitable_site'].includes(a.appointmentOutcome)
    );
    if (terminalAppt) {
      const s = terminalAppt.status;
      const o = terminalAppt.appointmentOutcome;
      if (s === 'Industry Rejected' || s === 'Declined' || o === 'industry_rejected') return 'Industry Rejected';
      if (s === 'Not Suitable Site' || o === 'not_suitable_site') return 'Not Suitable Site';
      if (s === 'Withdrawn' || o === 'student_withdrawal') return 'Student Withdraw';
      if (s === 'No Show' || s === 'Student Missed Appointment') return 'Student Missed Appointment';
    }

    // 5. Appointment Scheduled — has a scheduled appointment
    if (uniqueAppts.some(a => ['Scheduled', 'Rescheduled'].includes(a.status))) return 'Appointment Scheduled';

    // 6. Industry Contacted — at least one industry contact exists on a request.
    if (reqs.some(r => (r.contactedIndustries || []).length > 0)) return 'Industry Contacted';

    // 7. In Progress — has any appointment record at all
    if (uniqueAppts.length > 0) return 'In Progress';

    // 8. A generated placement request without an appointment is in progress.
    if (reqs.length > 0) return 'In Progress';

    // 9. No request, appointment, or internship — always Awaiting
    return 'Awaiting';
  };

  // Correct stale values in DB asynchronously (fire-and-forget, never blocks response)
  const bulkOps = [];
  for (const stu of students) {
    const correct = deriveStatus(stu);
    if (stu.placementStatus !== correct) {
      bulkOps.push({
        updateOne: {
          filter: { _id: stu._id },
          update: { $set: { placementStatus: correct } },
        },
      });
    }
  }
  if (bulkOps.length > 0) {
    StudentModel.bulkWrite(bulkOps, { ordered: false }).catch(e =>
      console.warn('[Dashboard] placementStatus auto-correct bulkWrite failed:', e.message)
    );
  }

  // Use the derived (corrected) values for the counts
  const correctedStatuses = students.map(s => deriveStatus(s));

  const countByPlacementStatus = (val) => correctedStatuses.filter(s => s === val).length;

  const requestsStats = {
    awaiting:                  countByPlacementStatus("Awaiting"),
    inProgress:                countByPlacementStatus("In Progress"),
    industryContacted:         countByPlacementStatus("Industry Contacted"),
    appointmentScheduled:      countByPlacementStatus("Appointment Scheduled"),
    appointmentSuccessful:     countByPlacementStatus("Appointment Successful"),
    studentWithdraw:           countByPlacementStatus("Student Withdraw"),
    studentMissedAppointment:  countByPlacementStatus("Student Missed Appointment"),
    industryRejected:          countByPlacementStatus("Industry Rejected"),
    notSuitableSite:           countByPlacementStatus("Not Suitable Site"),
    placementStarted:          countByPlacementStatus("Placement Started"),
    placementCompleted:        countByPlacementStatus("Placement Completed"),
  };

  const appointmentsStats = {
    scheduled: appointments.filter((a) => ["Scheduled", "Rescheduled"].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    cancelled: appointments.filter((a) => ["Cancelled", "No Show"].includes(a.status)).length,
  };

  const internshipsStats = {
    active: internships.filter((i) => i.status === "Active").length,
    joined: internships.filter((i) => i.status === "Joined").length,
    waitingToJoin: internships.filter((i) => i.status === "Waiting to Join").length,
    completed: internships.filter((i) => i.status === "Completed").length,
    onHold: internships.filter((i) => i.status === "On Hold").length,
    cancelled: internships.filter((i) => i.status === "Cancelled").length,
  };

  const rawActivities = [];

  requests.slice(0, 5).forEach((r) => {
    rawActivities.push({
      id: r._id.toString(),
      title: `${r.student} submitted request for ${r.company}`,
      subtitle: `Internship Request (${r.status})`,
      createdAt: r.createdAt || new Date(),
      type: "request"
    });
  });

  appointments.slice(0, 5).forEach((a) => {
    rawActivities.push({
      id: a._id.toString(),
      title: `Appointment with ${a.student} at ${a.company}`,
      subtitle: `Appointment (${a.status})`,
      createdAt: a.createdAt || new Date(),
      type: "appointment"
    });
  });

  internships.slice(0, 5).forEach((i) => {
    rawActivities.push({
      id: i._id.toString(),
      title: `${i.student} internship at ${i.company}`,
      subtitle: `Internship Placement (${i.status})`,
      createdAt: i.createdAt || new Date(),
      type: "internship"
    });
  });

  rawActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const recentActivities = rawActivities.slice(0, 5).map((act) => {
    const diffMs = new Date() - new Date(act.createdAt);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let timeAgo = "Just now";
    if (diffDays > 0) timeAgo = `${diffDays}d ago`;
    else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
    else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

    return {
      title: act.title,
      subtitle: act.subtitle,
      time: timeAgo,
      type: act.type
    };
  });

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const monthKey = `${monthName} ${year}`;

    const reqCount = requests.filter((r) => {
      const rDate = new Date(r.createdAt || now);
      return rDate.getMonth() === d.getMonth() && rDate.getFullYear() === d.getFullYear();
    }).length;

    const placeCount = internships.filter((intItem) => {
      const iDate = new Date(intItem.createdAt || now);
      return iDate.getMonth() === d.getMonth() && iDate.getFullYear() === d.getFullYear();
    }).length;

    months.push({
      label: monthKey,
      requests: reqCount,
      placements: placeCount
    });
  }

  return {
    totalWorkflows,
    activeWorkflows,
    totalRequests,
    totalAppointments,
    totalInternships,
    requestsStats,
    appointmentsStats,
    internshipsStats,
    recentActivities,
    chartData: months
  };
};

// ===== Get all students for workflow step 1 =====
export const getWorkflowStudents = async (filter = {}) => {
  return await StudentModel.find(filter).sort({ createdAt: -1 });
};

// ===== Cascade delete — purge a student from ALL workflow data =====
// Removes the student ObjectId from workflow.students array, and
// pulls every request / appointment / internship where studentId matches
// either the MongoDB _id string OR the business studentId (e.g. "STU1").
export const purgeStudentFromWorkflows = async (studentId, studentBizId = '') => {
  // Find all workflows that reference this student
  const workflows = await WorkflowModel.find({
    $or: [
      { students: studentId },
      { 'requests.studentId': { $in: [studentId, studentBizId].filter(Boolean) } },
      { 'appointments.studentId': { $in: [studentId, studentBizId].filter(Boolean) } },
      { 'internships.studentId': { $in: [studentId, studentBizId].filter(Boolean) } },
    ],
  });

  // Collect every company/industry name linked to this student BEFORE removing
  // their data — needed to check orphan status afterward.
  const studentCompanyNames = new Set();

  for (const workflow of workflows) {
    let changed = false;
    // 1. Remove from students array
    const beforeStudentCount = workflow.students.length;
    workflow.students = workflow.students.filter(
      (s) => s.toString() !== String(studentId)
    );
    if (workflow.students.length !== beforeStudentCount) changed = true;
    // Helper: does this subdoc belong to the deleted student?
    const matchesStudent = (sub) => {
      const sid = String(sub.studentId || '');
      return (
        sid === String(studentId) ||
        (studentBizId && sid === String(studentBizId))
      );
    };
    // 2. Collect industry names from requests, then remove
    for (const r of workflow.requests) {
      if (matchesStudent(r)) {
        for (const c of (r.contactedIndustries || [])) {
          const name = (c.organizationName || '').trim().toLowerCase();
          if (name) studentCompanyNames.add(name);
        }
        const co = (r.company || '').trim().toLowerCase();
        if (co && co !== 'pending assignment' && co !== 'unassigned') {
          studentCompanyNames.add(co);
        }
      }
    }
    const reqsBefore = workflow.requests.length;
    workflow.requests = workflow.requests.filter((r) => !matchesStudent(r));
    if (workflow.requests.length !== reqsBefore) changed = true;
    // 3. Collect industry names from appointments, then remove
    for (const a of workflow.appointments) {
      if (matchesStudent(a)) {
        const co = (a.company || '').trim().toLowerCase();
        if (co && co !== 'unknown company' && co !== 'pending assignment') {
          studentCompanyNames.add(co);
        }
      }
    }
    const apptsBefore = workflow.appointments.length;
    workflow.appointments = workflow.appointments.filter((a) => !matchesStudent(a));
    if (workflow.appointments.length !== apptsBefore) changed = true;
    // 4. Collect industry names from internships, then remove
    for (const i of workflow.internships) {
      if (matchesStudent(i)) {
        const co = (i.company || '').trim().toLowerCase();
        if (co && co !== 'unknown company') studentCompanyNames.add(co);
      }
    }
    const intsBefore = workflow.internships.length;
    workflow.internships = workflow.internships.filter((i) => !matchesStudent(i));
    if (workflow.internships.length !== intsBefore) changed = true;
    if (changed) await workflow.save({ validateBeforeSave: false });
  }

  // Remove mirrored standalone records as well. Otherwise an old appointment
  // keyed by a reused business studentId can affect a future student's status.
  const studentKeys = [studentId, studentBizId].filter(Boolean).map(String);
  if (studentKeys.length > 0) {
    await Promise.all([
      AppointmentModel.deleteMany({ studentId: { $in: studentKeys } }),
      InternshipModel.deleteMany({ studentId: { $in: studentKeys } }),
      InternshipRequestModel.deleteMany({ studentId: { $in: studentKeys } }),
    ]);
  }

  // ── Cascade: delete orphaned industries from the Industries tab ──────────
  // After removing this student's workflow data, re-scan all remaining workflow
  // data. Any industry no longer referenced by any other student gets deleted.
  if (studentCompanyNames.size > 0) {
    try {
      const IndustryModel = (await import('../model/industry.model.js')).default;

      // Build set of names still referenced by other students
      const remainingWorkflows = await WorkflowModel.find();
      const stillReferenced = new Set();
      for (const wf of remainingWorkflows) {
        for (const r of (wf.requests || [])) {
          const co = (r.company || '').trim().toLowerCase();
          if (co) stillReferenced.add(co);
          for (const c of (r.contactedIndustries || [])) {
            const cn = (c.organizationName || '').trim().toLowerCase();
            if (cn) stillReferenced.add(cn);
          }
        }
        for (const a of (wf.appointments || [])) {
          const co = (a.company || '').trim().toLowerCase();
          if (co) stillReferenced.add(co);
        }
        for (const i of (wf.internships || [])) {
          const co = (i.company || '').trim().toLowerCase();
          if (co) stillReferenced.add(co);
        }
      }

      // Delete from Industry collection only if truly orphaned
      for (const name of studentCompanyNames) {
        if (!stillReferenced.has(name)) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          await IndustryModel.deleteMany({
            name: { $regex: new RegExp(`^${escaped}$`, 'i') },
          });
        }
      }
    } catch (industryPurgeErr) {
      // Non-fatal — student + workflow data already purged successfully
      console.error('Industry cascade purge error:', industryPurgeErr.message);
    }
  }
};
