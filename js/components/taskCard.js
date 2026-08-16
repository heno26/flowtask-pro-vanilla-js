// Renders a single Kanban task card. Pure render function — event wiring for
// drag/drop and click-to-open happens once at the board level via delegation.
import { icon } from './icons.js';
import { formatDate, isOverdue } from '../utils/dates.js';
import { getInitials, colorForString, escapeHtml } from '../utils/helpers.js';
import { subtaskProgress } from '../services/taskService.js';

export function renderTaskCard(task) {
  const overdue = isOverdue(task.dueDate, task.status);
  const progress = subtaskProgress(task);
  const tagsHTML = task.tags.slice(0, 3).map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('');

  return `
    <article class="task-card" draggable="true" tabindex="0" role="button"
      data-task-id="${task.id}" data-priority="${task.priority}"
      aria-label="${escapeHtml(task.title)}, priority ${task.priority}${overdue ? ', overdue' : ''}">
      <div class="task-card__title">${escapeHtml(task.title)}</div>
      ${tagsHTML ? `<div class="task-card__tags">${tagsHTML}</div>` : ''}
      <div class="task-card__row">
        <span class="badge badge--priority-${task.priority}">${task.priority}</span>
        ${task.dueDate ? `
          <span class="task-card__due ${overdue ? 'is-overdue' : ''}">
            ${icon('calendar')} ${formatDate(task.dueDate)}
          </span>` : '<span></span>'}
      </div>
      <div class="task-card__row">
        ${progress ? `<span class="task-card__subtasks">${icon('check')} ${progress.completed}/${progress.total}</span>` : '<span></span>'}
        ${task.assignee ? `<span class="avatar avatar--sm" style="background:${colorForString(task.assignee)}" title="${escapeHtml(task.assignee)}">${getInitials(task.assignee)}</span>` : ''}
      </div>
    </article>
  `;
}
