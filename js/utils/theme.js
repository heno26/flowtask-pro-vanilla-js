// Applies the light/dark/system theme to <html data-theme="...">. Called as
// early as possible on every page (inline in <head>) to avoid a flash of
// the wrong theme, and again whenever the user changes it in Settings.
export function resolveTheme(themePreference) {
  if (themePreference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themePreference;
}

export function applyTheme(themePreference) {
  document.documentElement.setAttribute('data-theme', resolveTheme(themePreference));
}

export function watchSystemTheme(getPreference) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getPreference() === 'system') applyTheme('system');
  });
}
