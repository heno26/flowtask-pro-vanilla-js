// Shared bootstrap used by every page: mounts the sidebar/header shell and
// keeps the theme reactive to OS-level changes when "system" is selected.
import { mountSidebar } from './components/sidebar.js';
import { mountHeader } from './components/header.js';
import { getSettings, subscribe } from './state.js';
import { applyTheme, watchSystemTheme } from './utils/theme.js';

export function initShell(activePage, headerOptions = {}) {
  const settings = getSettings();
  applyTheme(settings.theme);
  applyAnimationsPreference(settings.animations);
  watchSystemTheme(() => getSettings().theme);
  mountSidebar(activePage);
  mountHeader(headerOptions);

  // Keep the sidebar's name/initials/avatar in sync if settings change on
  // this page (e.g. Settings) without requiring a full reload.
  let lastDisplayName = settings.displayName;
  let lastInitials = settings.initials;
  subscribe((state) => {
    if (state.settings.displayName !== lastDisplayName || state.settings.initials !== lastInitials) {
      lastDisplayName = state.settings.displayName;
      lastInitials = state.settings.initials;
      mountSidebar(activePage);
    }
  });
}

export function applyAnimationsPreference(animationsEnabled) {
  const root = document.documentElement.style;
  if (animationsEnabled === false) {
    root.setProperty('--transition-fast', '0ms');
    root.setProperty('--transition-base', '0ms');
    root.setProperty('--transition-slow', '0ms');
  } else {
    root.removeProperty('--transition-fast');
    root.removeProperty('--transition-base');
    root.removeProperty('--transition-slow');
  }
}
