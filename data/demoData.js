// First-run seed data. Only used by storage.js when no saved data exists
// yet, so the dashboard looks alive the moment someone opens the app.
import { createId } from '../js/utils/ids.js';

function daysFromNow(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function buildDemoData() {
  const now = new Date().toISOString();

  const projects = [
    {
      id: createId('project'),
      name: 'Website Redesign',
      description: 'Refresh the marketing site with a new visual identity and faster build pipeline.',
      color: '#4A54E1',
      startDate: daysFromNow(-20),
      dueDate: daysFromNow(18),
      createdAt: now,
      archived: false,
    },
    {
      id: createId('project'),
      name: 'Security Lab',
      description: 'Coursework project covering network scanning, hardening, and a written report.',
      color: '#E5674D',
      startDate: daysFromNow(-10),
      dueDate: daysFromNow(25),
      createdAt: now,
      archived: false,
    },
    {
      id: createId('project'),
      name: 'University Coursework',
      description: 'Assignments, readings, and exam prep tracked in one place for the semester.',
      color: '#1E9E6C',
      startDate: daysFromNow(-30),
      dueDate: daysFromNow(60),
      createdAt: now,
      archived: false,
    },
  ];

  const [website, security, coursework] = projects;

  const taskSeeds = [
    [website, 'Audit current site content', 'done', 'medium', 'Sara', ['content'], -8, [['Collect analytics', true], ['List stale pages', true]]],
    [website, 'Design new homepage hero', 'done', 'high', 'Mo', ['design'], -5, [['Sketch 3 directions', true], ['Get feedback', true]]],
    [website, 'Build component library', 'in-progress', 'high', 'Mo', ['design', 'frontend'], 3, [['Buttons + inputs', true], ['Cards', false]]],
    [website, 'Implement responsive nav', 'in-progress', 'medium', 'Amir', ['frontend'], 5, [['Mobile drawer', false]]],
    [website, 'Write launch announcement', 'todo', 'low', 'Sara', ['content', 'marketing'], 12, []],
    [website, 'Set up analytics dashboard', 'todo', 'medium', 'Mo', ['frontend'], 9, []],
    [website, 'QA pass on staging', 'backlog', 'medium', 'Amir', ['qa'], 16, []],
    [website, 'Accessibility audit', 'review', 'critical', 'Sara', ['a11y'], 2, [['Keyboard nav', true], ['Contrast check', false]]],

    [security, 'Set up isolated lab network', 'done', 'high', 'Mohammed', ['setup'], -6, []],
    [security, 'Run vulnerability scan', 'in-progress', 'critical', 'Mohammed', ['scanning'], 1, [['Nmap sweep', true], ['Document findings', false]]],
    [security, 'Harden default configs', 'todo', 'high', 'Mohammed', ['hardening'], 6, []],
    [security, 'Draft written report', 'backlog', 'medium', 'Mohammed', ['writing'], 20, []],
    [security, 'Peer review teammate scan', 'review', 'medium', 'Lina', ['scanning'], -1, []],

    [coursework, 'Finish algorithms problem set', 'done', 'medium', 'Mohammed', ['cs'], -3, []],
    [coursework, 'Read chapters 4-5', 'todo', 'low', 'Mohammed', ['reading'], 4, []],
    [coursework, 'Group project standup notes', 'in-progress', 'low', 'Mohammed', ['group'], 0, []],
    [coursework, 'Midterm review sheet', 'todo', 'high', 'Mohammed', ['exam'], 10, []],
    [coursework, 'Submit lab report', 'review', 'high', 'Mohammed', ['lab'], -2, []],
  ];

  const tasks = taskSeeds.map(([project, title, status, priority, assignee, tags, dueOffset, subtaskSeeds]) => {
    const createdAt = daysFromNow(dueOffset - 14);
    return {
      id: createId('task'),
      projectId: project.id,
      title,
      description: '',
      status,
      priority,
      assignee,
      tags,
      dueDate: daysFromNow(dueOffset),
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(createdAt).toISOString(),
      completedAt: status === 'done' ? new Date(daysFromNow(dueOffset + 1)).toISOString() : null,
      subtasks: subtaskSeeds.map(([subtitle, completed]) => ({
        id: createId('subtask'),
        title: subtitle,
        completed,
      })),
    };
  });

  return { projects, tasks };
}
