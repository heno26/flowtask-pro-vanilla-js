// Small ID generator. Not cryptographically strong — good enough for a
// client-only demo app where IDs just need to be unique within LocalStorage.
function randomSegment() {
  return Math.random().toString(36).slice(2, 9);
}

export function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${randomSegment()}`;
}
