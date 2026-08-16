// Shared form validation. Each validator returns an error string, or empty
// string when the value is valid, so callers can render inline messages.

export function requiredString(value, label, maxLength = 120) {
  const trimmed = (value || '').trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > maxLength) return `${label} must be under ${maxLength} characters.`;
  return '';
}

export function optionalString(value, label, maxLength = 500) {
  if (value && value.length > maxLength) return `${label} must be under ${maxLength} characters.`;
  return '';
}

export function validDateOrEmpty(value, label) {
  if (!value) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? '' : `${label} must be a valid date.`;
}

export function validDateRange(startValue, endValue, startLabel, endLabel) {
  if (!startValue || !endValue) return '';
  return startValue <= endValue ? '' : `${endLabel} must be on or after ${startLabel}.`;
}

export function normalizeTag(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 24);
}
