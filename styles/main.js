export function mainStyle() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* Paper / surfaces (light) */
  --paper: #f6f6f3;
  --surface: #ffffff;
  --surface-2: #fbfbf9;
  --hairline: #e6e5e0;
  --hairline-strong: #d8d7d0;

  /* Ink (light) */
  --ink: #16181f;
  --ink-2: #4c525f;
  --ink-3: #868c99;

  /* Accent — one restrained hue, used sparingly */
  --accent: #24466b;
  --accent-hover: #1b3552;
  --accent-soft: #eaf0f6;
  --accent-ink: #ffffff;
  --accent-ring: rgba(36, 70, 107, 0.22);

  /* Semantic (separate from accent) */
  --ok: #2f6b4f;
  --ok-soft: #e9f2ec;
  --warn: #93650f;
  --warn-soft: #f7efe0;
  --danger: #9c3b3b;
  --danger-soft: #f6ecec;
  --violet: #6a58a5;
  --violet-soft: #efebf7;
  --teal: #1f6f6b;
  --teal-soft: #e6f2f1;

  /* Terminal / config output (always dark, independent of theme) */
  --ink-surface: #0c0e13;
  --ink-surface-2: #14171e;
  --ink-surface-text: #dfe6e3;
  --ink-surface-muted: #7c8a90;

  /* Shape */
  --r-sm: 7px;
  --r-md: 11px;
  --r-lg: 16px;

  /* Elevation (kept quiet — hairlines do most of the work) */
  --sh-sm: 0 1px 2px rgba(20, 22, 30, 0.04);
  --sh-md: 0 10px 28px -14px rgba(20, 22, 30, 0.16);

  /* Type */
  --font-serif: 'Source Serif 4', Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  --font-ui: 'Inter', 'Noto Sans Thai', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', ui-monospace, 'SF Mono', Menlo, monospace;

  color-scheme: light;
}

:root[data-theme="dark"] {
  --paper: #14161c;
  --surface: #1b1e26;
  --surface-2: #20232c;
  --hairline: #2a2d36;
  --hairline-strong: #363a45;

  --ink: #edeef2;
  --ink-2: #a7acb8;
  --ink-3: #6d7280;

  --accent: #8fb2d6;
  --accent-hover: #a7c4e2;
  --accent-soft: rgba(143, 178, 214, 0.14);
  --accent-ink: #0d1620;
  --accent-ring: rgba(143, 178, 214, 0.28);

  --ok: #6fbe97;
  --ok-soft: rgba(111, 190, 151, 0.12);
  --warn: #d9ab5c;
  --warn-soft: rgba(217, 171, 92, 0.12);
  --danger: #d98686;
  --danger-soft: rgba(217, 134, 134, 0.12);
  --violet: #b4a5e3;
  --violet-soft: rgba(180, 165, 227, 0.14);
  --teal: #7cc7c2;
  --teal-soft: rgba(124, 199, 194, 0.13);

  --sh-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --sh-md: 0 10px 28px -14px rgba(0, 0, 0, 0.5);

  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: var(--font-ui);
  color: var(--ink);
  background-color: var(--paper);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.55;
  transition: background-color .15s ease, color .15s ease;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    scroll-behavior: auto !important;
    animation: none !important;
  }
}

::selection {
  background: var(--accent-ring);
}

h1, h2, h3 {
  font-family: var(--font-serif);
  letter-spacing: -0.01em;
  text-wrap: balance;
}

/* ------------------------------------------------------------------ */
/* Login (no sidebar — standalone screen)                             */
/* ------------------------------------------------------------------ */
.login-body {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: var(--paper);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  padding: 40px 34px 34px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-md);
  text-align: center;
}

.login-card h1 {
  margin: 0 0 8px;
  font-size: 25px;
  font-weight: 700;
}

.login-card p {
  margin: 0 0 26px;
  color: var(--ink-3);
  font-size: 14.5px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.login-form input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  font-size: 15px;
  font-family: inherit;
  background: var(--surface-2);
  color: var(--ink);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.login-form input::placeholder {
  color: var(--ink-3);
}

.login-form input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.login-form button {
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  border: 0;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--accent-ink);
  font-family: inherit;
  font-weight: 700;
  font-size: 14.5px;
  cursor: pointer;
  transition: background .15s ease, transform .05s ease;
}

.login-form button:hover { background: var(--accent-hover); }
.login-form button:active { transform: translateY(1px); }

