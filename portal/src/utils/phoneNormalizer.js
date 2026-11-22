/**
 * Frontend phone normalization utility.
 */

export function normalizePhone(input) {
  if (!input) return { raw: '', digits: '', core: '', variants: [] };
  const raw = String(input).trim();
  let digits = raw.replace(/\D/g, '');

  let core = digits;
  if (digits.startsWith('61') && digits.length >= 11) {
    core = digits.slice(2);
  }
  if (core.startsWith('0') && core.length >= 10) {
    core = core.slice(1);
  }

  const variants = new Set();
  if (core.length >= 6) {
    variants.add(core);
    variants.add(`0${core}`);
    variants.add(`61${core}`);
    variants.add(`+61${core}`);
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

export function isPhoneMatch(query, targetPhone) {
  if (!query || !targetPhone) return false;
  const qNorm = normalizePhone(query);
  const tNorm = normalizePhone(targetPhone);

  if (qNorm.core && tNorm.core && (qNorm.core.includes(tNorm.core) || tNorm.core.includes(qNorm.core))) {
    return true;
  }
  if (qNorm.digits && tNorm.digits && (tNorm.digits.includes(qNorm.digits) || qNorm.digits.includes(tNorm.digits))) {
    return true;
  }
  return false;
}
