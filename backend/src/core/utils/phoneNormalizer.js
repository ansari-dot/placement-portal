/**
 * Australian phone number normalization helper.
 * Handles:
 * - 412345678 (9 digits without leading 0)
 * - 0412345678 (10 digits with leading 0)
 * - +61412345678 (international with +)
 * - 61412345678 (international without +)
 * - Phone numbers with spaces, dashes, brackets, etc.
 */

export function normalizePhone(input) {
  if (!input) return { raw: '', digits: '', core: '', variants: [] };
  const raw = String(input).trim();
  // Strip everything except digits
  let digits = raw.replace(/\D/g, '');

  let core = digits;
  // If starts with 61 (Australia country code) and has 11 digits: 61412345678 -> 412345678
  if (digits.startsWith('61') && digits.length >= 11) {
    core = digits.slice(2);
  }
  // If starts with 0: 0412345678 -> 412345678
  if (core.startsWith('0') && core.length >= 10) {
    core = core.slice(1);
  }

  const variants = new Set();
  if (core.length >= 6) {
    variants.add(core); // 412345678
    variants.add(`0${core}`); // 0412345678
    variants.add(`61${core}`); // 61412345678
    variants.add(`+61${core}`); // +61412345678
  }
  if (digits.length >= 6) {
    variants.add(digits);
  }

  return {
    raw,
    digits,
    core,
    variants: Array.from(variants),
  };
}

/**
 * Builds a MongoDB regex array or pattern to match phone numbers in any format.
 */
export function buildPhoneSearchPatterns(input) {
  const { core, digits, raw } = normalizePhone(input);
  const patterns = [];

  if (core && core.length >= 6) {
    // Escaped pattern that matches core with optional leading +61, 61, or 0, and optional spaces/dashes between digits
    const flexiblePattern = core.split('').join('[\\s\\-\\(\\)]*');
    patterns.push(`(?:\\+?61|0)?[\\s\\-\\(\\)]*${flexiblePattern}`);
  } else if (digits.length >= 3) {
    patterns.push(digits);
  } else if (raw) {
    patterns.push(raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }

  return patterns;
}
