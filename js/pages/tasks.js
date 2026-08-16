// Task List page: sortable/filterable table view of every task, with
// client-side pagination so large task sets stay fast to scroll.
import { initShell } from '../app.js';
import { subscribe, getTasks, getProjects } from '../state.js';
import { searchTasks, applyFilters, sortTasks, duplicateTask, deleteTask, updateTask } from '../services/taskService.js';
import { mountFilters } from '../components/filters.js';
import { openTaskForm } from '../components/taskForm.js';
import { confirmDeleteAction } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { formatDate, isOverdue } from '../utils/dates.js';
import { escapeHtml, clamp } from '../utils/helpers.js';
import { icon } from '../components/icons.js';
import { STATUSES } from '../constants.js';

initShell('tasks', { showSearch: true, searchPlaceholder: 'Search all tasks…' });

const PAGE_SIZE = 10;

const els = {
  filtersContainer: document.getElementById('filters-container'),
  tableBody: document.getElementById('tasks-table-body'),
  emptyState: document.getElementById('tasks-empty'),
  tableWrap: document.getElementById('tasks-table-wrap'),
  pagination: document.getElementById('pagination'),
  resultCount: document.getElementById('result-count'),
};

let searchQuery = '';
let currentPage = 1;
let filtersController = null;

function projectsById() {
  return Object.fromEntries(getProjects().map((p) => [p.id, p]));
}

function statusOptionsHTML(current) {
  return STATUSES.map((s) => `<option value="${s.id}" ${s.id === current ? 'selected' : ''}>${s.label}</option>`).join('');
}

function rowHTML(task, projectsMap) {
  const overdue = isOverdue(task.dueDate, task.status);
  return `
    <tr data-task-id="${task.id}">
      <td><span class="truncate" style="max-width:220px;display:inline-block;cursor:pointer;font-weight:500;" data-action="open">${escapeHtml(task.title)}</span></td>
      <td>${escapeHtml(projectsMap[task.projectId]?.name || '—')}</td>
      <td>
        <select data-action="change-status" aria-label="Change status for ${escapeHtml(task.title)}">${statusOptionsHTML(task.status)}</select>
      </td>
      <td><span class="badge badge--priority-${task.priority}">${task.priority}</span></td>
      <td>${escapeHtml(task.assignee) || '—'}</td>
      <td>${task.dueDate ? `<span class="${overdue ? 'text-sm' : 'text-sm'}" style="${overdue ? 'color:var(--color-danger);font-weight:600;' : ''}">${formatDate(task.dueDate)}</span>` : '—'}</td>
      <td>${task.tags.slice(0, 2).map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join(' ') || '—'}</td>
      <td class="text-xs text-muted">${formatDate(task.updatedAt.slice(0, 10))}</td>
      <td>
        <div class="data-table__actions">
          <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" aria-label="Edit task">${icon('edit')}</button>
          <button class="btn btn--icon btn--ghost btn--sm" data-action="duplicate" aria-label="Duplicate task">${icon('copy')}</button>
          <button class="btn btn--icon btn--ghost btn--sm" data-action="delete" aria-label="Delete task">${icon('trash')}</button>
        </div>
      </td>
    </tr>
  `;
}

function setupFilters() {
  const tasks = getTasks();
  const projects = getProjects().filter((p) => !p.archived);
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();
  const tags = [...new Set(tasks.flatMap((t) => t.tags))].sort();
  filtersController = mountFilters(els.filtersContainer, { projects, assignees, tags, showProjectFilter: true }, () => { currentPage = 1; render(); });
}

function render() {
  const projectsMap = projectsById();
  let tasks = searchTasks(getTasks(), searchQuery, projectsMap);
  tasks = applyFilters(tasks, filtersController.getFilters());
  tasks = sortTasks(tasks, filtersController.getSortBy());

  els.resultCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  els.emptyState.hidden = tasks.length > 0;
  els.tableWrap.hidden = tasks.length === 0;

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  currentPage = clamp(currentPage, 1, totalPages);
  const pageTasks = tasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  els.tableBody.innerHTML = pageTasks.map((task) => rowHTML(task, projectsMap)).join('');
  renderPagination(totalPages);
  wireRowEvents(tasks);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) { els.pagination.innerHTML = ''; return; }
  let buttons = '';
  for (let page = 1; page <= totalPages; page += 1) {
    buttons += `<button class="btn btn--secondary btn--sm" data-page="${page}" aria-current="${page === currentPage}">${page}</button>`;
  }
  els.pagination.innerHTML = `
    <button class="btn btn--ghost btn--sm" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">${icon('chevronLeft')}</button>
    ${buttons}
    <button class="btn btn--ghost btn--sm" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">${icon('chevronRight')}</button>
  `;
  els.pagination.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const { page } = button.dataset;
      if (page === 'prev') currentPage -= 1;
      else if (page === 'next') currentPage += 1;
      else currentPage = Number(page);
      render();
    });
  });
}

function wireRowEvents(tasks) {
  els.tableBody.querySelectorAll('tr').forEach((row) => {
    const task = tasks.find((t) => t.id === row.dataset.taskId);
    if (!task) return;

    row.querySelector('[data-action="open"]').addEventListener('click', () => {
      openTaskForm({ mode: 'view', task, onSaved: render });
    });
    row.querySelector('[data-action="edit"]').addEventListener('click', () => {
      openTaskForm({ mode: 'edit', task, onSaved: render });
    });
    row.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
      duplicateTask(task.id);
      showToast('Task duplicated.', 'success');
    });
    row.querySelector('[data-action="change-status"]').addEventListener('change', (event) => {
      updateTask(task.id, { status: event.target.value });
      showToast('Status updated.', 'success', 1500);
    });
    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      const confirmed = await confirmDeleteAction({
        title: 'Delete this task?',
        message: `Delete "${escapeHtml(task.title)}"? This cannot be undone.`,
        confirmLabel: 'Delete task',
      });
      if (confirmed) {
        deleteTask(task.id);
        showToast('Task deleted.', 'success');
      }
    });
  });
}

document.addEventListener('flowtask:search', (event) => { searchQuery = event.detail; currentPage = 1; render(); });

setupFilters();
subscribe(render);
render();
