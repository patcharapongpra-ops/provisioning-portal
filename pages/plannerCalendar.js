import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function plannerCalendarPage({ user, cal, owners, filters }) {
  const senior = user.role === "staff" || user.role === "admin";

  const ownerOptions = (owners || [])
    .map(
      (o) =>
        `<option value="${o.id}" ${
          Number(filters.owner_id) === Number(o.id) ? "selected" : ""
        }>${escapeHtml(o.full_name)}</option>`
    )
    .join("");

  const ownerQS = filters.owner_id ? `&owner_id=${encodeURIComponent(filters.owner_id)}` : "";

  const colors = {
    install: ["var(--accent-soft)", "var(--accent)"],
    delivery: ["var(--ok-soft)", "var(--ok)"],
    crclose: ["var(--warn-soft)", "var(--warn)"],
  };

  const weekdays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
  const headerCells = weekdays
    .map((d) => `<div class="muted" style="text-align:center;font-size:12px;padding:4px">${d}</div>`)
    .join("");

  const cells = cal.days
    .map((cell) => {
      if (!cell) {
        return `<div style="min-height:74px;border:1px solid var(--hairline);border-radius:8px;background:var(--surface-2)"></div>`;
      }
      const isToday = cell.date === cal.today;
      const pills = cell.events
        .map((ev) => {
          const [bg, fg] = colors[ev.kind];
          return `<a href="/planner/jobs/view?id=${ev.id}" style="display:block;background:${bg};color:${fg};font-size:11px;padding:1px 6px;border-radius:6px;margin-top:2px;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(
            ev.cid || "-"
          )}</a>`;
        })
        .join("");

      return `
        <div style="min-height:74px;border:1px solid ${
          isToday ? "var(--accent)" : "var(--hairline)"
        };border-radius:8px;padding:4px">
          <div style="font-size:12px;${
            isToday ? "color:var(--accent);font-weight:700" : "color:var(--ink-3)"
          }">${cell.day}</div>
          ${pills}
        </div>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ปฏิทิน - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "planner-calendar")}
    <main class="container wide-container" id="app" data-ajax>
    <section class="hero">
      <div class="panel-title-row">
        <div>
          <h1>${escapeHtml(cal.monthLabel)}</h1>
          <p>
            <span class="badge" style="background:var(--accent-soft);color:var(--accent)">ติดตั้ง</span>
            <span class="badge" style="background:var(--ok-soft);color:var(--ok)">ส่งมอบ</span>
            <span class="badge" style="background:var(--warn-soft);color:var(--warn)">ปิด CR</span>
          </p>
        </div>
        <div class="action-row">
          ${
            senior
              ? `<form action="/planner/calendar" method="GET" class="action-row">
                   <input type="hidden" name="ym" value="${escapeHtml(cal.month)}">
                   <select name="owner_id" class="filter-input">
                     <option value="">ทุกคน</option>${ownerOptions}
                   </select>
                   <button class="small-btn" type="submit">ดู</button>
                 </form>`
              : ""
          }
          <a class="secondary-link-btn" href="/planner/calendar?ym=${cal.prevYm}${ownerQS}">‹ ก่อนหน้า</a>
          <a class="secondary-link-btn" href="/planner/calendar?ym=${cal.nextYm}${ownerQS}">ถัดไป ›</a>
        </div>
      </div>
    </section>

    <section class="panel">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
        ${headerCells}
        ${cells}
      </div>
    </section>
    </main>
  </div>
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}