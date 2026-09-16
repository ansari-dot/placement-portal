// backend/utils/dateCalculation.js

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

export function getDailyWorkingHours(fromStr, toStr) {
  const from = parseTimeToHours(fromStr);
  const to = parseTimeToHours(toStr);
  if (from !== null && to !== null && to > from) {
    const diff = to - from;
    if (diff >= 1 && diff <= 12) return diff;
  }
  return 8;
}

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
    return [1, 2, 3, 4, 5];
  }

  const indices = new Set();

  if (Array.isArray(availabilityDays)) {
    availabilityDays.forEach((d) => {
      const k = String(d).trim().toLowerCase();
      if (DAY_MAP[k] !== undefined) indices.add(DAY_MAP[k]);
    });
  } else if (typeof availabilityDays === 'object') {
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

  return indices.size > 0 ? Array.from(indices).sort() : [1, 2, 3, 4, 5];
}

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
    const defaultEnd = new Date(startDate);
    defaultEnd.setDate(defaultEnd.getDate() + 12 * 7);
    return defaultEnd.toISOString().split('T')[0];
  }

  const hoursPerDay = getDailyWorkingHours(availabilityFrom, availabilityTo);
  const availableDayIndices = getAvailableDayIndices(availabilityDays);

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  let accumulatedHours = 0;
  let safetyLimit = 730;

  while (accumulatedHours < totalHours && safetyLimit > 0) {
    safetyLimit--;
    const dayOfWeek = current.getDay();

    if (availableDayIndices.includes(dayOfWeek)) {
      accumulatedHours += hoursPerDay;
      if (accumulatedHours >= totalHours) {
        break;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
