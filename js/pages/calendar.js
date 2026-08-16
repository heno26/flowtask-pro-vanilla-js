// Calendar page: month grid built from scratch with Date APIs, plus a mobile
// agenda fallback (handled via CSS display, populated from the same data).
import { initShell } from '../app.js';
import { subscribe, getTasks, getProjects } from '../state.js';
import { openTaskForm } from '../components/taskForm.js';
import { getMonthMatrix, isSameDay, toISODate, formatDate } from '../utils/dates.js';
import { escapeHtml } from '../utils/helpers.js';

initShell('calendar', { showSearch: false });

const els = {
  grid: document.getElementById('calendar-grid'),
  monthLabel: document.getElementById('calendar-month-label'),
  agenda: document.getElementById('calendar-agenda'),
};

let viewDate = new Date();

function tasksByDate() {
  const map = new Map();
  getTasks().forEach((task) => {
    if (!task.dueDate) return;
    if (!map.has(task.dueDate)) map.set(task.dueDate, []);
    map.get(task.dueDate).push(task);
  });
  return map;
}

function render() {
  const tasks = getTasks();
  const projectsMap = Object.fromEntries(getProjects().map((p) => [p.id, p]));
  const byDate = tasksByDate();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  els.monthLabel.textContent = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const weeks = getMonthMatrix(year, month);
  els.grid.innerHTML = weeks.flat().map((date) => {
    const iso = toISODate(date);
    const dayTasks = byDate.get(iso) || [];
    const isOutside = date.getMonth() !== month;
    const isToday = isSameDay(date, today);
    const visibleTasks = dayTasks.slice(0, 3);
    const extra = dayTasks.length - visibleTasks.length;

    return `
      <div class="calendar__cell ${isOutside ? 'is-outside' : ''} ${isToday ? 'is-today' : ''}" data-date="${iso}" tabindex="0" role="button" aria-label="${date.toDateString()}${isToday ? ', today' : ''}">
        <span class="calendar__date">${date.getDate()}</span>
        ${visibleTasks.map((task) => `
          <button type="button" class="calendar__task-pill" data-task-id="${task.id}" data-priority="${task.priority}" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</button>
        `).join('')}
        ${extra > 0 ? `<span class="calendar__more">+${extra} more</span>` : ''}
      </div>
    `;
  }).join('');

  renderAgenda(tasks, projectsMap, byDate);
  wireCalendarEvents(tasks);
}

function renderAgenda(tasks, projectsMap, byDate) {
  const upcomingDates = [...byDate.keys()].filter((iso) => iso >= new Date().toISOString().slice(0, 10)).sort().slice(0, 14);
  els.agenda.innerHTML = upcomingDates.length ? upcomingDates.map((iso) => `
    <div class="agenda-day">
      <div class="agenda-day__date">${formatDate(iso, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      <div class="flex flex-col gap-2">
        ${byDate.get(iso).map((task) => `
          <div class="task-card" data-task-id="${task.id}" data-priority="${task.priority}" style="cursor:pointer;">
            <div class="task-card__title">${escapeHtml(task.title)}</div>
            <div class="task-card__row">
              <span class="badge badge--priority-${task.priority}">${task.priority}</span>
              <span class="text-xs text-muted">${escapeHtml(projectsMap[task.projectId]?.name || '')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('') : '<p class="text-sm text-muted">No upcoming due dates.</p>';
}

function wireCalendarEvents(tasks) {
  function openTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) openTaskForm({ mode: 'view', task, onSaved: render });
  }

  els.grid.querySelectorAll('[data-task-id]').forEach((pill) => {
    pill.addEventListener('click', (event) => {
      event.stopPropagation();
      openTask(pill.dataset.taskId);
    });
  });

  els.agenda.querySelectorAll('[data-task-id]').forEach((card) => {
    card.addEventListener('click', () => openTask(card.dataset.taskId));
  });

  els.grid.querySelectorAll('.calendar__cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      openTaskForm({ mode: 'create', defaults: { dueDate: cell.dataset.date }, onSaved: render });
    });
    cell.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTaskForm({ mode: 'create', defaults: { dueDate: cell.dataset.date }, onSaved: render });
      }
    });
  });
}

document.getElementById('calendar-prev').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  render();
});
document.getElementById('calendar-next').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  render();
});
document.getElementById('calendar-today').addEventListener('click', () => {
  viewDate = new Date();
  render();
});

subscribe(render);
render();
