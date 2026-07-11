export function mainStyle() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* Neutrals */
  --bg: #eef2f7;
  --bg-grid: rgba(15, 23, 42, 0.035);
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --border: #e4e9f2;
  --border-strong: #d3dbe8;

  /* Text */
  --text: #0f172a;
  --text-2: #334155;
  --muted: #64748b;

  /* Brand */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-active: #1e40af;
  --primary-soft: #eef4ff;
  --primary-ring: rgba(37, 99, 235, 0.28);

  /* Semantic */
  --danger: #dc2626;
  --danger-hover: #b91c1c;
  --ok-bg: #e7f8ee;
  --ok-text: #0f7a43;
  --err-bg: #fdeaea;
  --err-text: #b42318;

  /* Ink surfaces (config output / dark hero) */
  --ink: #0b1220;
  --ink-2: #111a2e;
  --ink-text: #e6edf7;
  --ink-muted: #93a4c3;

  /* Shape */
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 22px;

  /* Elevation */
  --sh-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --sh-md: 0 6px 20px -8px rgba(15, 23, 42, 0.12);
  --sh-lg: 0 24px 60px -24px rgba(15, 23, 42, 0.28);

  /* Type */
  --font-ui: 'Inter', 'Noto Sans Thai', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', ui-monospace, 'SF Mono', Menlo, monospace;
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
  color: var(--text);
  background-color: var(--bg);
  background-image:
    linear-gradient(var(--bg-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--bg-grid) 1px, transparent 1px);
  background-size: 28px 28px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.5;
}

::selection {
  background: var(--primary-ring);
}

/* ------------------------------------------------------------------ */
/* Login                                                              */
/* ------------------------------------------------------------------ */
.login-body {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background:
    radial-gradient(1200px 600px at 15% -10%, rgba(37, 99, 235, 0.18), transparent 60%),
    radial-gradient(1000px 700px at 110% 110%, rgba(14, 116, 144, 0.16), transparent 55%),
    var(--bg);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  padding: 40px 34px 34px;
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-lg);
  text-align: center;
  overflow: hidden;
}

.login-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), #0ea5b7);
}

