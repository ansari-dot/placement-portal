import mongoose from "mongoose";
import WorkflowModel, {
  InternshipRequestModel,
  AppointmentModel,
  InternshipModel,
} from "../model/workflow.model.js";
import StudentModel from "../model/student.model.js";
import NotificationModel from "../model/notification.model.js";
import { sendPlacementStartedEmail } from "./email.service.js";

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
  if (!workflow) return null;

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
  if (requestIndex === -1) return null;

  const matchedRequest = workflow.requests[requestIndex];
  const actualDbId = matchedRequest._id;

  const { contactedIndustries: newContacts, ...otherFields } = requestData || {};

  // Push new contact records â€” never overwrite the existing array
  if (Array.isArray(newContacts) && newContacts.length > 0) {
    matchedRequest.contactedIndustries.push(...newContacts);
  }

  Object.keys(otherFields).forEach((key) => {
    matchedRequest[key] = otherFields[key];
  });

  await workflow.save({ validateBeforeSave: false });

  try {
    if (actualDbId && mongoose.Types.ObjectId.isValid(actualDbId)) {
      if (Array.isArray(newContacts) && newContacts.length > 0) {
        await InternshipRequestModel.findByIdAndUpdate(
          actualDbId,
          { $push: { contactedIndustries: { $each: newContacts } } },
          { runValidators: false }
        );
      }
      if (Object.keys(otherFields).length > 0) {
        await InternshipRequestModel.findByIdAndUpdate(actualDbId, otherFields, {
          runValidators: false,
        });
      }
    } else if (matchedRequest.reqId) {
      if (Array.isArray(newContacts) && newContacts.length > 0) {
        await InternshipRequestModel.updateOne(
          { reqId: matchedRequest.reqId },
          { $push: { contactedIndustries: { $each: newContacts } } }
        );
      }
      if (Object.keys(otherFields).length > 0) {
        await InternshipRequestModel.updateOne(
          { reqId: matchedRequest.reqId },
          { $set: otherFields }
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

  // â”€â”€ Side-effects when placement is confirmed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (
    appointmentData.status === 'Confirmed' &&
    appointmentData.appointmentOutcome === 'successful'
  ) {
    const studentId = appt.studentId;
    const studentName = (appt.student || '').trim().toLowerCase();
    const companyName = (appt.company || '').trim().toLowerCase();

    // 1. Update contactedIndustries response â†’ 'Placement Started' on all matching requests
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

    // 2. Update student placementStatus â†’ 'Placement Started'
    try {
      const stuQuery = [];
      if (studentId) {
        stuQuery.push({ studentId });
        if (mongoose.Types.ObjectId.isValid(studentId)) stuQuery.push({ _id: studentId });
      }
      if (stuQuery.length > 0) {
        const studentDoc = await StudentModel.findOne({ $or: stuQuery });
        if (studentDoc) {
          studentDoc.placementStatus = 'Placement Started';
          // Also update contactedIndustries on student
          if (Array.isArray(studentDoc.contactedIndustries)) {
            studentDoc.contactedIndustries.forEach((ci) => {
              const orgName = (ci.organizationName || '').trim().toLowerCase();
              if (companyName && orgName && (orgName === companyName || orgName.includes(companyName) || companyName.includes(orgName))) {
                ci.response = 'Placement Started';
              }
            });
          }
          await studentDoc.save();

          // 3. Send placement started email
          const toEmail = appt.email || studentDoc.emailAddress || studentDoc.email || '';
          const commDate = appointmentData.commencementDate || appt.commencementDate || '';
          const endDate = appointmentData.expectedCompletionDate || appt.expectedCompletionDate || '';
          if (toEmail) {
            try {
              await sendPlacementStartedEmail({
                toEmail,
                studentName: appt.student || studentDoc.name || 'Student',
                companyName: appt.company || 'the placement site',
                commencementDate: commDate,
                expectedCompletionDate: endDate,
                studentId: studentId || '',
              });
            } catch (emailErr) {
              console.warn('[Workflow] Placement started email failed:', emailErr.message);
            }
          }
        }
      }
    } catch (stuErr) {
      console.warn('[Workflow] Student placementStatus update skipped:', stuErr.message);
    }

    // 4. Create in-app notification
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
  // â”€â”€ End of placement confirmation side-effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      if (internshipData.status === 'Completed')       appt.status = 'Completed';
      else if (internshipData.status === 'Declined')   appt.status = 'Declined';
      else if (internshipData.status === 'Withdrawn')  appt.status = 'Withdrawn';
      else if (internshipData.status === 'Cancelled')  appt.status = 'Cancelled';
      // For all active/in-progress statuses keep the appointment as Confirmed so
      // placement-start side-effects (email, student status) are not undone
      // 'Waiting to Join', 'Joined', 'Active', 'On Hold', 'Placement Started' â†’ keep Confirmed
    }
    if (internshipData.company) appt.company = internshipData.company;
    if (internshipData.title)   appt.position = internshipData.title;
    if (internshipData.notes !== undefined) appt.notes = internshipData.notes;

    // Sync the AppointmentModel standalone record
    try {
      if (appt._id && mongoose.Types.ObjectId.isValid(appt._id)) {
        await AppointmentModel.findByIdAndUpdate(appt._id, {
          status:   appt.status,
          company:  appt.company,
          position: appt.position,
          notes:    appt.notes,
        }, { runValidators: false });
      }
    } catch (e) {}

    // Upsert into workflow.internships â€” update existing record if one already exists
    // for this appointment, otherwise create it once. This prevents duplicates on
    // repeated saves.
    const derivedIntId = appt.apptId ? `INT-${appt.apptId.substring(4)}` : null;
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
      // Preserve the display status from the form â€” this is what the coordinator set
      status: internshipData.status || 'Waiting to Join',
      // Use placement start/end dates â€” not the appointment interview date
      start: appt.commencementDate || appt.date || new Date().toISOString().split('T')[0],
      end: appt.expectedCompletionDate || '',
      duration: '12 weeks',
      notes: internshipData.notes !== undefined ? internshipData.notes : (appt.notes || ''),
    };

    if (existingIntIndex !== -1) {
      Object.assign(workflow.internships[existingIntIndex], intRecord);
    } else {
      workflow.internships.push(intRecord);
    }

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
    latestWorkflows
  ] = await Promise.all([
    WorkflowModel.countDocuments(),
    WorkflowModel.countDocuments({ status: "Active" }),
    InternshipRequestModel.countDocuments(),
    AppointmentModel.countDocuments(),
    InternshipModel.countDocuments(),
    InternshipRequestModel.find().sort({ createdAt: -1 }),
    AppointmentModel.find().sort({ createdAt: -1 }),
    InternshipModel.find().sort({ createdAt: -1 }),
    WorkflowModel.find().sort({ updatedAt: -1 }).limit(5)
  ]);

  const requestsStats = {
    pending: requests.filter((r) => ["New", "Coordinator Review", "RTO Review"].includes(r.status)).length,
    assigned: requests.filter((r) => ["Coordinator Review", "RTO Review"].includes(r.status)).length,
    appointment: requests.filter((r) => r.status === "Appointment").length,
    placed: requests.filter((r) => r.status === "Approved").length,
    failed: requests.filter((r) => r.status === "Rejected").length,
    withdrawn: requests.filter((r) => r.status === "On Hold").length,
    declined: requests.filter((r) => r.status === "Rejected").length,
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

// ===== Cascade delete â€” purge a student from ALL workflow data =====
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
