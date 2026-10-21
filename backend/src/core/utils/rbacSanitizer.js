/**
 * RBAC Response Sanitizer Utility
 * Enforces Security Requirement #7: "Simply hiding information from the screen is not enough."
 * Ensures data belonging to other organizations, RTOs, Industries, or Students is omitted
 * directly from API JSON payloads based on the authenticated user's role.
 */

export const sanitizeStudentDataForRole = (studentDoc, role) => {
  if (!studentDoc) return studentDoc;
  const s = typeof studentDoc.toObject === 'function' ? studentDoc.toObject() : { ...studentDoc };

  if (role === 'Coordinator') {
    // Company policy: Coordinators must not see RTO details in student profiles
    delete s.assignedRto;
    delete s.rto;
    delete s.rtoId;
    delete s.rtoName;
    delete s.studentType;
    delete s.independentFee;
    return s;
  }

  if (role === 'RTO Manager') {
    // RTO users must not be able to see:
    // - Other RTO names
    // - Industry/host facility names
    // - Industry contact details
    // - Other organisations' information
    delete s.contactedIndustries;
    delete s.placementSite;
    delete s.facilityName;
    delete s.industryName;
    delete s.industryEmail;
    delete s.industryPhone;
    delete s.industryId;
    if (s.placementNotes) delete s.placementNotes;
    return s;
  }

  if (role === 'Student') {
    // Students should only see their own profile and placement information.
    // Must not see: RTO names/info about other RTOs, Industry/host facility names/contacts.
    delete s.contactedIndustries;
    delete s.coordinatorHistory;
    delete s.facilityName;
    delete s.industryName;
    delete s.industryEmail;
    delete s.industryPhone;
    delete s.industryId;
    delete s.rtoName;
    delete s.rtoId;
    return s;
  }

  if (role === 'Industry') {
    // Industry users see basic placement info for students assigned to their facility.
    // Must not see: internal notes, visa subclass, other RTO contact info, or unassigned contacts.
    delete s.coordinatorHistory;
    delete s.additionalNotes;
    return s;
  }

  return s;
};

export const sanitizeRtoDataForRole = (rtoDoc, role) => {
  if (!rtoDoc) return rtoDoc;
  const r = typeof rtoDoc.toObject === 'function' ? rtoDoc.toObject() : { ...rtoDoc };

  if (role === 'RTO Manager' || role === 'Student') {
    // Remove internal financial payouts or admin documents if appropriate
    delete r.payoutRate;
    delete r.coursePricing;
  }

  return r;
};