.login-card h1 {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.login-card p {
  margin: 0 0 26px;
  color: var(--muted);
  font-size: 15px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.login-form input {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  font-size: 15px;
  font-family: inherit;
  background: var(--surface-2);
  color: var(--text);
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

.login-form input::placeholder {
  color: #9aa6b8;
}

.login-form input:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}

.login-form button {
  width: 100%;
  margin-top: 6px;
  padding: 13px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--primary);
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background .15s ease, transform .05s ease;
}

.login-form button:hover {
  background: var(--primary-hover);
}

.login-form button:active {
  transform: translateY(1px);
  background: var(--primary-active);
}

/* ------------------------------------------------------------------ */
/* Alerts                                                             */
/* ------------------------------------------------------------------ */
.alert {
  padding: 12px 14px;
  border-radius: var(--r-md);
  margin-bottom: 18px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert::before {
  font-family: var(--font-mono);
  font-weight: 700;
  opacity: .9;
}

.alert.error {
  background: var(--err-bg);
  color: var(--err-text);
  border-color: rgba(180, 35, 24, 0.18);
}

.alert.error::before { content: "!"; }

.alert.success {
  background: var(--ok-bg);
  color: var(--ok-text);
  border-color: rgba(15, 122, 67, 0.18);
}

.alert.success::before { content: "\\2713"; }

/* ------------------------------------------------------------------ */
/* Topbar / nav                                                       */
/* ------------------------------------------------------------------ */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: saturate(140%) blur(10px);
  -webkit-backdrop-filter: saturate(140%) blur(10px);
  padding: 14px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.topbar h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar h2::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(135deg, var(--primary), #0ea5b7);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.topbar p {
  margin: 3px 0 0 20px;
  color: var(--muted);
  font-size: 13px;
}

.nav {
  display: flex;
  gap: 4px;
  align-items: center;
}

.nav a {
  color: var(--text-2);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  transition: background .15s ease, color .15s ease;
}

.nav a:hover {
  text-decoration: none;
  color: var(--primary);
  background: var(--primary-soft);
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */
.container {
  max-width: 1120px;
  margin: 32px auto 64px;
  padding: 0 24px;
}

.wide-container {
  max-width: 1440px;
}

.hero {
  position: relative;
  background: var(--surface);
  padding: 30px 32px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  margin-bottom: 24px;
  box-shadow: var(--sh-sm);
  overflow: hidden;
}

.hero::after {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--primary), #0ea5b7);
}

.hero h1 {
  margin: 0 0 6px;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero p {
  color: var(--muted);
  margin: 0;
  font-size: 15px;
}

.dark-hero {
  background: linear-gradient(135deg, var(--ink), var(--ink-2));
  color: #fff;
  border-color: transparent;
}

.dark-hero h1 { color: #fff; }

.dark-hero p {
  color: var(--ink-muted);
}

.dark-hero::after {
  background: linear-gradient(180deg, #38bdf8, #0ea5b7);
}

/* ------------------------------------------------------------------ */
/* Cards grid                                                         */
/* ------------------------------------------------------------------ */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.card {
  position: relative;
  display: block;
  background: var(--surface);
  padding: 22px 22px 20px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  text-decoration: none;
  color: var(--text);
  box-shadow: var(--sh-sm);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

a.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--sh-md);
  border-color: var(--border-strong);
}

a.card::after {
  content: "\\2192";
  position: absolute;
  top: 20px;
  right: 20px;
  color: var(--muted);
  font-weight: 700;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity .18s ease, transform .18s ease, color .18s ease;
}

a.card:hover::after {
  opacity: 1;
  transform: translateX(0);
  color: var(--primary);
}

.card h3 {
  margin: 0 0 6px;
  color: var(--primary);
  font-size: 16px;
  font-weight: 700;
}

.card p {
  color: var(--muted);
  margin: 0;
  font-size: 14px;
}

/* ------------------------------------------------------------------ */
/* Panels                                                             */
/* ------------------------------------------------------------------ */
.panel {
  background: var(--surface);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-sm);
  overflow-x: auto;
}

.panel + .panel {
  margin-top: 22px;
}

.panel h2 {
  margin: 0 0 18px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
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
  gap: 7px;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-2);
}

.admin-form input,
.admin-form select {
  padding: 11px 13px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  font-size: 15px;
  font-family: inherit;
  font-weight: 400;
  background: var(--surface-2);
  color: var(--text);
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

.admin-form input::placeholder {
  color: #9aa6b8;
}

.admin-form input:focus,
.admin-form select:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}

select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2364748b' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 13px center;
  padding-right: 34px !important;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                            */
/* ------------------------------------------------------------------ */
.primary-btn {
  width: fit-content;
  padding: 11px 20px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--primary);
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background .15s ease, transform .05s ease, box-shadow .15s ease;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.25);
}

.primary-btn:hover { background: var(--primary-hover); }
.primary-btn:active { transform: translateY(1px); background: var(--primary-active); }

.inline-form {
  margin: 0;
  display: inline;
}

.small-btn {
  padding: 7px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text-2);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

.small-btn:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.danger-btn {
  padding: 7px 11px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: var(--r-sm);
  background: #fff;
  color: var(--danger);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.danger-btn:hover {
  background: var(--danger);
  color: #fff;
  border-color: var(--danger);
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
  border-radius: var(--r-md);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

.primary-link-btn {
  background: var(--primary);
  color: #fff;
  padding: 11px 18px;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.25);
}

.primary-link-btn:hover { background: var(--primary-hover); }

.secondary-link-btn {
  color: var(--text-2);
  padding: 11px 18px;
  font-size: 14px;
  border: 1px solid var(--border-strong);
}

.secondary-link-btn:hover {
  background: var(--surface-2);
  color: var(--text);
}

.small-link-btn {
  background: var(--primary-soft);
  color: var(--primary);
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 600;
}

.small-link-btn:hover {
  background: var(--primary);
  color: #fff;
}

/* ------------------------------------------------------------------ */
/* Tables                                                             */
/* ------------------------------------------------------------------ */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;
}

th, td {
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

th {
  color: var(--muted);
  background: var(--surface-2);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  position: sticky;
  top: 0;
}

th:first-child { border-top-left-radius: var(--r-sm); }
th:last-child { border-top-right-radius: var(--r-sm); }

tbody tr {
  transition: background .12s ease;
}

tbody tr:hover {
  background: var(--primary-soft);
}

tbody tr:last-child td {
  border-bottom: 0;
}

td:first-child {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
}

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid rgba(37, 99, 235, 0.16);
}

