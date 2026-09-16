// src/utils/dateCalculation.js

/**
 * Parses time string like "09:00 AM" or "5:00 PM" into decimal hours
 */
function parseTimeToHours(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours + minutes / 60;
}

/**
 * Calculates daily working hours from availabilityFrom and availabilityTo.
 * Defaults to 8 hours/day if not specified or invalid.
 */
export function getDailyWorkingHours(fromStr, toStr) {
  const from = parseTimeToHours(fromStr);
  const to = parseTimeToHours(toStr);
  if (from !== null && to !== null && to > from) {
    const diff = to - from;
    if (diff >= 1 && diff <= 12) return diff;
  }
  return 8; // Default standard 8-hour workday
}

/**
 * Normalizes availability days into an array of JS day numbers (0 = Sun, 1 = Mon, ..., 6 = Sat)
 */
export function getAvailableDayIndices(availabilityDays) {
  const DAY_MAP = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };

  if (!availabilityDays) {
    // Default to standard working days (Mon - Fri)
    return [1, 2, 3, 4, 5];
  }

  const indices = new Set();

  if (Array.isArray(availabilityDays)) {
    availabilityDays.forEach((d) => {
      const k = String(d).trim().toLowerCase();
      if (DAY_MAP[k] !== undefined) indices.add(DAY_MAP[k]);
    });
  } else if (typeof availabilityDays === 'object') {
    // Handle Map or Object like { Mon: true, Tue: true, Wed: false }
    const entries = availabilityDays instanceof Map
      ? Array.from(availabilityDays.entries())
      : Object.entries(availabilityDays);

    entries.forEach(([key, val]) => {
      if (val === true || val === 'true') {
        const k = String(key).trim().toLowerCase();
        if (DAY_MAP[k] !== undefined) indices.add(DAY_MAP[k]);
      }
    });
  }

  // If no days were marked as available, fallback to Mon-Fri
  return indices.size > 0 ? Array.from(indices).sort() : [1, 2, 3, 4, 5];
}

/**
 * Calculates the exact expected completion (End) Date for a student placement.
 * 
 * @param {string|Date} commencementDate - Start date (YYYY-MM-DD or Date)
 * @param {number|string} placementHours - Required placement hours (e.g. 120, 240)
 * @param {Object|Array} availabilityDays - Student available days (e.g. { Mon: true, Tue: true })
 * @param {string} [availabilityFrom] - e.g. "09:00 AM"
 * @param {string} [availabilityTo] - e.g. "05:00 PM"
 * @returns {string} - Calculated End Date in 'YYYY-MM-DD' format
 */
export function calculatePlacementEndDate(
  commencementDate,
  placementHours,
  availabilityDays,
  availabilityFrom = '09:00 AM',
  availabilityTo = '05:00 PM'
) {
  if (!commencementDate) return '';

  const startDate = new Date(commencementDate);
  if (isNaN(startDate.getTime())) return '';

  const totalHours = Number(placementHours);
  if (!totalHours || totalHours <= 0) {
    // Fallback: 12 weeks standard duration if placement hours not specified
    const defaultEnd = new Date(startDate);
    defaultEnd.setDate(defaultEnd.getDate() + 12 * 7);
    return defaultEnd.toISOString().split('T')[0];
  }

  const hoursPerDay = getDailyWorkingHours(availabilityFrom, availabilityTo);
  const availableDayIndices = getAvailableDayIndices(availabilityDays);

  // We iterate day by day starting on commencementDate
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  let accumulatedHours = 0;
  let safetyLimit = 730; // Max 2 years loop limit to prevent infinite loops

  while (accumulatedHours < totalHours && safetyLimit > 0) {
    safetyLimit--;
    const dayOfWeek = current.getDay();

    if (availableDayIndices.includes(dayOfWeek)) {
      accumulatedHours += hoursPerDay;
      if (accumulatedHours >= totalHours) {
        break; // Target hours achieved!
      }
    }

    current.setDate(current.getDate() + 1);
  }

  // Format as YYYY-MM-DD
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Returns a human-friendly summary of the calculation.
 */
export function getCalculationSummary(placementHours, availabilityDays, availabilityFrom, availabilityTo) {
  const totalHours = Number(placementHours) || 0;
  if (!totalHours) return null;

  const hoursPerDay = getDailyWorkingHours(availabilityFrom, availabilityTo);
  const availableIndices = getAvailableDayIndices(availabilityDays);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDaysStr = availableIndices.map((i) => dayNames[i]).join(', ');
  const totalDaysNeeded = Math.ceil(totalHours / hoursPerDay);

  return `${totalHours} hrs ÷ ${hoursPerDay} hrs/day = ${totalDaysNeeded} shifts across [${activeDaysStr}]`;
}
