// Renders the top bar: mobile menu toggle, global search, theme toggle, and
// the quick-add task button. Search dispatches a custom event so whichever
// page is active can decide how to use the query.
import { icon } from './icons.js';
import { getSettings, setSettings } from '../state.js';
import { debounce } from '../utils/helpers.js';
import { applyTheme } from '../utils/theme.js';
import { openTaskForm } from './taskForm.js';

export function mountHeader({ showSearch = true, showQuickAdd = true, searchPlaceholder = 'Search tasks…' } = {}) {
  const root = document.getElementById('topbar-root');
  if (!root) return;

  const settings = getSettings();

  root.innerHTML = `
    <header class="topbar">
      <div class="topbar__left flex items-center gap-3">
        <button class="btn btn--icon btn--ghost menu-toggle" id="menu-toggle" aria-label="Open navigation">
          ${icon('menu')}
        </button>
        ${showSearch ? `
          <div class="topbar__search">
            ${icon('search')}
            <input type="search" id="global-search" placeholder="${searchPlaceholder}" aria-label="Search tasks" />
          </div>
        ` : '<div></div>'}
      </div>
      <div class="topbar__actions">
        <div class="segmented" role="group" aria-label="Theme">
          <button type="button" data-theme-option="light" aria-pressed="${settings.theme === 'light'}" aria-label="Light theme">${icon('sun')}</button>
          <button type="button" data-theme-option="dark" aria-pressed="${settings.theme === 'dark'}" aria-label="Dark theme">${icon('moon')}</button>
          <button type="button" data-theme-option="system" aria-pressed="${settings.theme === 'system'}" aria-label="Match system theme"><span class="segmented__label">Auto</span></button>
        </div>
        ${showQuickAdd ? `<button class="btn btn--primary" id="quick-add-btn">${icon('plus')}<span class="quick-add-label">New task</span></button>` : ''}
      </div>
    </header>
  `;

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('flowtask:toggle-sidebar'));
  });

  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    const dispatchSearch = debounce((value) => {
      document.dispatchEvent(new CustomEvent('flowtask:search', { detail: value }));
    }, 180);
    searchInput.addEventListener('input', (event) => dispatchSearch(event.target.value));
  }

  root.querySelectorAll('[data-theme-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.themeOption;
      setSettings({ theme });
      applyTheme(theme);
      root.querySelectorAll('[data-theme-option]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    });
  });

  document.getElementById('quick-add-btn')?.addEventListener('click', () => {
    openTaskForm({ mode: 'create' });
  });
}
