// Custom confirmation dialog used instead of window.confirm() for delete /
// reset / import-overwrite actions, per the app's design system.
import { openModal, closeModal } from './modal.js';
import { icon } from './icons.js';
import { getSettings } from '../state.js';

export function confirmDialog({ title, message, confirmLabel = 'Confirm', tone = 'danger' }) {
  return new Promise((resolve) => {
    const bodyHTML = `
      <div class="modal__header">
        <h3>${icon('warning')} ${title}</h3>
        <button class="btn btn--icon btn--ghost" data-action="cancel" aria-label="Close">${icon('close')}</button>
      </div>
      <div class="modal__body confirm-dialog">
        <p>${message}</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary" data-action="cancel">Cancel</button>
        <button class="btn btn--${tone === 'danger' ? 'danger' : 'primary'}" data-action="confirm">${confirmLabel}</button>
      </div>
    `;

    const { overlay } = openModal({
      bodyHTML,
      onClose: () => resolve(false),
    });

    overlay.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'confirm') {
        resolve(true);
        closeModal();
      } else if (action === 'cancel') {
        resolve(false);
        closeModal();
      }
    });
  });
}

// Used for routine delete actions (task/project) that the user can turn off
// via Settings → "Confirm before deleting". Reset and import-overwrite
// always confirm regardless of this preference, since they're workspace-wide.
export function confirmDeleteAction(options) {
  if (getSettings().confirmDelete === false) return Promise.resolve(true);
  return confirmDialog(options);
}
