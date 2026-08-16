// Renders the app sidebar and wires up mobile show/hide behavior. Each page
// calls mountSidebar('board') etc. so the correct nav link is marked current.
import { icon } from './icons.js';
import { getSettings } from '../state.js';
import { getInitials, colorForString, escapeHtml } from '../utils/helpers.js';

const NAV_ITEMS = [
  { page: 'dashboard', href: 'index.html', label: 'Dashboard', icon: 'dashboard' },
  { page: 'projects', href: 'projects.html', label: 'Projects', icon: 'projects' },
  { page: 'board', href: 'board.html', label: 'Board', icon: 'board' },
  { page: 'tasks', href: 'tasks.html', label: 'Tasks', icon: 'tasks' },
  { page: 'calendar', href: 'calendar.html', label: 'Calendar', icon: 'calendar' },
  { page: 'analytics', href: 'analytics.html', label: 'Analytics', icon: 'analytics' },
];

// Module-level so repeated mountSidebar() calls (e.g. when settings change
// on the current page) can remove the previous listener before adding a
// new one, instead of stacking duplicate document-level handlers.
let toggleHandler = null;

function navLinkHTML(item, activePage) {
  const isActive = item.page === activePage;
  return `
    <a class="sidebar__link" href="${item.href}" ${isActive ? "aria-current='page'" : ''}>
      ${icon(item.icon)}<span>${item.label}</span>
    </a>
  `;
}

export function mountSidebar(activePage) {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  const settings = getSettings();

const rawDisplayName =
  typeof settings.displayName === 'string'
    ? settings.displayName
    : 'Guest';

const initials =
  typeof settings.initials === 'string' && settings.initials
    ? settings.initials
    : getInitials(rawDisplayName);

const safeDisplayName = escapeHtml(rawDisplayName);
const safeInitials = escapeHtml(initials.slice(0, 2));

  root.innerHTML = `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__brand-mark" aria-hidden="true"></div>
        <span class="sidebar__brand-name">FlowTask Pro</span>
      </div>

      <nav class="sidebar__nav" aria-label="Main navigation">
        <span class="sidebar__section-label">Workspace</span>
        ${NAV_ITEMS.map((item) => navLinkHTML(item, activePage)).join('')}
      </nav>

      <nav class="sidebar__nav" aria-label="Settings navigation">
        <span class="sidebar__section-label">Preferences</span>
        <a class="sidebar__link" href="settings.html" ${activePage === 'settings' ? "aria-current='page'" : ''}>
          ${icon('settings')}<span>Settings</span>
        </a>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
<span class="avatar" style="background:${colorForString(rawDisplayName || 'FlowTask')}">${safeInitials}</span>
            <div class="text-sm" style="font-weight:600;">${safeDisplayName}</div>
            <div class="text-xs text-muted">Local workspace</div>
          </div>
        </div>
      </div>
    </aside>
  `;

  const sidebarEl = document.getElementById('sidebar');
  const overlayEl = document.getElementById('sidebar-overlay');

  function closeSidebar() {
    sidebarEl.classList.remove('is-open');
    overlayEl.classList.remove('is-open');
  }

  overlayEl.addEventListener('click', closeSidebar);

  if (toggleHandler) document.removeEventListener('flowtask:toggle-sidebar', toggleHandler);
  toggleHandler = () => {
    sidebarEl.classList.toggle('is-open');
    overlayEl.classList.toggle('is-open');
  };
  document.addEventListener('flowtask:toggle-sidebar', toggleHandler);

  document.querySelectorAll('.sidebar__link').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });
}
