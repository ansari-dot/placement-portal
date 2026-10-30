/**
 * RBAC Response Sanitizer Utility
 * Enforces strict data isolation directly in API JSON payloads based on the
 * authenticated user's role.
 *
 * Rules:
 * - Administrators: Full access to all fields.
 * - Coordinators: Access assigned students; RTO financial and administrative fields omitted.
 * - RTO: Access only own students; other RTOs, host facility names, and industry contact details omitted.
 * - Students: Access only own record; industry contact details, internal notes, and other RTOs omitted.
 * - Industry: Access only assigned students; internal notes, coordinator history, and other facilities omitted.
 */

export const sanitizeStudentDataForRole = (studentDoc, role) => {
  if (!studentDoc) return studentDoc;
  const s = typeof studentDoc.toObject === 'function' ? studentDoc.toObject() : { ...studentDoc };

  if (role === 'Administrator' || role === 'Admin') {
    return s;
  }

  if (role === 'Coordinator' || role === 'Placement Coordinator') {
    delete s.independentFee;
    return s;
  }

  if (role === 'RTO Manager' || role === 'RTO') {
    // RTO users must not be able to see:
    // 1. Industry information (confidential business policy)
    delete s.contactedIndustries;
    delete s.placementSite;
    delete s.preferredIndustry;
    delete s.facilityName;
    delete s.industryName;
    delete s.industryEmail;
    delete s.industryPhone;
    delete s.industryId;
    delete s.company;
    delete s.industry;
    delete s.placementNotes;
    delete s.additionalNotes;

    // 2. Assigned Coordinator information (confidential business policy)
    delete s.assignedCoordinator;
    delete s.assignedCoordinatorName;
    delete s.assignedCoordinatorAt;
    delete s.assignedCoordinatorEmail;
    delete s.coordinatorHistory;
    delete s.coordinator;

    // 3. Financial fields not meant for RTO
    delete s.independentFee;

    return s;
  }

  if (role === 'Student') {
    // Students should only see their own profile and placement information.
    // Must not see: internal coordinator history, contacted industries list, internal notes, or financial fee rates
    delete s.contactedIndustries;
    delete s.coordinatorHistory;
    delete s.additionalNotes;
    delete s.placementNotes;
    delete s.independentFee;
    return s;
  }

  if (role === 'Industry' || role === 'Industry/Host') {
    // Industry users see basic placement info for students assigned to their facility.
    // Must not see: internal notes, visa subclass, other RTO contact info, or unassigned contacts.
    delete s.coordinatorHistory;
    delete s.additionalNotes;
    delete s.independentFee;
    delete s.contactedIndustries;
    return s;
  }

  return s;
};

export const sanitizeAppointmentForRole = (appointmentDoc, role) => {
  if (!appointmentDoc) return appointmentDoc;
  const a = typeof appointmentDoc.toObject === 'function' ? appointmentDoc.toObject() : { ...appointmentDoc };

  if (
    role === 'Administrator' ||
    role === 'Admin' ||
    role === 'Coordinator' ||
    role === 'Placement Coordinator' ||
    role === 'Student'
  ) {
    return a;
  }

  if (role === 'RTO Manager' || role === 'RTO') {
    // Redact host facility identity, industry contact details, and coordinator
    a.company = 'Host Facility';
    a.interviewer = '';
    a.contactPerson = '';
    a.email = '';
    a.phone = '';
    a.industryContactId = '';
    a.industryType = '';
    a.location = 'Host Location';
    a.notes = '';
    delete a.coordinator;
    delete a.assignedCoordinator;
    delete a.assignedCoordinatorName;
  }

  return a;
};

export const sanitizeInternshipRequestForRole = (requestDoc, role) => {
  if (!requestDoc) return requestDoc;
  const r = typeof requestDoc.toObject === 'function' ? requestDoc.toObject() : { ...requestDoc };

  if (
    role === 'Administrator' ||
    role === 'Admin' ||
    role === 'Coordinator' ||
    role === 'Placement Coordinator' ||
    role === 'Student'
  ) {
    return r;
  }

  if (role === 'RTO Manager' || role === 'RTO') {
    r.company = 'Host Facility';
    r.contactedIndustries = [];
    r.coordinator = '';
    r.location = 'Host Location';
    r.notes = '';
    delete r.assignedCoordinator;
    delete r.assignedCoordinatorName;
  }

  return r;
};

export const sanitizeInternshipForRole = (internshipDoc, role) => {
  if (!internshipDoc) return internshipDoc;
  const i = typeof internshipDoc.toObject === 'function' ? internshipDoc.toObject() : { ...internshipDoc };

  if (
    role === 'Administrator' ||
    role === 'Admin' ||
    role === 'Coordinator' ||
    role === 'Placement Coordinator' ||
    role === 'Student'
  ) {
    return i;
  }

  if (role === 'RTO Manager' || role === 'RTO') {
    i.company = 'Host Facility';
    i.location = 'Host Location';
    i.coordinator = '';
    i.notes = '';
    delete i.assignedCoordinator;
    delete i.assignedCoordinatorName;
  }

  return i;
};

export const sanitizeAttendanceForRole = (attendanceDoc, role) => {
  if (!attendanceDoc) return attendanceDoc;
  const att = typeof attendanceDoc.toObject === 'function' ? attendanceDoc.toObject() : { ...attendanceDoc };
  if (!att._id && att.id) att._id = att.id;
  if (!att.id && att._id) att.id = att._id;

  if (
    role === 'Administrator' ||
    role === 'Admin' ||
    role === 'Industry' ||
    role === 'Industry/Host' ||
    role === 'Student'
  ) {
    return att;
  }

  if (role === 'RTO Manager' || role === 'RTO') {
    // Redact facility identity to preserve privacy boundary
    att.facilityName = 'Host Facility';
    att.industry = null;
    att.notes = '';
  }

  return att;
};

export const sanitizeRtoDataForRole = (rtoDoc, role) => {
  if (!rtoDoc) return rtoDoc;
  const r = typeof rtoDoc.toObject === 'function' ? rtoDoc.toObject() : { ...rtoDoc };

  if (role === 'Administrator' || role === 'Admin') {
    return r;
  }

  // Remove internal financial payouts or admin documents from non-admin roles
  delete r.payoutRate;
  delete r.coursePricing;
  delete r.chargingTrigger;
  delete r.withdrawalFeeRule;
  delete r.withdrawalFeePercentage;

  return r;
};
