// Date helpers used across pages. All functions work with plain
// "YYYY-MM-DD" strings for storage and native Date objects for display/math.

export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(isoString) {
  if (!isoString) return null;
  const [y, m, d] = isoString.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isOverdue(isoDueDate, status) {
  if (!isoDueDate || status === 'done') return false;
  return isoDueDate < todayISO();
}

export function isDueToday(isoDueDate) {
  return isoDueDate === todayISO();
}

export function isDueThisWeek(isoDueDate) {
  if (!isoDueDate) return false;
  const due = parseISODate(isoDueDate);
  const now = new Date();
  const in7 = new Date();
  in7.setDate(now.getDate() + 7);
  return due >= startOfDay(now) && due <= in7;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDate(isoString, options = { month: 'short', day: 'numeric' }) {
  const date = parseISODate(isoString);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, options);
}

export function formatDateTime(isoTimestamp) {
  if (!isoTimestamp) return '—';
  const date = new Date(isoTimestamp);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function daysBetween(isoA, isoB) {
  const a = parseISODate(isoA);
  const b = parseISODate(isoB);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}

export function getMonthMatrix(year, month) {
  // Returns a 6x7 matrix of Date objects covering the visible month grid,
  // including leading/trailing days from adjacent months.
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks = [];
  let cursor = new Date(gridStart);
  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}

export function isSameDay(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();
}
