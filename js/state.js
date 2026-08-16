// Small centralized state layer. This is intentionally NOT a framework —
// it just keeps projects/tasks/settings in memory, persists changes through
// storage.js, and notifies subscribers so pages can re-render.
import * as storage from './services/storage.js';

const state = {
  projects: storage.loadProjects(),
  tasks: storage.loadTasks(),
  settings: storage.loadSettings(),
};

const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export function getProjects() {
  return state.projects;
}

export function getTasks() {
  return state.tasks;
}

export function getSettings() {
  return state.settings;
}

export function setProjects(nextProjects) {
  state.projects = nextProjects;
  storage.saveProjects(state.projects);
  notify();
}

export function setTasks(nextTasks) {
  state.tasks = nextTasks;
  storage.saveTasks(state.tasks);
  notify();
}

export function setSettings(nextSettings) {
  state.settings = { ...state.settings, ...nextSettings };
  storage.saveSettings(state.settings);
  notify();
}

export function reloadFromStorage() {
  state.projects = storage.loadProjects();
  state.tasks = storage.loadTasks();
  state.settings = storage.loadSettings();
  notify();
}
