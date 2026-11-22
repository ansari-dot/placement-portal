export const generateHumanDescription = (log) => {
  if (!log) return 'Portal modification';
  const actor = log.actorName || 'User';
  const resource = (log.resource || 'item').toLowerCase();
  const method = (log.method || 'POST').toUpperCase();
  const body = log.changes?.submitted?.body || {};
  const result = log.changes?.result?.data || log.changes?.result || {};

  if (log.action?.startsWith('reverted')) {
    return `${actor} reverted a previous change (${log.action})`;
  }

  if (resource === 'student') {
    const studentName =
      result.name ||
      body.name ||
      [result.firstName || body.firstName, result.lastName || body.lastName].filter(Boolean).join(' ') ||
      log.resourceId ||
      'Student';

    if (method === 'POST') {
      return `${actor} registered new student "${studentName}"`;
    }
    if (method === 'DELETE') {
      return `${actor} deleted student "${studentName}"`;
    }
    if (body.placementStatus) {
      return `${actor} changed placement status of "${studentName}" to "${body.placementStatus}"`;
    }
    if (body.assignedCoordinator || body.assignedCoordinatorName) {
      return `${actor} assigned student "${studentName}" to coordinator "${body.assignedCoordinatorName || 'Coordinator'}"`;
    }
    if (body.internshipPriority === 'Snooze' || body.snoozed === true) {
      return `${actor} snoozed student "${studentName}"`;
    }
    if (body.internshipPriority === 'Inactive' || body.status === 'Inactive') {
      return `${actor} marked student "${studentName}" as Inactive`;
    }
    if (body.industryId || body.assignedIndustryName) {
      return `${actor} assigned industry "${body.assignedIndustryName || 'Industry'}" to student "${studentName}"`;
    }
    const updatedKeys = Object.keys(body).filter((k) => !['_id', 'id', '__v'].includes(k));
    if (updatedKeys.length > 0) {
      return `${actor} updated ${updatedKeys.slice(0, 3).join(', ')} for student "${studentName}"`;
    }
    return `${actor} updated student profile for "${studentName}"`;
  }

  if (resource === 'industry') {
    const indName = result.companyName || body.companyName || result.name || body.name || log.resourceId || 'Industry';
    if (method === 'POST') {
      const site = body.placementSite ? `(${body.placementSite})` : '';
      return `${actor} added new Industry "${indName}" ${site}`.trim();
    }
    if (method === 'DELETE') {
      return `${actor} deleted industry "${indName}"`;
    }
    return `${actor} updated industry details for "${indName}"`;
  }

  if (resource === 'payment') {
    const stuName = result.studentName || body.studentName || 'Student';
    if (log.path?.includes('/remove')) {
      return `${actor} removed student "${stuName}" from Payment list`;
    }
    if (log.path?.includes('/restore')) {
      return `${actor} restored student "${stuName}" to Payment list`;
    }
    if (log.path?.includes('/manual-add')) {
      return `${actor} manually added student "${stuName}" to Payment list`;
    }
    if (body.paymentStatus) {
      return `${actor} updated payment status of "${stuName}" to "${body.paymentStatus}"`;
    }
    if (body.originalPrice !== undefined) {
      return `${actor} set custom fee of AUD $${body.originalPrice} for "${stuName}"`;
    }
    return `${actor} updated payment record for "${stuName}"`;
  }

  if (resource === 'appointment') {
    const stuName = body.studentName || result.studentName || 'Student';
    const comp = body.company || body.industryName || 'Industry';
    if (method === 'POST') {
      return `${actor} scheduled appointment for "${stuName}" with "${comp}"`;
    }
    return `${actor} updated appointment for "${stuName}"`;
  }

  if (resource === 'placement request') {
    const stuName = body.student || body.studentName || result.student || 'Student';
    const prio = body.priority || 'Normal';
    if (method === 'POST') {
      return `${actor} created ${prio} placement request for "${stuName}"`;
    }
    return `${actor} updated placement request priority to ${prio} for "${stuName}"`;
  }

  if (resource === 'rto') {
    const rtoName = body.name || result.name || log.resourceId || 'RTO';
    if (method === 'POST') return `${actor} created RTO profile "${rtoName}"`;
    if (method === 'DELETE') return `${actor} deleted RTO profile "${rtoName}"`;
    return `${actor} updated RTO profile "${rtoName}"`;
  }

  if (resource === 'user') {
    const userName = body.name || body.email || result.name || log.resourceId || 'User';
    if (method === 'POST') return `${actor} created user account "${userName}" (${body.role || 'User'})`;
    if (method === 'DELETE') return `${actor} deleted user account "${userName}"`;
    return `${actor} updated user account "${userName}"`;
  }

  const verb = method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated';
  return `${actor} ${verb} ${resource} (${log.resourceId || 'record'})`;
};
