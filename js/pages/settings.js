// Settings page: profile preferences, theme, danger-zone actions, and
// JSON backup/restore. All dangerous actions confirm via confirmDialog.
import { initShell, applyAnimationsPreference } from '../app.js';
import { getSettings, setSettings, reloadFromStorage } from '../state.js';
import { resetAllData, wipeAllData } from '../services/storage.js';
import { exportBackup, parseBackupFile, applyBackup } from '../services/exportService.js';
import { confirmDialog } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { applyTheme } from '../utils/theme.js';
import { getInitials } from '../utils/helpers.js';
import { APP_VERSION } from '../constants.js';

initShell('settings', { showSearch: false, showQuickAdd: false });

const els = {
  displayName: document.getElementById('setting-display-name'),
  initials: document.getElementById('setting-initials'),
  theme: document.getElementById('setting-theme'),
  defaultView: document.getElementById('setting-default-view'),
  animations: document.getElementById('setting-animations'),
  confirmDelete: document.getElementById('setting-confirm-delete'),
  version: document.getElementById('app-version'),
  importInput: document.getElementById('import-file-input'),
};

function fillForm() {
  const settings = getSettings();
  els.displayName.value = settings.displayName;
  els.initials.value = settings.initials || getInitials(settings.displayName);
  els.theme.value = settings.theme;
  els.defaultView.value = settings.defaultView;
  els.animations.checked = settings.animations;
  els.confirmDelete.checked = settings.confirmDelete;
  els.version.textContent = APP_VERSION;
}

els.displayName.addEventListener('change', () => {
  setSettings({ displayName: els.displayName.value.trim() || 'Guest' });
  showToast('Display name updated.', 'success');
});

els.initials.addEventListener('change', () => {
  const value = els.initials.value.trim().toUpperCase().slice(0, 2);
  els.initials.value = value;
  setSettings({ initials: value });
});

els.theme.addEventListener('change', () => {
  setSettings({ theme: els.theme.value });
  applyTheme(els.theme.value);
  showToast('Theme updated.', 'success');
});

els.defaultView.addEventListener('change', () => {
  setSettings({ defaultView: els.defaultView.value });
});

els.animations.addEventListener('change', () => {
  setSettings({ animations: els.animations.checked });
  applyAnimationsPreference(els.animations.checked);
});

els.confirmDelete.addEventListener('change', () => {
  setSettings({ confirmDelete: els.confirmDelete.checked });
});

document.getElementById('export-data-btn').addEventListener('click', () => {
  exportBackup();
  showToast('Backup downloaded.', 'success');
});

document.getElementById('import-data-btn').addEventListener('click', () => els.importInput.click());

els.importInput.addEventListener('change', async () => {
  const file = els.importInput.files[0];
  if (!file) return;
  const text = await file.text();
  const result = parseBackupFile(text);
  if (!result.ok) {
    showToast(result.error, 'error', 4200);
    els.importInput.value = '';
    return;
  }
  const confirmed = await confirmDialog({
    title: 'Overwrite current data?',
    message: 'Importing this backup replaces all current projects, tasks, and settings. This cannot be undone.',
    confirmLabel: 'Import and overwrite',
  });
  if (confirmed) {
    applyBackup(result.data);
    fillForm();
    showToast('Backup imported successfully.', 'success');
  }
  els.importInput.value = '';
});

document.getElementById('reset-demo-btn').addEventListener('click', async () => {
  const confirmed = await confirmDialog({
    title: 'Reset to demo data?',
    message: 'This replaces all current projects and tasks with the original demo dataset. This cannot be undone.',
    confirmLabel: 'Reset to demo data',
  });
  if (confirmed) {
    resetAllData();
    reloadFromStorage();
    fillForm();
    showToast('Demo data restored.', 'success');
  }
});

document.getElementById('reset-app-btn').addEventListener('click', async () => {
  const confirmed = await confirmDialog({
    title: 'Reset the entire application?',
    message: 'This permanently deletes every project and task and cannot be undone.',
    confirmLabel: 'Erase everything',
  });
  if (confirmed) {
    wipeAllData();
    reloadFromStorage();
    fillForm();
    showToast('Application data cleared.', 'success');
  }
});

fillForm();
