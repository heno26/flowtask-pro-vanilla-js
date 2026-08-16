// Create/Edit project modal. Small enough to not need its own file split
// the way taskForm.js does, but kept separate from the projects page logic.
import { openModal, closeModal } from './modal.js';
import { icon } from './icons.js';
import { createProject, updateProject } from '../services/projectService.js';
import { requiredString, optionalString, validDateOrEmpty, validDateRange } from '../utils/validation.js';
import { escapeHtml } from '../utils/helpers.js';
import { PROJECT_COLORS } from '../constants.js';
import { showToast } from './toast.js';

function swatchesHTML(selected) {
  return PROJECT_COLORS.map((color) => `
    <button type="button" class="project-card__color" data-color="${color}"
      style="background:${color};width:22px;height:22px;border:2px solid ${color === selected ? 'var(--color-ink)' : 'transparent'};cursor:pointer;"
      aria-label="Choose color ${color}" aria-pressed="${color === selected}"></button>
  `).join('');
}

export function openProjectForm({ mode = 'create', project = null, onSaved } = {}) {
  let selectedColor = project?.color || PROJECT_COLORS[0];

  const bodyHTML = () => `
    <div class="modal__header">
      <h3>${mode === 'create' ? 'New project' : 'Edit project'}</h3>
      <button class="btn btn--icon btn--ghost" data-action="close" aria-label="Close">${icon('close')}</button>
    </div>
    <form class="modal__body" id="project-form" novalidate>
      <div class="form-field">
        <label for="project-name">Name</label>
        <input id="project-name" name="name" type="text" maxlength="80" value="${escapeHtml(project?.name || '')}" required />
        <span class="form-error" data-error-for="name"></span>
      </div>
      <div class="form-field">
        <label for="project-description">Description</label>
        <textarea id="project-description" name="description" rows="3" maxlength="300">${escapeHtml(project?.description || '')}</textarea>
        <span class="form-error" data-error-for="description"></span>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="project-start">Start date</label>
          <input id="project-start" name="startDate" type="date" value="${project?.startDate || ''}" />
        </div>
        <div class="form-field">
          <label for="project-due">Due date</label>
          <input id="project-due" name="dueDate" type="date" value="${project?.dueDate || ''}" />
          <span class="form-error" data-error-for="dueDate"></span>
        </div>
      </div>
      <div class="form-field">
        <label>Accent color</label>
        <div class="flex gap-2" id="color-swatches">${swatchesHTML(selectedColor)}</div>
      </div>
    </form>
    <div class="modal__footer">
      <button class="btn btn--secondary" data-action="close">Cancel</button>
      <button class="btn btn--primary" data-action="save">${mode === 'create' ? 'Create project' : 'Save changes'}</button>
    </div>
  `;

  const { overlay } = openModal({ bodyHTML: bodyHTML() });

  overlay.querySelector('#color-swatches').addEventListener('click', (event) => {
    const swatch = event.target.closest('[data-color]');
    if (!swatch) return;
    selectedColor = swatch.dataset.color;
    overlay.querySelectorAll('[data-color]').forEach((el) => {
      el.style.border = `2px solid ${el.dataset.color === selectedColor ? 'var(--color-ink)' : 'transparent'}`;
      el.setAttribute('aria-pressed', String(el.dataset.color === selectedColor));
    });
  });

  overlay.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close') {
      closeModal();
    } else if (action === 'save') {
      const formEl = overlay.querySelector('#project-form');
      const values = Object.fromEntries(new FormData(formEl).entries());
      const errors = {
        name: requiredString(values.name, 'Name', 80),
        description: optionalString(values.description, 'Description', 300),
        dueDate: validDateOrEmpty(values.dueDate, 'Due date') || validDateRange(values.startDate, values.dueDate, 'the start date', 'Due date'),
      };
      Object.entries(errors).forEach(([field, message]) => {
        const errorEl = overlay.querySelector(`[data-error-for="${field}"]`);
        if (errorEl) errorEl.textContent = message;
      });
      if (Object.values(errors).some(Boolean)) return;

      const payload = { ...values, color: selectedColor };
      if (mode === 'create') {
        createProject(payload);
        showToast('Project created.', 'success');
      } else {
        updateProject(project.id, payload);
        showToast('Project updated.', 'success');
      }
      closeModal();
      onSaved?.();
    }
  });
}