/* ------------------------------------------------------------------ */
/* Alerts                                                             */
/* ------------------------------------------------------------------ */
.alert {
  padding: 11px 14px;
  border-radius: var(--r-sm);
  margin-bottom: 18px;
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert.error { background: var(--danger-soft); color: var(--danger); }
.alert.success { background: var(--ok-soft); color: var(--ok); }

/* ------------------------------------------------------------------ */
/* App shell — sidebar + main content                                 */
/* ------------------------------------------------------------------ */
.app-shell {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
}

.sidebar {
  width: 228px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--hairline);
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.wordmark {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 4px 0 0 10px;
}

.wordmark span {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-top: 3px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-group h4 {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 6px 10px;
}

.nav-group a {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--ink-2);
  text-decoration: none;
  font-weight: 500;
  font-size: 13.5px;
  padding: 7px 10px;
  border-radius: var(--r-sm);
  transition: background .12s ease, color .12s ease;
}

.nav-group a:hover { background: var(--surface-2); color: var(--ink); }

.nav-group a.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
}

.nav-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: .55;
  flex-shrink: 0;
}

.sidebar-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--hairline);
  padding-top: 14px;
}

.who {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
}

.who-av {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.who-meta { font-size: 12.5px; line-height: 1.3; }
.who-meta b { display: block; font-weight: 700; color: var(--ink); }
.who-meta span { color: var(--ink-3); font-size: 11.5px; }

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  padding: 6px 6px 6px 13px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--ink-2);
  background: var(--surface);
  cursor: pointer;
  width: 100%;
}

.theme-switch {
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--hairline-strong);
  position: relative;
  flex-shrink: 0;
}

.theme-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform .15s ease;
}

:root[data-theme="dark"] .theme-switch { background: var(--accent); }
:root[data-theme="dark"] .theme-switch::after { transform: translateX(14px); }

.logout-link {
  text-align: center;
  color: var(--ink-3);
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px;
  border-radius: var(--r-sm);
}

.logout-link:hover { background: var(--surface-2); color: var(--ink); }

/* ------------------------------------------------------------------ */
/* Main content pane                                                  */
/* ------------------------------------------------------------------ */
.container,
.wide-container {
  flex: 1;
  min-width: 0;
  max-width: 1080px;
  padding: 30px 36px 64px;
}

.wide-container { max-width: 1360px; }

/* ------------------------------------------------------------------ */
/* Hero / page header                                                 */
/* ------------------------------------------------------------------ */
.hero, .dark-hero {
  padding: 0 0 20px;
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 26px;
}

.hero h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
}

.hero p {
  color: var(--ink-2);
  margin: 0;
  font-size: 14.5px;
  max-width: 62ch;
}

/* ------------------------------------------------------------------ */
/* Cards grid                                                         */
/* ------------------------------------------------------------------ */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.card {
  position: relative;
  display: block;
  background: var(--surface);
  padding: 20px 20px 18px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  text-decoration: none;
  color: var(--ink);
  transition: border-color .15s ease, transform .15s ease;
}

a.card:hover {
  border-color: var(--hairline-strong);
  transform: translateY(-2px);
}

.card h3 {
  margin: 0 0 6px;
  color: var(--ink);
  font-size: 15.5px;
  font-weight: 700;
}

.card p {
  color: var(--ink-3);
  margin: 0;
  font-size: 13.5px;
}

.card .value {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* ------------------------------------------------------------------ */
/* Panels                                                             */
/* ------------------------------------------------------------------ */
.panel {
  background: var(--surface);
  padding: 22px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  overflow-x: auto;
}

.panel + .panel {
  margin-top: 18px;
}

.panel h2 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.panel-title-row h2 {
  margin: 0;
}

/* ------------------------------------------------------------------ */
/* Forms                                                              */
/* ------------------------------------------------------------------ */
.admin-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.admin-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 12.5px;
  color: var(--ink-2);
}

.admin-form input,
.admin-form select {
  padding: 10px 12px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  font-size: 14.5px;
  font-family: inherit;
  font-weight: 400;
  background: var(--surface-2);
  color: var(--ink);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.admin-form input::placeholder {
  color: var(--ink-3);
}

.admin-form input:focus,
.admin-form select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.filter-input {
  padding: 9px 12px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  font-size: 13.5px;
  font-family: inherit;
  background: var(--surface);
  color: var(--ink);
}

.filter-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23868c99' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 13px center;
  padding-right: 34px !important;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                            */
/* ------------------------------------------------------------------ */
.primary-btn {
  width: fit-content;
  padding: 10px 18px;
  border: 0;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--accent-ink);
  font-family: inherit;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: background .15s ease, transform .05s ease;
}

