// Generic modal shell with focus trapping, Escape-to-close, and
// click-outside-to-close. Components like taskForm/confirmDialog build on
// top of this instead of re-implementing modal plumbing.
let activeModal = null;

function trapFocus(event, root) {
  if (event.key !== 'Tab') return;
  const focusable = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function openModal({ bodyHTML, wide = false, onClose, closeOnOverlay = true }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true">${bodyHTML}</div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const modalEl = overlay.querySelector('.modal');
  const previouslyFocused = document.activeElement;

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      close();
    } else {
      trapFocus(event, modalEl);
    }
  }

  function handleOverlayClick(event) {
    if (closeOnOverlay && event.target === overlay) close();
  }

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    activeModal = null;
    onClose?.();
  }

  document.addEventListener('keydown', handleKeydown);
  overlay.addEventListener('click', handleOverlayClick);

  const firstField = modalEl.querySelector('input, textarea, select, button');
  firstField?.focus();

  activeModal = { overlay, modalEl, close };
  return activeModal;
}

export function closeModal() {
  activeModal?.close();
}

export function getActiveModalEl() {
  return activeModal?.modalEl ?? null;
}
