// Projects page: browse, search, sort, create/edit/archive/delete projects.
import { initShell } from '../app.js';
import { subscribe, getProjects, getTasks } from '../state.js';
import { setProjectArchived, deleteProject, projectProgress } from '../services/projectService.js';
import { openProjectForm } from '../components/projectForm.js';
import { confirmDeleteAction } from '../components/confirmDialog.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/helpers.js';
import { formatDate } from '../utils/dates.js';
import { icon } from '../components/icons.js';

initShell('projects', { showSearch: true, searchPlaceholder: 'Search projects…' });

const grid = document.getElementById('projects-grid');
const emptyState = document.getElementById('projects-empty');
const sortSelect = document.getElementById('project-sort');
const showArchivedToggle = document.getElementById('show-archived');

let query = '';
let sortBy = 'newest';

function sortProjects(projects) {
  const sorted = [...projects];
  switch (sortBy) {
    case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'due-date': return sorted.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    case 'progress': {
      const tasks = getTasks();
      return sorted.sort((a, b) => projectProgress(b, tasks).percent - projectProgress(a, tasks).percent);
    }
    default: return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function render() {
  const tasks = getTasks();
  let projects = getProjects();

  if (!showArchivedToggle.checked) projects = projects.filter((p) => !p.archived);
  if (query) projects = projects.filter((p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
  projects = sortProjects(projects);

  emptyState.hidden = projects.length > 0;
  grid.innerHTML = projects.map((project) => {
    const progress = projectProgress(project, tasks);
    return `
      <div class="project-card">
        <div class="project-card__top">
          <div class="flex items-center gap-2" style="min-width:0;">
            <span class="project-card__color" style="background:${project.color}"></span>
            <h4 class="truncate">${escapeHtml(project.name)}</h4>
          </div>
          ${project.archived ? '<span class="badge badge--status-backlog">Archived</span>' : ''}
        </div>
        <p class="project-card__desc">${escapeHtml(project.description) || 'No description yet.'}</p>
        <div class="progress"><div class="progress__fill" style="width:${progress.percent}%"></div></div>
        <div class="project-card__meta">
          <span>${progress.done}/${progress.total} tasks</span>
          <span>Due ${project.dueDate ? formatDate(project.dueDate) : '—'}</span>
        </div>
        <div class="project-card__footer">
          <a class="btn btn--secondary btn--sm" href="board.html?project=${project.id}">Open board</a>
          <div class="flex gap-1">
            <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" data-id="${project.id}" aria-label="Edit project">${icon('edit')}</button>
            <button class="btn btn--icon btn--ghost btn--sm" data-action="archive" data-id="${project.id}" aria-label="${project.archived ? 'Unarchive' : 'Archive'} project">${icon('archive')}</button>
            <button class="btn btn--icon btn--ghost btn--sm" data-action="delete" data-id="${project.id}" aria-label="Delete project">${icon('trash')}</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wireCardEvents(projects);
}

function wireCardEvents(projects) {
  grid.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const project = projects.find((p) => p.id === button.dataset.id);
      if (!project) return;
      const action = button.dataset.action;

      if (action === 'edit') {
        openProjectForm({ mode: 'edit', project, onSaved: render });
      } else if (action === 'archive') {
        setProjectArchived(project.id, !project.archived);
        showToast(project.archived ? 'Project unarchived.' : 'Project archived.', 'success');
      } else if (action === 'delete') {
        const confirmed = await confirmDeleteAction({
          title: 'Delete this project?',
          message: `Deleting "${escapeHtml(project.name)}" also deletes all of its tasks. This cannot be undone.`,
          confirmLabel: 'Delete project',
        });
        if (confirmed) {
          deleteProject(project.id);
          showToast('Project deleted.', 'success');
        }
      }
    });
  });
}

document.getElementById('new-project-btn').addEventListener('click', () => {
  openProjectForm({ mode: 'create', onSaved: render });
});

document.addEventListener('flowtask:search', (event) => {
  query = event.detail.trim().toLowerCase();
  render();
});

sortSelect.addEventListener('change', () => { sortBy = sortSelect.value; render(); });
showArchivedToggle.addEventListener('change', render);

subscribe(render);
render();