.primary-btn:hover { background: var(--accent-hover); }
.primary-btn:active { transform: translateY(1px); }

.inline-form {
  margin: 0;
  display: inline;
}

.small-btn {
  padding: 7px 12px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink-2);
  font-family: inherit;
  font-weight: 600;
  font-size: 12.5px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

.small-btn:hover {
  background: var(--surface-2);
  border-color: var(--hairline-strong);
  color: var(--ink);
}

.danger-btn {
  padding: 7px 11px;
  border: 1px solid var(--danger-soft);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--danger);
  font-family: inherit;
  font-weight: 600;
  font-size: 12.5px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.danger-btn:hover {
  background: var(--danger-soft);
}

/* Link buttons */
.primary-link-btn,
.secondary-link-btn,
.small-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 700;
  border-radius: var(--r-sm);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

.primary-link-btn {
  background: var(--accent);
  color: var(--accent-ink);
  padding: 10px 18px;
  font-size: 13.5px;
}

.primary-link-btn:hover { background: var(--accent-hover); }

.secondary-link-btn {
  color: var(--ink-2);
  padding: 10px 18px;
  font-size: 13.5px;
  border: 1px solid var(--hairline-strong);
}

.secondary-link-btn:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.small-link-btn {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 600;
}

.small-link-btn:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

/* ------------------------------------------------------------------ */
/* Tables                                                             */
/* ------------------------------------------------------------------ */
table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

th, td {
  text-align: left;
  padding: 11px 13px;
  border-bottom: 1px solid var(--hairline);
  font-size: 13.5px;
}

th {
  color: var(--ink-3);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--hairline-strong);
}

tbody tr:hover {
  background: var(--surface-2);
}

tbody tr:last-child td {
  border-bottom: 0;
}

td:first-child {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 13px;
}

/* ------------------------------------------------------------------ */
/* Badges — quiet dot + label, not a filled pill                      */
/* ------------------------------------------------------------------ */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.01em;
}

.badge::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.badge-gray { color: var(--ink-3); background: var(--surface-2); }
.badge-todo { color: var(--ink-3); background: var(--surface-2); }
.badge-progress { color: var(--accent); background: var(--accent-soft); }
.badge-done { color: var(--ok); background: var(--ok-soft); }
.badge-overdue { color: var(--danger); background: var(--danger-soft); }

/* ------------------------------------------------------------------ */
/* Config output (terminal) — intentionally dark regardless of theme  */
/* ------------------------------------------------------------------ */
.config-output {
  position: relative;
  background: var(--ink-surface);
  color: var(--ink-surface-text);
  padding: 38px 20px 20px;
  border-radius: var(--r-md);
  border: 1px solid var(--ink-surface-2);
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  tab-size: 2;
}

.config-output::before {
  content: "";
  position: absolute;
  top: 15px;
  left: 18px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d98686;
  box-shadow: 17px 0 0 #d9ab5c, 34px 0 0 #6fbe97;
}

/* ------------------------------------------------------------------ */
/* Utility                                                            */
/* ------------------------------------------------------------------ */
.muted {
  color: var(--ink-3);
  margin: 0;
  font-size: 13.5px;
}

.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.help-box {
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--accent);
  border-radius: var(--r-sm);
  padding: 14px 16px;
  color: var(--ink-2);
  font-size: 13.5px;
}

.help-box p {
  margin: 8px 0 0;
  color: var(--ink-3);
}

.help-box code {
  background: var(--surface);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 12px;
}

textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-family: var(--font-mono);
  line-height: 1.6;
  background: var(--surface-2);
  color: var(--ink);
  resize: vertical;
  transition: border-color .15s ease, box-shadow .15s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

/* ------------------------------------------------------------------ */
/* Field builder (template + type step editors)                       */
/* ------------------------------------------------------------------ */
.field-builder-wrap {
  overflow-x: auto;
  border: 1px solid var(--hairline);
  border-radius: var(--r-sm);
}

.field-builder-table {
  min-width: 640px;
}

.field-builder-table input,
.field-builder-table select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-family: inherit;
  background: var(--surface);
  color: var(--ink);
}

