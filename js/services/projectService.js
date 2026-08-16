// Project CRUD and derived project metrics.
import { getProjects, setProjects } from '../state.js';
import { createId } from '../utils/ids.js';
import { deleteTasksForProject } from './taskService.js';

export function createProject(input) {
  const project = {
    id: createId('project'),
    name: input.name.trim(),
    description: (input.description || '').trim(),
    color: input.color || '#4A54E1',
    startDate: input.startDate || '',
    dueDate: input.dueDate || '',
    createdAt: new Date().toISOString(),
    archived: false,
  };
  setProjects([project, ...getProjects()]);
  return project;
}

export function updateProject(projectId, patch) {
  const projects = getProjects().map((project) => (
    project.id === projectId ? { ...project, ...patch } : project
  ));
  setProjects(projects);
  return projects.find((p) => p.id === projectId);
}

export function setProjectArchived(projectId, archived) {
  return updateProject(projectId, { archived });
}

export function deleteProject(projectId) {
  setProjects(getProjects().filter((project) => project.id !== projectId));
  deleteTasksForProject(projectId);
}

export function getProjectsById() {
  return Object.fromEntries(getProjects().map((project) => [project.id, project]));
}

export function projectProgress(project, tasks) {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const total = projectTasks.length;
  const done = projectTasks.filter((task) => task.status === 'done').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}
