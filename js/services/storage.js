// The ONLY module allowed to touch window.localStorage directly. Every other
// part of the app reads/writes app data through the functions below, so
// storage format changes only ever need to happen in one place.
import { STORAGE_KEYS, APP_VERSION } from '../constants.js';
import { buildDemoData } from '../../data/demoData.js';

const DEFAULT_SETTINGS = {
  displayName: 'Mohammed',
  initials: 'MW',
  theme: 'system',
  animations: true,
  confirmDelete: true,
  defaultView: 'board',
};

function safeParse(rawValue, fallback) {
  if (!rawValue) return fallback;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed ?? fallback;
  } catch (error) {
    console.warn('FlowTask: corrupted LocalStorage value, using fallback.', error);
    return fallback;
  }
}

function readRaw(key, fallback) {
  try {
    return safeParse(window.localStorage.getItem(key), fallback);
  } catch (error) {
    // localStorage can throw in private-browsing edge cases — degrade gracefully.
    console.warn('FlowTask: LocalStorage is unavailable, using in-memory fallback.', error);
    return fallback;
  }
}

function writeRaw(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('FlowTask: failed to persist data.', error);
    return false;
  }
}

function ensureSeeded() {
  const meta = readRaw(STORAGE_KEYS.meta, null);
  if (meta && meta.seeded) return;

  // First launch only: seed realistic demo data, then mark meta so we never
  // overwrite real user data on later visits.
  const { projects, tasks } = buildDemoData();
  writeRaw(STORAGE_KEYS.projects, projects);
  writeRaw(STORAGE_KEYS.tasks, tasks);
  writeRaw(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  writeRaw(STORAGE_KEYS.meta, { seeded: true, version: APP_VERSION, seededAt: new Date().toISOString() });
}

ensureSeeded();

export function loadProjects() {
  return readRaw(STORAGE_KEYS.projects, []);
}

export function saveProjects(projects) {
  return writeRaw(STORAGE_KEYS.projects, projects);
}

export function loadTasks() {
  return readRaw(STORAGE_KEYS.tasks, []);
}

export function saveTasks(tasks) {
  return writeRaw(STORAGE_KEYS.tasks, tasks);
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readRaw(STORAGE_KEYS.settings, {}) };
}

export function saveSettings(settings) {
  return writeRaw(STORAGE_KEYS.settings, settings);
}

export function loadMeta() {
  return readRaw(STORAGE_KEYS.meta, { seeded: false, version: APP_VERSION });
}

export function resetAllData() {
  writeRaw(STORAGE_KEYS.meta, { seeded: false, version: APP_VERSION });
  const { projects, tasks } = buildDemoData();
  writeRaw(STORAGE_KEYS.projects, projects);
  writeRaw(STORAGE_KEYS.tasks, tasks);
  writeRaw(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  writeRaw(STORAGE_KEYS.meta, { seeded: true, version: APP_VERSION, seededAt: new Date().toISOString() });
}

export function wipeAllData() {
  writeRaw(STORAGE_KEYS.projects, []);
  writeRaw(STORAGE_KEYS.tasks, []);
  writeRaw(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  writeRaw(STORAGE_KEYS.meta, { seeded: true, version: APP_VERSION, seededAt: new Date().toISOString() });
}

export function replaceAllData({ projects, tasks, settings }) {
  if (Array.isArray(projects)) writeRaw(STORAGE_KEYS.projects, projects);
  if (Array.isArray(tasks)) writeRaw(STORAGE_KEYS.tasks, tasks);
  if (settings && typeof settings === 'object') writeRaw(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS, ...settings });
}
