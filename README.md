# FlowTask Pro

An advanced project and task management dashboard — Kanban board, task list, calendar, and analytics views built with **plain HTML, CSS, and vanilla JavaScript**. No frameworks, no build step, no backend.

Inspired by the workflow concepts of Trello, Jira, and Linear, with its own visual identity: a "flow" gradient (indigo → amber) that runs through progress bars, column headers, and priority markers to represent work moving through a pipeline.

![FlowTask Pro screenshot placeholder](flowtask-pro/screenshots/dashboard.png)

**Live demo:** _add your deployed link here (e.g. GitHub Pages)_

---

## Features

- **Projects** — create, edit, archive, and delete projects with color accents and due dates.
- **Kanban board** — drag-and-drop tasks across Backlog → To Do → In Progress → Review → Done, with a status-dropdown fallback for touch devices.
- **Task list** — sortable, filterable table view with pagination for large task sets.
- **Calendar** — a month grid built from scratch with the native `Date` API, plus a mobile agenda view.
- **Analytics** — completion rate, status/priority breakdowns, weekly activity, and per-project progress, all computed live from stored data (optional Chart.js visuals).
- **Search & filters** — search by title, description, tags, assignee, or project; filter by status, priority, assignee, tag, and due date, all combinable.
- **Task details** — priorities, tags, due dates, assignees, descriptions, and subtasks with progress tracking.
- **Themes** — light, dark, and system, persisted and applied without a flash of the wrong theme.
- **Local persistence** — everything is saved to `localStorage`; nothing leaves the browser.
- **JSON backup/restore** — export your workspace, or import a previous backup with validation and a confirmation step before overwriting.
- **Responsive** — usable from a large desktop down to a phone, with a collapsible sidebar drawer and touch-friendly controls.
- **Accessible** — semantic HTML, visible focus states, keyboard-operable board and calendar, and status conveyed with more than color alone.

---

## Technology stack

