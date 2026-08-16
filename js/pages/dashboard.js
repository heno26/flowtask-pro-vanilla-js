// Dashboard page: high-level KPIs and summaries computed live from state.
import { initShell } from '../app.js';
import { subscribe, getTasks, getProjects, getSettings } from '../state.js';
import { computeStats } from '../services/taskService.js';
import { projectProgress } from '../services/projectService.js';
import { formatDate, isOverdue, isDueThisWeek } from '../utils/dates.js';
import { escapeHtml } from '../utils/helpers.js';
import { icon } from '../components/icons.js';
import { openTaskForm } from '../components/taskForm.js';
import { PRIORITIES } from '../constants.js';

initShell('dashboard', { showQuickAdd: true, showSearch: false });

const els = {
  welcomeName: document.getElementById('welcome-name'),
  kpis: document.getElementById('kpi-grid'),
  recentTasks: document.getElementById('recent-tasks'),
  deadlines: document.getElementById('deadlines-list'),
  priorityBreakdown: document.getElementById('priority-breakdown'),
  projectCards: document.getElementById('project-progress-cards'),
  weeklyCanvas: document.getElementById('weekly-chart'),
};

let chartInstance = null;

function render() {
  const tasks = getTasks();
  const projects = getProjects().filter((p) => !p.archived);
  const settings = getSettings();
  const projectsById = Object.fromEntries(getProjects().map((p) => [p.id, p]));
  const stats = computeStats(tasks);

  els.welcomeName.textContent = settings.displayName || 'there';

  els.kpis.innerHTML = [
    ['Total tasks', stats.total, ''],
    ['In progress', stats.inProgress, ''],
    ['Completed', stats.done, ''],
    ['Overdue', stats.overdue, stats.overdue > 0 ? 'Needs attention' : 'All clear'],
    ['Completion rate', `${stats.completionRate}%`, ''],
  ].map(([label, value, meta]) => `
    <div class="kpi-card">
      <span class="kpi-card__label">${label}</span>
      <span class="kpi-card__value">${value}</span>
      ${meta ? `<span class="kpi-card__meta">${meta}</span>` : ''}
    </div>
  `).join('');

  const recent = [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
  els.recentTasks.innerHTML = recent.length ? recent.map((task) => `
    <div class="activity-item">
      <span class="badge badge--status-${task.status}">${task.status.replace('-', ' ')}</span>
      <div style="flex:1;min-width:0;">
        <div class="text-sm truncate" data-open-task="${task.id}" style="cursor:pointer;font-weight:500;">${escapeHtml(task.title)}</div>
        <div class="text-xs text-muted">${escapeHtml(projectsById[task.projectId]?.name || 'Unknown project')}</div>
      </div>
    </div>
  `).join('') : emptyRow('No tasks yet — create your first one.');

  const upcoming = tasks
    .filter((task) => task.status !== 'done' && (isDueThisWeek(task.dueDate) || isOverdue(task.dueDate, task.status)))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 6);
  els.deadlines.innerHTML = upcoming.length ? upcoming.map((task) => `
    <div class="deadline-item">
      <span class="task-card__due ${isOverdue(task.dueDate, task.status) ? 'is-overdue' : ''}">${icon('calendar')} ${formatDate(task.dueDate)}</span>
      <div style="flex:1;min-width:0;">
        <div class="text-sm truncate" data-open-task="${task.id}" style="cursor:pointer;font-weight:500;">${escapeHtml(task.title)}</div>
      </div>
      <span class="badge badge--priority-${task.priority}">${task.priority}</span>
    </div>
  `).join('') : emptyRow('Nothing due this week. Nice.');

  els.priorityBreakdown.innerHTML = PRIORITIES.map((priority) => {
    const count = tasks.filter((t) => t.priority === priority.id && t.status !== 'done').length;
    const max = Math.max(1, ...PRIORITIES.map((p) => tasks.filter((t) => t.priority === p.id && t.status !== 'done').length));
    return `
      <div class="priority-bar-row">
        <span class="badge badge--priority-${priority.id}" style="min-width:76px;">${priority.label}</span>
        <div class="progress"><div class="progress__fill" style="width:${(count / max) * 100}%"></div></div>
        <span class="text-xs text-muted" style="width:20px;text-align:right;">${count}</span>
      </div>
    `;
  }).join('');

  els.projectCards.innerHTML = projects.length ? projects.slice(0, 4).map((project) => {
    const progress = projectProgress(project, tasks);
    return `
      <a class="project-card" href="board.html?project=${project.id}" style="text-decoration:none;">
        <div class="project-card__top">
          <span class="project-card__color" style="background:${project.color}"></span>
          <h4 class="truncate">${escapeHtml(project.name)}</h4>
        </div>
        <div class="progress"><div class="progress__fill" style="width:${progress.percent}%"></div></div>
        <div class="project-card__meta"><span>${progress.done}/${progress.total} done</span><span>${progress.percent}%</span></div>
      </a>
    `;
  }).join('') : emptyRow('No projects yet.');

  renderWeeklyChart(tasks);

  document.querySelectorAll('[data-open-task]').forEach((el) => {
    el.addEventListener('click', () => {
      const task = tasks.find((t) => t.id === el.dataset.openTask);
      if (task) openTaskForm({ mode: 'view', task, onSaved: render });
    });
  });
}

function emptyRow(message) {
  return `<p class="text-sm text-muted" style="padding:var(--space-3) 0;">${message}</p>`;
}

function renderWeeklyChart(tasks) {
  if (!window.Chart || !els.weeklyCanvas) return;

  const days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  const labels = days.map((d) => d.toLocaleDateString(undefined, { weekday: 'short' }));
  const counts = days.map((day) => tasks.filter((task) => {
    if (!task.completedAt) return false;
    const completed = new Date(task.completedAt);
    return completed.toDateString() === day.toDateString();
  }).length);

  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--color-accent').trim();
  const gridColor = styles.getPropertyValue('--color-border').trim();
  const inkSoft = styles.getPropertyValue('--color-ink-soft').trim();

  if (chartInstance) chartInstance.destroy();
  chartInstance = new window.Chart(els.weeklyCanvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Tasks completed', data: counts, backgroundColor: accent, borderRadius: 6, maxBarThickness: 28 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: inkSoft } },
        y: { beginAtZero: true, ticks: { precision: 0, color: inkSoft }, grid: { color: gridColor } },
      },
    },
  });
}

document.getElementById('banner-quick-add')?.addEventListener('click', () => {
  openTaskForm({ mode: 'create', onSaved: render });
});

subscribe(render);
render();
