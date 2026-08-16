// Renders a shared filter/sort toolbar for the Board and Task List pages.
// Keeps its own filter state and calls onChange(filters, sortBy) whenever
// something changes, so pages just re-render their task list.
import { STATUSES, PRIORITIES } from '../constants.js';
import { escapeHtml } from '../utils/helpers.js';

export function mountFilters(container, { projects, assignees, tags, showProjectFilter = true }, onChange) {
  const state = { filters: {}, sortBy: 'newest' };

  container.innerHTML = `
    <div class="filters-bar">
      ${showProjectFilter ? `
        <select id="filter-project" aria-label="Filter by project">
          <option value="">All projects</option>
          ${projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
        </select>` : ''}
      <select id="filter-status" aria-label="Filter by status">
        <option value="">All statuses</option>
        ${STATUSES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('')}
      </select>
      <select id="filter-priority" aria-label="Filter by priority">
        <option value="">All priorities</option>
        ${PRIORITIES.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}
      </select>
      <select id="filter-assignee" aria-label="Filter by assignee">
        <option value="">All assignees</option>
        ${assignees.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
      </select>
      <select id="filter-tag" aria-label="Filter by tag">
        <option value="">All tags</option>
        ${tags.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
      </select>
      <select id="filter-due" aria-label="Filter by due date">
        <option value="">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="dueToday">Due today</option>
        <option value="dueThisWeek">Due this week</option>
      </select>
      <select id="sort-by" aria-label="Sort tasks">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="due-date">Due date</option>
        <option value="priority">Priority</option>
        <option value="alphabetical">Alphabetical</option>
        <option value="recently-updated">Recently updated</option>
      </select>
      <button class="btn btn--ghost btn--sm" id="clear-filters">Clear filters</button>
    </div>
  `;

  function emit() {
    onChange({ ...state.filters }, state.sortBy);
  }

  function bindSelect(id, filterKey, transform = (v) => v || undefined) {
    const el = container.querySelector(id);
    el?.addEventListener('change', () => {
      const value = transform(el.value);
      if (value === undefined) delete state.filters[filterKey];
      else state.filters[filterKey] = value;
      emit();
    });
  }

  bindSelect('#filter-project', 'projectId');
  bindSelect('#filter-status', 'status');
  bindSelect('#filter-priority', 'priority');
  bindSelect('#filter-assignee', 'assignee');
  bindSelect('#filter-tag', 'tag');

  container.querySelector('#filter-due')?.addEventListener('change', (event) => {
    delete state.filters.overdue;
    delete state.filters.dueToday;
    delete state.filters.dueThisWeek;
    if (event.target.value) state.filters[event.target.value] = true;
    emit();
  });

  container.querySelector('#sort-by')?.addEventListener('change', (event) => {
    state.sortBy = event.target.value;
    emit();
  });

  container.querySelector('#clear-filters')?.addEventListener('click', () => {
    state.filters = {};
    state.sortBy = 'newest';
    container.querySelectorAll('select').forEach((select) => { select.value = ''; });
    const sortSelect = container.querySelector('#sort-by');
    if (sortSelect) sortSelect.value = 'newest';
    emit();
  });

  return {
    getFilters: () => ({ ...state.filters }),
    getSortBy: () => state.sortBy,
    setProjectFilter(projectId) {
      const el = container.querySelector('#filter-project');
      if (el) el.value = projectId || '';
      if (projectId) state.filters.projectId = projectId;
      else delete state.filters.projectId;
      emit();
    },
  };
}
