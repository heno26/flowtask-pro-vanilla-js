// Central place for enums and app-wide constants so pages never rely on
// magic strings scattered through the codebase.

export const STORAGE_KEYS = {
  projects: 'flowtask_projects_v1',
  tasks: 'flowtask_tasks_v1',
  settings: 'flowtask_settings_v1',
  meta: 'flowtask_meta_v1',
};

export const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));

export const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export const PRIORITY_LABELS = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.label]));

export const PRIORITY_WEIGHT = { low: 0, medium: 1, high: 2, critical: 3 };

export const PROJECT_COLORS = [
  '#4A54E1', '#FF8A3D', '#1E9E6C', '#C8890A', '#7C4FD6', '#2E7FD6', '#E5674D', '#D3273E',
];

export const APP_VERSION = '1.0.0';