- HTML5, CSS3 (custom properties, Grid, Flexbox)
- Vanilla JavaScript (ES2021+, native ES modules — no bundler)
- Native Drag and Drop API
- `localStorage` for persistence
- [Chart.js](https://www.chartjs.org/) via CDN, used only for the dashboard/analytics charts

No React, Vue, Angular, TypeScript, jQuery, Bootstrap, or Tailwind.

---

## Folder structure

```text
flowtask-pro/
├── index.html          Dashboard
├── projects.html        Project management
├── board.html            Kanban board
├── tasks.html            Task list / table view
├── calendar.html         Monthly calendar
├── analytics.html        Charts and metrics
├── settings.html         Preferences, backup, danger zone
│
├── css/
│   ├── reset.css          Minimal element reset
│   ├── variables.css      Design tokens (color, type, spacing, shadow, motion)
│   ├── base.css           Element defaults, focus states
│   ├── layout.css         App shell: sidebar, header, grids
│   ├── components.css     Buttons, cards, modal, board, table, calendar, toasts…
│   ├── utilities.css      Small single-purpose helper classes
│   ├── responsive.css     Breakpoints and mobile layout changes
│   └── pages/             Page-specific tweaks (one file per page)
│
├── js/
│   ├── app.js             Shared shell bootstrap (sidebar + header + theme)
│   ├── constants.js       Enums: statuses, priorities, storage keys
│   ├── state.js           In-memory state + subscribe/notify
│   │
│   ├── services/
│   │   ├── storage.js       The only module that touches localStorage
│   │   ├── taskService.js   Task CRUD + search/filter/sort/stats
│   │   ├── projectService.js Project CRUD + progress calculations
│   │   └── exportService.js  JSON export/import with validation
│   │
│   ├── components/         Reusable UI: sidebar, header, modal, toast,
│   │                        taskCard, taskForm, projectForm, filters,
│   │                        confirmDialog, icons
│   │
│   ├── utils/               dates.js, validation.js, helpers.js, ids.js, theme.js
│   │
│   └── pages/                One controller module per HTML page
│
├── data/demoData.js         First-run seed data
├── screenshots/              Add screenshots here for the README
├── README.md, LICENSE, .gitignore
```

---

## How to run

No build step or server required for most browsers, but ES modules are subject to CORS restrictions when opened via `file://` in some browsers. The reliable way to run it locally:

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or with Node:

```bash
npx serve .
```

On first load, FlowTask Pro seeds itself with realistic demo data (3 projects, ~18 tasks) so the dashboard looks alive immediately. Reset it anytime from **Settings → Reset to demo data**.

---

## Application architecture

**State flows one way:** pages call functions in `js/services/*.js` (e.g. `createTask`, `moveTaskStatus`) → those update `js/state.js` → `state.js` persists through `js/services/storage.js` and notifies subscribers → each page's `render()` re-reads state and re-renders its DOM. No page ever writes to `localStorage` or mutates arrays directly.

**Components are render functions, not classes.** `taskCard.js`, for example, exports a pure function that returns an HTML string for one task. Interactive components like `taskForm.js` and `modal.js` manage their own short-lived DOM and event listeners, and clean up when closed.

**Event delegation over manual rewiring.** The task modal attaches its click/keydown/change listeners once, to the modal's outer container, rather than re-attaching them every time part of the form re-renders (e.g. after adding a tag or subtask). This avoids a common bug class where quick, repeated edits accidentally double-fire an action like "save."

**No framework, on purpose.** The goal is to demonstrate DOM manipulation, event handling, and state management explicitly, in a codebase small enough to explain function-by-function in an interview.

---

## LocalStorage design

Four versioned keys, each owned by one module (`js/services/storage.js`):

| Key | Contents |
|---|---|
| `flowtask_projects_v1` | Array of projects |
| `flowtask_tasks_v1` | Array of tasks |
| `flowtask_settings_v1` | User preferences |
| `flowtask_meta_v1` | Seed/version bookkeeping |

`storage.js` parses defensively: a corrupted or missing value falls back to a safe default instead of throwing, and demo data is only ever seeded once (tracked via `flowtask_meta_v1.seeded`), so re-opening the app never overwrites real work.

---

## Key JavaScript concepts demonstrated

- DOM manipulation and templating without a virtual DOM
- ES6 modules and a layered module structure (services / components / pages)
- Centralized state with a publish/subscribe pattern
- CRUD operations across two related entities (projects, tasks)
- Native Drag and Drop API
- Debounced search, multi-field filtering, and multi-key sorting
- Defensive `localStorage` parsing and JSON import validation
- Client-side form validation with inline error messages (no `alert()`)
- Calendar math with the native `Date` API (month grid, leading/trailing days, year rollovers)
- Responsive design with CSS Grid/Flexbox and a mobile drawer pattern
- Accessible modal dialogs (focus trap, `Escape` to close, ARIA roles)

---

## Accessibility notes

- Semantic landmarks (`<nav>`, `<main>`, `<header>`) and a skip-to-content link.
- All interactive elements are real `<button>`/`<a>` elements — no clickable `<div>`s.
- Visible focus rings on every interactive element, including custom controls like the theme switch and drag targets.
- Modals trap focus, restore focus to the trigger on close, and close on `Escape`.
- Status is never conveyed by color alone — badges pair color with text/icons, and overdue items show a label, not just red text.
- Respects `prefers-reduced-motion`.

Known gap: full drag-and-drop keyboard reordering isn't implemented — the status dropdown/action inside each task's detail view is the keyboard-accessible equivalent for moving a task between columns.

---

## Future improvements

- Keyboard-operable drag-and-drop reordering on the board (not just the fallback dropdown).
- Multi-user support via a real backend (this project is intentionally local-only).
- Recurring tasks and reminders.
- Rich-text task descriptions.
- Undo for destructive actions, in addition to the confirmation dialogs.

---

## Author

**Mohammed Walid Ibrahim El-Henawi**

Cybersecurity student with an interest in networking, security operations, and front-end development.

Built as a portfolio project to demonstrate practical experience with vanilla JavaScript, DOM manipulation, modular architecture, state management, responsive UI design, and building a complete multi-page application without a front-end framework.