.badge-gray {
  background: #eef1f6;
  color: var(--muted);
  border-color: var(--border);
}

/* ------------------------------------------------------------------ */
/* Config output (terminal)                                           */
/* ------------------------------------------------------------------ */
.config-output {
  position: relative;
  background: var(--ink);
  color: var(--ink-text);
  padding: 42px 20px 20px;
  border-radius: var(--r-md);
  border: 1px solid var(--ink-2);
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: 13.5px;
  line-height: 1.65;
  tab-size: 2;
}

.config-output::before {
  content: "";
  position: absolute;
  top: 15px;
  left: 18px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ff5f57;
  box-shadow: 18px 0 0 #febc2e, 36px 0 0 #28c840;
}

/* ------------------------------------------------------------------ */
/* Utility                                                            */
/* ------------------------------------------------------------------ */
.muted {
  color: var(--muted);
  margin: 0;
  font-size: 14px;
}

.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* Help / hint box */
.help-box {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-left: 3px solid var(--primary);
  border-radius: var(--r-md);
  padding: 14px 16px;
  color: var(--text-2);
  font-size: 14px;
}

.help-box p {
  margin: 8px 0 0;
  color: var(--muted);
}

.help-box code,
.transform-grid code {
  background: #e8edf5;
  color: var(--primary-active);
  padding: 2px 6px;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 12.5px;
}

/* Textareas */
textarea {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  font-size: 13.5px;
  font-family: var(--font-mono);
  line-height: 1.6;
  background: var(--surface-2);
  color: var(--text);
  resize: vertical;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

textarea:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}

/* ------------------------------------------------------------------ */
/* Field builder                                                      */
/* ------------------------------------------------------------------ */
.field-builder-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}

.field-builder-table {
  min-width: 1250px;
}

.field-builder-table th {
  position: static;
}

.field-builder-table input,
.field-builder-table select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-family: inherit;
  background: var(--surface);
  color: var(--text);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.field-builder-table input:focus,
.field-builder-table select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-ring);
}

.fb-field-key {
  font-family: var(--font-mono) !important;
  font-weight: 600;
}

.fb-options-text {
  width: 100%;
  min-width: 180px;
  padding: 8px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  font-size: 12px;
  font-family: var(--font-mono);
  background: var(--surface);
  resize: vertical;
}

.center-cell {
  text-align: center;
}

.center-cell input {
  width: auto;
  accent-color: var(--primary);
  transform: scale(1.15);
}

/* Transform help legend */
.transform-help {
  margin-bottom: 18px;
}

.transform-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
  margin-top: 12px;
}

.transform-grid div {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.transform-grid span {
  color: var(--muted);
  font-size: 13px;
}

/* Row move + drag */
.move-btns {
  display: flex;
  gap: 4px;
}

.mini-btn {
  padding: 6px 9px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text-2);
  font-weight: 800;
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.mini-btn:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.drag-box {
  display: flex;
  align-items: center;
  gap: 6px;
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--muted);
  font-weight: 900;
  cursor: grab;
  user-select: none;
  transition: background .15s ease, color .15s ease;
}

.drag-handle:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.drag-handle:active {
  cursor: grabbing;
}

.field-row.dragging {
  opacity: 0.5;
  background: var(--primary-soft);
}

.field-row {
  cursor: grab;
}

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
.small-btn:focus-visible,
.mini-btn:focus-visible,
.danger-btn:focus-visible,
.primary-btn:focus-visible,
.primary-link-btn:focus-visible,
.secondary-link-btn:focus-visible,
.small-link-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ------------------------------------------------------------------ */
/* Responsive                                                         */
/* ------------------------------------------------------------------ */
@media (max-width: 800px) {
  .transform-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 20px;
  }

  .topbar p {
    margin-left: 20px;
  }

  .nav {
    flex-wrap: wrap;
  }

  .container {
    margin: 24px auto 48px;
    padding: 0 16px;
  }

  .hero, .panel {
    padding: 20px;
  }

  .login-card {
    padding: 32px 22px 26px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .panel-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-row {
    flex-wrap: wrap;
  }
}

/* ------------------------------------------------------------------ */
/* Reduced motion                                                     */
/* ------------------------------------------------------------------ */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
`;
}