.field-builder-table input:focus,
.field-builder-table select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}

.center-cell { text-align: center; }

.center-cell input {
  width: auto;
  accent-color: var(--accent);
}

.move-btns {
  display: flex;
  gap: 4px;
}

.mini-btn {
  padding: 6px 9px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink-2);
  font-weight: 700;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.mini-btn:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  color: var(--ink-3);
  font-weight: 900;
  cursor: grab;
  user-select: none;
}

.drag-handle:hover { color: var(--accent); }
.drag-handle:active { cursor: grabbing; }

.field-row.dragging {
  opacity: 0.5;
  background: var(--accent-soft);
}

.field-row { cursor: grab; }

.field-row input,
.field-row select,
.field-row textarea,
.field-row button {
  cursor: auto;
}

/* ------------------------------------------------------------------ */
/* Focus visibility (a11y)                                            */
/* ------------------------------------------------------------------ */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ------------------------------------------------------------------ */
/* Stacked tables — จอเล็กเปลี่ยนตารางเป็นการ์ด (ใช้ class stack-table) */
/* ------------------------------------------------------------------ */
.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

/* คู่ช่อง วันที่+เวลา ในฟอร์มจองรถ — ให้หดได้บนจอแคบ ไม่ล้นกรอบ */
.admin-form .action-row input {
  min-width: 0;
}

@media (max-width: 700px) {
  .form-row-3 { grid-template-columns: 1fr; }

  .stack-table thead { display: none; }

  .stack-table,
  .stack-table tbody,
  .stack-table tr,
  .stack-table td {
    display: block;
    width: 100%;
  }

  .stack-table tr {
    border: 1px solid var(--hairline);
    border-radius: var(--r-md);
    padding: 10px 14px;
    margin-bottom: 10px;
  }

  .stack-table td {
    border-bottom: 0;
    padding: 4px 0;
    font-size: 14px;
    white-space: normal;
  }

  .stack-table td[data-label]::before {
    content: attr(data-label);
    display: inline-block;
    width: 86px;
    color: var(--ink-3);
    font-size: 12px;
    font-weight: 600;
    vertical-align: top;
  }

  .stack-table td:first-child {
    font-family: inherit;
    font-size: 14px;
    color: var(--ink);
  }

  .stack-table .row-actions-empty { display: none; }
  .stack-table .action-row { flex-wrap: wrap; }
  .stack-table .filter-input { width: 100% !important; }

  /* ปุ่มใหญ่ขึ้นให้กดง่ายด้วยนิ้ว */
  .stack-table .small-btn,
  .stack-table .danger-btn {
    padding: 10px 16px;
    font-size: 13.5px;
  }
}

/* ------------------------------------------------------------------ */
/* Print (บันทึกการใช้รถรายเดือน ฯลฯ)                                  */
/* ------------------------------------------------------------------ */
.print-only { display: none; }

@media print {
  .sidebar, .no-print { display: none !important; }
  .print-only { display: block; }
  .app-shell { display: block; }
  .container, .wide-container { max-width: 100%; padding: 0; margin: 0; }
  body { background: #fff; }
  .panel { border: 0; box-shadow: none; padding: 0; overflow: visible; }
  th { background: #f0f0f0 !important; color: #000; }
  th, td { border: 1px solid #999; padding: 5px 7px; }
}

/* ------------------------------------------------------------------ */
/* Responsive                                                         */
/* ------------------------------------------------------------------ */
@media (max-width: 900px) {
  .app-shell { flex-direction: column; }

  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    flex-direction: row;
    align-items: center;
    overflow-x: auto;
    gap: 18px;
    padding: 14px 18px;
  }

  .wordmark { display: none; }

  .nav-group { flex-direction: row; align-items: center; }
  .nav-group h4 { display: none; }
  .nav-group a { white-space: nowrap; }

  .sidebar-foot {
    flex-direction: row;
    align-items: center;
    margin-top: 0;
    margin-left: auto;
    border-top: 0;
    padding-top: 0;
  }

  .who-meta { display: none; }
  .theme-toggle { width: auto; }
  .logout-link { white-space: nowrap; }

  .container, .wide-container {
    padding: 20px 18px 44px;
    max-width: 100%;
  }

  .form-row { grid-template-columns: 1fr; }
  .panel-title-row { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 640px) {
  .login-card { padding: 32px 22px 26px; }
}
`;
}
