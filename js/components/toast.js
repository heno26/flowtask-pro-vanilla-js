// Reusable toast notification region. Any page can call showToast() after
// importing this module — it lazily creates the region on first use.
let region = null;

function getRegion() {
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  return region;
}

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

export function showToast(message, type = 'info', duration = 3200) {
  const container = getRegion();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<strong aria-hidden="true">${ICONS[type] || ICONS.info}</strong><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease';
    setTimeout(() => toast.remove(), 220);
  }, duration);
}
