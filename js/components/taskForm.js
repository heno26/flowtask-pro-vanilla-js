// Reusable task modal — used for create, edit, and read-only view. Owns its
// own validation and talks to taskService for persistence.
//
// Implementation note: openModal() creates the overlay once; rerenderInPlace()
// only replaces the inner .modal markup (for live tag/subtask edits without
// closing the dialog). All event listeners are therefore attached ONCE to
// the overlay via delegation — attaching them again on every rerender would
// stack duplicate handlers and fire actions (like "save") multiple times.
import { openModal, closeModal } from './modal.js';
import { confirmDeleteAction } from './confirmDialog.js';
import { icon } from './icons.js';
import { getProjects } from '../state.js';
import { createTask, updateTask, deleteTask, duplicateTask, toggleSubtask } from '../services/taskService.js';
import { requiredString, optionalString, validDateOrEmpty, normalizeTag } from '../utils/validation.js';
import { createId } from '../utils/ids.js';
import { escapeHtml } from '../utils/helpers.js';
import { STATUSES, PRIORITIES } from '../constants.js';
import { showToast } from './toast.js';

function optionsHTML(items, selectedId) {
  return items.map((item) => `<option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('');
}

function tagChipsHTML(tags) {
  return tags.map((tag) => `
    <span class="tag-chip" data-tag="${escapeHtml(tag)}">
      ${escapeHtml(tag)}
      <button type="button" data-action="remove-tag" data-tag="${escapeHtml(tag)}" aria-label="Remove tag ${escapeHtml(tag)}">${icon('close')}</button>
    </span>
  `).join('');
}

function subtaskRowsHTML(subtasks) {
  if (!subtasks.length) return '<p class="text-xs text-muted">No subtasks yet.</p>';
  return subtasks.map((subtask) => `
    <div class="subtask-row" data-subtask-id="${subtask.id}">
      <input type="checkbox" ${subtask.completed ? 'checked' : ''} data-action="toggle-subtask" aria-label="Mark subtask complete" />
      <input type="text" value="${escapeHtml(subtask.title)}" data-action="rename-subtask" aria-label="Subtask title" />
      <button type="button" class="btn btn--icon btn--ghost btn--sm" data-action="remove-subtask" aria-label="Remove subtask">${icon('close')}</button>
    </div>
  `).join('');
}

function formBodyHTML({ mode, draft, tags, subtasks, projects }) {
  const isView = mode === 'view';
  const heading = mode === 'create' ? 'New task' : mode === 'edit' ? 'Edit task' : 'Task details';

  return `
    <div class="modal__header">
      <h3>${heading}</h3>
      <button class="btn btn--icon btn--ghost" data-action="close" aria-label="Close">${icon('close')}</button>
    </div>
    <form class="modal__body" id="task-form" novalidate>
      <div class="form-field">
        <label for="task-title">Title</label>
        <input id="task-title" name="title" type="text" maxlength="120" value="${escapeHtml(draft.title)}" ${isView ? 'readonly' : 'required'} />
        <span class="form-error" data-error-for="title"></span>
      </div>

      <div class="form-field">
        <label for="task-description">Description</label>
        <textarea id="task-description" name="description" rows="3" maxlength="500" ${isView ? 'readonly' : ''}>${escapeHtml(draft.description)}</textarea>
        <span class="form-error" data-error-for="description"></span>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="task-project">Project</label>
          <select id="task-project" name="projectId" ${isView ? 'disabled' : 'required'}>${optionsHTML(projects.map((p) => ({ id: p.id, label: p.name })), draft.projectId)}</select>
        </div>
        <div class="form-field">
          <label for="task-status">Status</label>
          <select id="task-status" name="status" ${isView ? 'disabled' : ''}>${optionsHTML(STATUSES, draft.status)}</select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="task-priority">Priority</label>
          <select id="task-priority" name="priority" ${isView ? 'disabled' : ''}>${optionsHTML(PRIORITIES, draft.priority)}</select>
        </div>
        <div class="form-field">
          <label for="task-due">Due date</label>
          <input id="task-due" name="dueDate" type="date" value="${draft.dueDate || ''}" ${isView ? 'readonly' : ''} />
          <span class="form-error" data-error-for="dueDate"></span>
        </div>
      </div>

      <div class="form-field">
        <label for="task-assignee">Assignee</label>
        <input id="task-assignee" name="assignee" type="text" maxlength="60" value="${escapeHtml(draft.assignee)}" ${isView ? 'readonly' : ''} />
      </div>

      <div class="form-field">
        <label for="tag-input-field">Tags</label>
        <div class="tag-input" id="tag-input-container">
          ${tagChipsHTML(tags)}
          ${isView ? '' : '<input type="text" id="tag-input-field" placeholder="Add a tag, press Enter" />'}
        </div>
      </div>

      <div class="form-field">
        <label>Subtasks</label>
        <div id="subtask-list">${subtaskRowsHTML(subtasks)}</div>
        ${isView ? '' : `<button type="button" class="btn btn--secondary btn--sm" data-action="add-subtask" style="align-self:flex-start;">${icon('plus')} Add subtask</button>`}
      </div>
    </form>
    <div class="modal__footer">
      ${mode === 'view' ? `
        <button class="btn btn--secondary" data-action="duplicate">${icon('copy')} Duplicate</button>
        <button class="btn btn--danger" data-action="delete">${icon('trash')} Delete</button>
        <button class="btn btn--primary" data-action="edit">${icon('edit')} Edit</button>
      ` : `
        <button class="btn btn--secondary" data-action="close">Cancel</button>
        <button class="btn btn--primary" data-action="save">${mode === 'create' ? 'Create task' : 'Save changes'}</button>
      `}
    </div>
  `;
}

function validateForm(formEl) {
  const values = Object.fromEntries(new FormData(formEl).entries());
  const errors = {
    title: requiredString(values.title, 'Title'),
    description: optionalString(values.description, 'Description'),
    dueDate: validDateOrEmpty(values.dueDate, 'Due date'),
  };
  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = formEl.querySelector(`[data-error-for="${field}"]`);
    if (errorEl) errorEl.textContent = message;
    formEl.querySelector(`[name="${field}"]`)?.setAttribute('data-touched', 'true');
  });
  const isValid = Object.values(errors).every((message) => !message);
  return { isValid, values };
}

export function openTaskForm({ mode = 'create', task = null, defaults = {}, onSaved } = {}) {
  let currentMode = mode;
  const projects = getProjects().filter((p) => !p.archived);

  // Single source of truth for every editable field, seeded from the task
  // being edited or from sensible defaults for a new one. Tag/subtask edits
  // trigger a full form re-render (see renderBody), so — unlike reading
  // straight from `task` — this draft is re-synced from the live DOM before
  // every re-render, which is what keeps in-progress typing from being lost.
  const draft = task
    ? { title: task.title, description: task.description, projectId: task.projectId, status: task.status, priority: task.priority, assignee: task.assignee, dueDate: task.dueDate }
    : {
        title: '', description: '', projectId: defaults.projectId || projects[0]?.id || '',
        status: defaults.status || 'backlog', priority: 'medium', assignee: '', dueDate: defaults.dueDate || '',
      };

  let currentTags = task ? [...task.tags] : [];
  let currentSubtasks = task ? task.subtasks.map((s) => ({ ...s })) : [];

  const { overlay, modalEl } = openModal({
    bodyHTML: formBodyHTML({ mode: currentMode, draft, tags: currentTags, subtasks: currentSubtasks, projects }),
    wide: false,
  });

  function syncDraftFromDOM() {
    const formEl = modalEl.querySelector('#task-form');
    if (!formEl || currentMode === 'view') return;
    draft.title = formEl.querySelector('#task-title')?.value ?? draft.title;
    draft.description = formEl.querySelector('#task-description')?.value ?? draft.description;
    draft.projectId = formEl.querySelector('#task-project')?.value ?? draft.projectId;
    draft.status = formEl.querySelector('#task-status')?.value ?? draft.status;
    draft.priority = formEl.querySelector('#task-priority')?.value ?? draft.priority;
    draft.assignee = formEl.querySelector('#task-assignee')?.value ?? draft.assignee;
    draft.dueDate = formEl.querySelector('#task-due')?.value ?? draft.dueDate;

    // Subtask titles/checked-state can also be mid-edit when a tag change
    // triggers this sync, so preserve those too before the DOM is replaced.
    const rows = [...modalEl.querySelectorAll('[data-subtask-id]')];
    if (rows.length === currentSubtasks.length) {
      rows.forEach((row, i) => {
        currentSubtasks[i].title = row.querySelector('[data-action="rename-subtask"]')?.value ?? currentSubtasks[i].title;
        currentSubtasks[i].completed = row.querySelector('[data-action="toggle-subtask"]')?.checked ?? currentSubtasks[i].completed;
      });
    }
  }

  function renderBody() {
    syncDraftFromDOM();
    modalEl.innerHTML = formBodyHTML({ mode: currentMode, draft, tags: currentTags, subtasks: currentSubtasks, projects });
  }

  // ---- Delegated listeners, attached exactly once for this modal's lifetime ----

  overlay.addEventListener('keydown', (event) => {
    if (event.target.id !== 'tag-input-field') return;
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const value = normalizeTag(event.target.value);
      if (value && !currentTags.includes(value)) {
        currentTags.push(value);
        renderBody();
      } else {
        event.target.value = '';
      }
    }
  });

  overlay.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'close') {
      closeModal();
    } else if (action === 'add-subtask') {
      currentSubtasks.push({ id: createId('subtask'), title: '', completed: false });
      renderBody();
      modalEl.querySelector('.subtask-row:last-child input[type="text"]')?.focus();
    } else if (action === 'remove-tag') {
      currentTags = currentTags.filter((tag) => tag !== target.dataset.tag);
      renderBody();
    } else if (action === 'remove-subtask') {
      const row = target.closest('[data-subtask-id]');
      currentSubtasks = currentSubtasks.filter((s) => s.id !== row.dataset.subtaskId);
      renderBody();
    } else if (action === 'edit') {
      currentMode = 'edit';
      renderBody();
    } else if (action === 'duplicate') {
      duplicateTask(task.id);
      showToast('Task duplicated.', 'success');
      closeModal();
      onSaved?.();
    } else if (action === 'delete') {
      const confirmed = await confirmDeleteAction({
        title: 'Delete this task?',
        message: 'This permanently removes the task and its subtasks. This cannot be undone.',
        confirmLabel: 'Delete task',
      });
      if (confirmed) {
        deleteTask(task.id);
        showToast('Task deleted.', 'success');
        closeModal();
        onSaved?.();
      }
    } else if (action === 'save') {
      const formEl = modalEl.querySelector('#task-form');
      const { isValid, values } = validateForm(formEl);
      if (!isValid) return;

      // Pull final subtask titles/checked state straight from the DOM.
      const subtaskRows = [...modalEl.querySelectorAll('[data-subtask-id]')];
      const subtasks = subtaskRows
        .map((row) => ({
          id: row.dataset.subtaskId,
          title: row.querySelector('[data-action="rename-subtask"]').value.trim(),
          completed: row.querySelector('[data-action="toggle-subtask"]').checked,
        }))
        .filter((s) => s.title.length > 0);

      const payload = {
        title: values.title.trim(),
        description: (values.description || '').trim(),
        projectId: values.projectId,
        status: values.status,
        priority: values.priority,
        assignee: (values.assignee || '').trim(),
        dueDate: values.dueDate || '',
        tags: currentTags,
        subtasks,
      };

      if (currentMode === 'create') {
        createTask(payload);
        showToast('Task created.', 'success');
      } else {
        updateTask(task.id, payload);
        showToast('Task updated.', 'success');
      }
      closeModal();
      onSaved?.();
    }
  });

  // Live subtask completion toggling while in read-only "view" mode.
  overlay.addEventListener('change', (event) => {
    if (event.target.dataset.action !== 'toggle-subtask') return;
    if (currentMode !== 'view' || !task) return;
    const subtaskId = event.target.closest('[data-subtask-id]').dataset.subtaskId;
    toggleSubtask(task.id, subtaskId);
  });
}
