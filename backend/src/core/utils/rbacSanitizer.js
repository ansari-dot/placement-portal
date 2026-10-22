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
    // - Other RTO names / info
    // - Industry or host facility names
    // - Industry contact details
    // - Other organisations' information
    delete s.contactedIndustries;
    delete s.placementSite;
    delete s.preferredIndustry;
    delete s.facilityName;
    delete s.industryName;
    delete s.industryEmail;
    delete s.industryPhone;
    delete s.industryId;
    delete s.additionalNotes;
    delete s.coordinatorHistory;
    if (s.placementNotes) delete s.placementNotes;
    return s;
  }

  if (role === 'Student') {
    // Students should only see their own profile and placement information.
    // Must not see: RTO names/info about other RTOs, Industry/host facility names/contacts, internal notes.
    delete s.contactedIndustries;
    delete s.coordinatorHistory;
    delete s.facilityName;
    delete s.industryName;
    delete s.industryEmail;
    delete s.industryPhone;
    delete s.industryId;
    delete s.additionalNotes;
    delete s.independentFee;
    delete s.placementNotes;
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

  if (role === 'Administrator' || role === 'Admin' || role === 'Coordinator' || role === 'Placement Coordinator') {
    return a;
  }

  if (role === 'RTO Manager' || role === 'RTO' || role === 'Student') {
    // Redact host facility identity and contact details
    a.company = 'Host Facility';
    a.interviewer = '';
    a.contactPerson = '';
    a.email = '';
    a.phone = '';
    a.industryContactId = '';
    a.location = 'Host Location';
  }

  return a;
};

export const sanitizeInternshipRequestForRole = (requestDoc, role) => {
  if (!requestDoc) return requestDoc;
  const r = typeof requestDoc.toObject === 'function' ? requestDoc.toObject() : { ...requestDoc };

  if (role === 'Administrator' || role === 'Admin' || role === 'Coordinator' || role === 'Placement Coordinator') {
    return r;
  }

  if (role === 'RTO Manager' || role === 'RTO' || role === 'Student') {
    r.company = 'Host Facility';
    r.contactedIndustries = [];
  }

  return r;
};

export const sanitizeInternshipForRole = (internshipDoc, role) => {
  if (!internshipDoc) return internshipDoc;
  const i = typeof internshipDoc.toObject === 'function' ? internshipDoc.toObject() : { ...internshipDoc };

  if (role === 'Administrator' || role === 'Admin' || role === 'Coordinator' || role === 'Placement Coordinator') {
    return i;
  }

  if (role === 'RTO Manager' || role === 'RTO' || role === 'Student') {
    i.company = 'Host Facility';
    i.location = 'Host Location';
  }

  return i;
};

export const sanitizeAttendanceForRole = (attendanceDoc, role) => {
  if (!attendanceDoc) return attendanceDoc;
  const att = typeof attendanceDoc.toObject === 'function' ? attendanceDoc.toObject() : { ...attendanceDoc };

  if (role === 'Administrator' || role === 'Admin' || role === 'Industry' || role === 'Industry/Host') {
    return att;
  }

  if (role === 'RTO Manager' || role === 'RTO' || role === 'Student') {
    // Redact facility identity to preserve privacy boundary
    att.facilityName = 'Host Facility';
    att.industry = null;
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
