// Handles JSON export/import so board/dashboard/settings pages share one
// validated, safe implementation instead of duplicating parsing logic.
import { getProjects, getTasks, getSettings, reloadFromStorage } from '../state.js';
import { replaceAllData } from './storage.js';
import { downloadJSON } from '../utils/helpers.js';
import {
  APP_VERSION,
  STATUSES,
  PRIORITIES,
  PROJECT_COLORS,
} from '../constants.js';

export function exportBackup() {
  const payload = {
    meta: { app: 'FlowTask Pro', version: APP_VERSION, exportedAt: new Date().toISOString() },
    projects: getProjects(),
    tasks: getTasks(),
    settings: getSettings(),
  };
  const filename = `flowtask-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadJSON(payload, filename);
}

const VALID_STATUSES = new Set(
  STATUSES.map((status) => status.id)
);

const VALID_PRIORITIES = new Set(
  PRIORITIES.map((priority) => priority.id)
);

const VALID_THEMES = new Set([
  'light',
  'dark',
  'system',
]);

const VALID_DEFAULT_VIEWS = new Set([
  'board',
  'tasks',
  'calendar',
]);

const SAFE_PROJECT_ID = /^project_[a-z0-9]+$/i;
const SAFE_TASK_ID = /^task_[a-z0-9]+$/i;
const SAFE_SUBTASK_ID = /^subtask_[a-z0-9]+$/i;

function isBoundedString(value, maxLength) {
  return (
    typeof value === 'string'
    && value.length <= maxLength
  );
}

function isDateOrEmpty(value) {
  return (
    value === ''
    || (
      typeof value === 'string'
      && !Number.isNaN(Date.parse(value))
    )
  );
}

function isIsoDateOrNull(value) {
  return (
    value === null
    || (
      typeof value === 'string'
      && !Number.isNaN(Date.parse(value))
    )
  );
}

function isValidProject(project) {
  return Boolean(
    project
    && typeof project === 'object'
    && SAFE_PROJECT_ID.test(project.id)
    && isBoundedString(project.name, 80)
    && isBoundedString(project.description ?? '', 300)
    && PROJECT_COLORS.includes(project.color)
    && isDateOrEmpty(project.startDate ?? '')
    && isDateOrEmpty(project.dueDate ?? '')
    && typeof project.createdAt === 'string'
    && !Number.isNaN(Date.parse(project.createdAt))
    && typeof project.archived === 'boolean'
  );
}

function isValidSubtask(subtask) {
  return Boolean(
    subtask
    && typeof subtask === 'object'
    && SAFE_SUBTASK_ID.test(subtask.id)
    && isBoundedString(subtask.title, 120)
    && typeof subtask.completed === 'boolean'
  );
}

function isValidTask(task) {
  return Boolean(
    task
    && typeof task === 'object'
    && SAFE_TASK_ID.test(task.id)
    && SAFE_PROJECT_ID.test(task.projectId)
    && isBoundedString(task.title, 120)
    && isBoundedString(task.description ?? '', 500)
    && VALID_STATUSES.has(task.status)
    && VALID_PRIORITIES.has(task.priority)
    && isBoundedString(task.assignee ?? '', 60)
    && Array.isArray(task.tags)
    && task.tags.every(
      (tag) => isBoundedString(tag, 30)
    )
    && isDateOrEmpty(task.dueDate ?? '')
    && typeof task.createdAt === 'string'
    && !Number.isNaN(Date.parse(task.createdAt))
    && typeof task.updatedAt === 'string'
    && !Number.isNaN(Date.parse(task.updatedAt))
    && isIsoDateOrNull(task.completedAt)
    && Array.isArray(task.subtasks)
    && task.subtasks.every(isValidSubtask)
  );
}

function normalizeSettings(settings) {
  if (settings == null) return {};

  if (
    typeof settings !== 'object'
    || Array.isArray(settings)
  ) {
    return null;
  }

  const normalized = {};

  if ('displayName' in settings) {
    if (!isBoundedString(settings.displayName, 80)) {
      return null;
    }

    normalized.displayName = settings.displayName;
  }

  if ('initials' in settings) {
    if (!isBoundedString(settings.initials, 2)) {
      return null;
    }

    normalized.initials = settings.initials;
  }

  if ('theme' in settings) {
    if (!VALID_THEMES.has(settings.theme)) {
      return null;
    }

    normalized.theme = settings.theme;
  }

  if ('defaultView' in settings) {
    if (!VALID_DEFAULT_VIEWS.has(settings.defaultView)) {
      return null;
    }

    normalized.defaultView = settings.defaultView;
  }

  if ('animations' in settings) {
    if (typeof settings.animations !== 'boolean') {
      return null;
    }

    normalized.animations = settings.animations;
  }

  if ('confirmDelete' in settings) {
    if (typeof settings.confirmDelete !== 'boolean') {
      return null;
    }

    normalized.confirmDelete = settings.confirmDelete;
  }

  return normalized;
}

export function parseBackupFile(rawText) {
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'That file does not contain a FlowTask backup object.' };
  }

  const projects =
  Array.isArray(data.projects)
    ? data.projects
    : null;

const tasks =
  Array.isArray(data.tasks)
    ? data.tasks
    : null;

const settings = normalizeSettings(data.settings);
  if (!projects || !projects.every(isValidProject)) {
    return { ok: false, error: 'The backup is missing valid project data.' };
  }
  if (!tasks || !tasks.every(isValidTask)) {
    return { ok: false, error: 'The backup is missing valid task data.' };
  }
  if (settings === null) {
  return {
    ok: false,
    error: 'The backup contains invalid settings data.',
  };
}

const projectIds = new Set(
  projects.map((project) => project.id)
);

if (
  tasks.some(
    (task) => !projectIds.has(task.projectId)
  )
) {
  return {
    ok: false,
    error: 'The backup contains tasks linked to missing projects.',
  };
}
return {
  ok: true,
  data: {
    projects,
    tasks,
    settings,
  },
};
}

export function applyBackup(parsedData) {
  replaceAllData(parsedData);
  reloadFromStorage();
}
