// Kanban board: primary task workspace with native drag-and-drop, search,
// filters, sorting, and a project selector driven by the ?project= query param.
import { initShell } from '../app.js';
import { subscribe, getTasks, getProjects } from '../state.js';
import { moveTaskStatus, searchTasks, applyFilters, sortTasks } from '../services/taskService.js';
import { projectProgress } from '../services/projectService.js';
import { renderTaskCard } from '../components/taskCard.js';
import { mountFilters } from '../components/filters.js';
import { openTaskForm } from '../components/taskForm.js';
import { showToast } from '../components/toast.js';
import { getQueryParam, escapeHtml } from '../utils/helpers.js';
import { STATUSES } from '../constants.js';
import { icon } from '../components/icons.js';

initShell('board', { showSearch: true, searchPlaceholder: 'Search this board…' });

const els = {
  projectSelect: document.getElementById('board-project-select'),
  board: document.getElementById('board'),
  boardEmpty: document.getElementById('board-empty'),
  filtersContainer: document.getElementById('filters-container'),
  progressFill: document.getElementById('board-progress-fill'),
  progressLabel: document.getElementById('board-progress-label'),
};

let activeProjectId = getQueryParam('project') || '';
let searchQuery = '';
let filtersController = null;
let draggedTaskId = null;

function projectsById() {
  return Object.fromEntries(getProjects().map((p) => [p.id, p]));
}

function populateProjectSelect() {
  const projects = getProjects().filter((p) => !p.archived);
  if (!activeProjectId || !projects.some((p) => p.id === activeProjectId)) {
    activeProjectId = projects[0]?.id || '';
  }
  els.projectSelect.innerHTML = projects.map((p) => `<option value="${p.id}" ${p.id === activeProjectId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
}

function setupFilters() {
  const tasks = getTasks();
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();
  const tags = [...new Set(tasks.flatMap((t) => t.tags))].sort();
  filtersController = mountFilters(els.filtersContainer, { projects: [], assignees, tags, showProjectFilter: false }, render);
}

function columnHTML(status, tasks) {
  const columnTasks = tasks.filter((t) => t.status === status.id);
  return `
    <div class="board-column" data-status="${status.id}">
      <div class="board-column__header">
        <span class="board-column__title">${status.label} <span class="board-column__count">${columnTasks.length}</span></span>
        <button class="btn btn--icon btn--ghost btn--sm" data-action="collapse" aria-label="Collapse column">${icon('chevronDown')}</button>
      </div>
      <div class="board-column__list" data-status-drop="${status.id}" role="list" aria-label="${status.label} tasks">
        ${columnTasks.map(renderTaskCard).join('') || `<p class="text-xs text-muted" style="padding:var(--space-2);">No tasks here.</p>`}
      </div>
      <button class="btn btn--secondary btn--sm w-full board-column__add" data-add-status="${status.id}">${icon('plus')} Add task</button>
    </div>
  `;
}

function render() {
  populateProjectSelect();
  if (!activeProjectId) {
    els.board.innerHTML = '';
    els.boardEmpty.hidden = false;
    els.progressFill.style.width = '0%';
    els.progressLabel.textContent = '0%';
    return;
  }
  els.boardEmpty.hidden = true;

  const allTasks = getTasks().filter((t) => t.projectId === activeProjectId);
  const filters = filtersController.getFilters();
  const sortBy = filtersController.getSortBy();

  let visibleTasks = searchTasks(allTasks, searchQuery, projectsById());
  visibleTasks = applyFilters(visibleTasks, filters);
  visibleTasks = sortTasks(visibleTasks, sortBy);

  els.board.innerHTML = STATUSES.map((status) => columnHTML(status, visibleTasks)).join('');

  const project = getProjects().find((p) => p.id === activeProjectId);
  if (project) {
    const progress = projectProgress(project, getTasks());
    els.progressFill.style.width = `${progress.percent}%`;
    els.progressLabel.textContent = `${progress.percent}% (${progress.done}/${progress.total})`;
  }

  wireBoardEvents(allTasks);
}

function wireBoardEvents(projectTasks) {
  els.board.querySelectorAll('.task-card').forEach((card) => {
    card.addEventListener('click', () => openTask(card.dataset.taskId));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openTask(card.dataset.taskId); }
    });
    card.addEventListener('dragstart', () => {
      draggedTaskId = card.dataset.taskId;
      card.classList.add('is-dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
  });

  els.board.querySelectorAll('[data-status-drop]').forEach((list) => {
    list.addEventListener('dragover', (event) => {
      event.preventDefault();
      list.classList.add('is-drop-target');
    });
    list.addEventListener('dragleave', () => list.classList.remove('is-drop-target'));
    list.addEventListener('drop', (event) => {
      event.preventDefault();
      list.classList.remove('is-drop-target');
      if (draggedTaskId) {
        moveTaskStatus(draggedTaskId, list.dataset.statusDrop);
        showToast('Task moved.', 'success', 1600);
      }
      draggedTaskId = null;
    });
  });

  els.board.querySelectorAll('[data-add-status]').forEach((button) => {
    button.addEventListener('click', () => {
      openTaskForm({ mode: 'create', defaults: { projectId: activeProjectId, status: button.dataset.addStatus }, onSaved: render });
    });
  });

  els.board.querySelectorAll('[data-action="collapse"]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.board-column').classList.toggle('is-collapsed');
    });
  });

  function openTask(taskId) {
    const task = projectTasks.find((t) => t.id === taskId);
    if (task) openTaskForm({ mode: 'view', task, onSaved: render });
  }
}

els.projectSelect.addEventListener('change', () => {
  activeProjectId = els.projectSelect.value;
  const url = new URL(window.location.href);
  url.searchParams.set('project', activeProjectId);
  window.history.replaceState({}, '', url);
  render();
});

document.addEventListener('flowtask:search', (event) => { searchQuery = event.detail; render(); });

setupFilters();
subscribe(render);
render();
