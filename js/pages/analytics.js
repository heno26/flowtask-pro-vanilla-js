// Analytics page: derived metrics + four Chart.js charts, all reading from
// the same central state as every other page (no separate data source).
import { initShell } from '../app.js';
import { subscribe, getTasks, getProjects } from '../state.js';
import { computeStats } from '../services/taskService.js';
import { projectProgress } from '../services/projectService.js';
import { STATUSES, PRIORITIES } from '../constants.js';

initShell('analytics', { showSearch: false, showQuickAdd: false });

const els = {
  summary: document.getElementById('analytics-summary'),
  statusCanvas: document.getElementById('status-chart'),
  priorityCanvas: document.getElementById('priority-chart'),
  weeklyCanvas: document.getElementById('weekly-activity-chart'),
  projectCanvas: document.getElementById('project-progress-chart'),
};

const charts = {};

function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    ink: styles.getPropertyValue('--color-ink-soft').trim(),
    grid: styles.getPropertyValue('--color-border').trim(),
    accent: styles.getPropertyValue('--color-accent').trim(),
    warm: styles.getPropertyValue('--color-warm').trim(),
  };
}

function statusColor(statusId) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-status-${statusId}`).trim();
}

function priorityColor(priorityId) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-priority-${priorityId}`).trim();
}

function buildChart(key, canvas, config) {
  if (!window.Chart || !canvas) return;
  if (charts[key]) charts[key].destroy();
  charts[key] = new window.Chart(canvas, config);
}

function render() {
  const tasks = getTasks();
  const projects = getProjects().filter((p) => !p.archived);
  const stats = computeStats(tasks);
  const colors = themeColors();

  const completedThisWeek = tasks.filter((task) => {
    if (!task.completedAt) return false;
    const days = (Date.now() - new Date(task.completedAt).getTime()) / 86400000;
    return days <= 7;
  }).length;

  const avgProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + projectProgress(p, tasks).percent, 0) / projects.length)
    : 0;

  els.summary.innerHTML = [
    ['Total tasks', stats.total],
    ['Completion rate', `${stats.completionRate}%`],
    ['Overdue tasks', stats.overdue],
    ['Completed this week', completedThisWeek],
    ['Avg. project progress', `${avgProjectProgress}%`],
  ].map(([label, value]) => `
    <div class="kpi-card">
      <span class="kpi-card__label">${label}</span>
      <span class="kpi-card__value">${value}</span>
    </div>
  `).join('');

  buildChart('status', els.statusCanvas, {
    type: 'doughnut',
    data: {
      labels: STATUSES.map((s) => s.label),
      datasets: [{ data: STATUSES.map((s) => tasks.filter((t) => t.status === s.id).length), backgroundColor: STATUSES.map((s) => statusColor(s.id)), borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: colors.ink } } } },
  });

  buildChart('priority', els.priorityCanvas, {
    type: 'bar',
    data: {
      labels: PRIORITIES.map((p) => p.label),
      datasets: [{ data: PRIORITIES.map((p) => tasks.filter((t) => t.priority === p.id).length), backgroundColor: PRIORITIES.map((p) => priorityColor(p.id)), borderRadius: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false }, ticks: { color: colors.ink } }, y: { beginAtZero: true, ticks: { precision: 0, color: colors.ink }, grid: { color: colors.grid } } },
    },
  });

  const days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  buildChart('weekly', els.weeklyCanvas, {
    type: 'line',
    data: {
      labels: days.map((d) => d.toLocaleDateString(undefined, { weekday: 'short' })),
      datasets: [{
        label: 'Completed',
        data: days.map((day) => tasks.filter((t) => t.completedAt && new Date(t.completedAt).toDateString() === day.toDateString()).length),
        borderColor: colors.accent, backgroundColor: colors.accent, tension: 0.35, fill: false, pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false }, ticks: { color: colors.ink } }, y: { beginAtZero: true, ticks: { precision: 0, color: colors.ink }, grid: { color: colors.grid } } },
    },
  });

  buildChart('project', els.projectCanvas, {
    type: 'bar',
    data: {
      labels: projects.map((p) => p.name),
      datasets: [{ data: projects.map((p) => projectProgress(p, tasks).percent), backgroundColor: projects.map((p) => p.color), borderRadius: 6 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, max: 100, ticks: { color: colors.ink }, grid: { color: colors.grid } }, y: { grid: { display: false }, ticks: { color: colors.ink } } },
    },
  });
}

subscribe(render);
window.addEventListener('resize', () => {});
render();
