// All task CRUD and derived-data logic lives here so pages stay thin and
// never mutate state.tasks directly.
import { getTasks, setTasks } from '../state.js';
import { createId } from '../utils/ids.js';
import { isOverdue, isDueToday, isDueThisWeek } from '../utils/dates.js';
import { PRIORITY_WEIGHT } from '../constants.js';

export function createTask(input) {
  const now = new Date().toISOString();
  const task = {
    id: createId('task'),
    projectId: input.projectId,
    title: input.title.trim(),
    description: (input.description || '').trim(),
    status: input.status || 'backlog',
    priority: input.priority || 'medium',
    assignee: (input.assignee || '').trim(),
    tags: input.tags || [],
    dueDate: input.dueDate || '',
    createdAt: now,
    updatedAt: now,
    completedAt: input.status === 'done' ? now : null,
    subtasks: input.subtasks || [],
  };
  setTasks([task, ...getTasks()]);
  return task;
}

export function updateTask(taskId, patch) {
  const now = new Date().toISOString();
  const tasks = getTasks().map((task) => {
    if (task.id !== taskId) return task;
    const nextStatus = patch.status ?? task.status;
    const wasDone = task.status === 'done';
    const isDone = nextStatus === 'done';
    return {
      ...task,
      ...patch,
      updatedAt: now,
      completedAt: isDone && !wasDone ? now : (!isDone ? null : task.completedAt),
    };
  });
  setTasks(tasks);
  return tasks.find((t) => t.id === taskId);
}

export function deleteTask(taskId) {
  setTasks(getTasks().filter((task) => task.id !== taskId));
}

export function duplicateTask(taskId) {
  const source = getTasks().find((task) => task.id === taskId);
  if (!source) return null;
  const now = new Date().toISOString();
  const copy = {
    ...source,
    id: createId('task'),
    title: `${source.title} (copy)`,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    status: source.status === 'done' ? 'todo' : source.status,
    subtasks: source.subtasks.map((subtask) => ({ ...subtask, id: createId('subtask') })),
  };
  setTasks([copy, ...getTasks()]);
  return copy;
}

export function moveTaskStatus(taskId, status) {
  return updateTask(taskId, { status });
}

export function toggleSubtask(taskId, subtaskId) {
  const tasks = getTasks().map((task) => {
    if (task.id !== taskId) return task;
    return {
      ...task,
      updatedAt: new Date().toISOString(),
      subtasks: task.subtasks.map((subtask) => (
        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
      )),
    };
  });
  setTasks(tasks);
}

export function deleteTasksForProject(projectId) {
  setTasks(getTasks().filter((task) => task.projectId !== projectId));
}

/* ---------------- Derived data / queries ---------------- */

export function getTasksByProject(projectId) {
  return getTasks().filter((task) => task.projectId === projectId);
}

export function searchTasks(tasks, query, projectsById) {
  if (!query) return tasks;
  const needle = query.trim().toLowerCase();
  if (!needle) return tasks;
  return tasks.filter((task) => {
    const projectName = projectsById?.[task.projectId]?.name || '';
    return (
      task.title.toLowerCase().includes(needle)
      || task.description.toLowerCase().includes(needle)
      || task.assignee.toLowerCase().includes(needle)
      || projectName.toLowerCase().includes(needle)
      || task.tags.some((tag) => tag.toLowerCase().includes(needle))
    );
  });
}

export function applyFilters(tasks, filters = {}) {
  return tasks.filter((task) => {
    if (filters.projectId && task.projectId !== filters.projectId) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignee !== filters.assignee) return false;
    if (filters.tag && !task.tags.includes(filters.tag)) return false;
    if (filters.dueToday && !isDueToday(task.dueDate)) return false;
    if (filters.dueThisWeek && !isDueThisWeek(task.dueDate)) return false;
    if (filters.overdue && !isOverdue(task.dueDate, task.status)) return false;
    if (filters.completed === true && task.status !== 'done') return false;
    if (filters.completed === false && task.status === 'done') return false;
    return true;
  });
}

export function sortTasks(tasks, sortBy = 'newest') {
  const sorted = [...tasks];
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'due-date':
      return sorted.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    case 'priority':
      return sorted.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently-updated':
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export function computeStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, inProgress, overdue, completionRate };
}

export function subtaskProgress(task) {
  if (!task.subtasks?.length) return null;
  const completed = task.subtasks.filter((s) => s.completed).length;
  return { completed, total: task.subtasks.length };
}
