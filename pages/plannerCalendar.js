import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function plannerCalendarPage({ user, cal, owners, filters, error, success }) {
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
    holiday: ["var(--danger-soft)", "var(--danger)"],
    personal: ["var(--violet-soft)", "var(--violet)"],
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
      const isHoliday = cell.events.some((ev) => ev.kind === "holiday");
      const pills = cell.events
        .map((ev) => {
          const [bg, fg] = colors[ev.kind] || colors.install;
          const pillStyle = `display:block;background:${bg};color:${fg};font-size:11px;padding:1px 6px;border-radius:6px;margin-top:2px;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
          const label = escapeHtml(ev.label || "-");

          if (ev.kind === "holiday" || ev.kind === "personal") {
            return `<span style="${pillStyle}" title="${label}">${label}</span>`;
          }
          return `<a href="/planner/jobs/view?id=${ev.id}" style="${pillStyle}" title="${label}">${label}</a>`;
        })
        .join("");

      return `
        <div style="min-height:74px;border:1px solid ${
          isToday ? "var(--accent)" : "var(--hairline)"
        };border-radius:8px;padding:4px${isHoliday ? ";background:var(--danger-soft)" : ""}">
          <div style="font-size:12px;${
            isToday ? "color:var(--accent);font-weight:700" : "color:var(--ink-3)"
          }">${cell.day}</div>
          ${pills}
        </div>`;
    })
    .join("");

  const myEventRows = (cal.myEvents || [])
    .map(
      (ev) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--hairline);font-size:13.5px">
        <div>
          <span style="font-family:var(--font-mono);font-size:12.5px;color:var(--ink-3)">${escapeHtml(ev.event_date)}</span>
          &nbsp;<strong>${escapeHtml(ev.title)}</strong>
          ${ev.note ? `<span class="muted"> — ${escapeHtml(ev.note)}</span>` : ""}
        </div>
        <form action="/planner/events/delete" method="POST" class="inline-form" onsubmit="return confirm('ลบอีเว้นท์นี้?')">
          <input type="hidden" name="event_id" value="${ev.id}">
          <button class="mini-btn" type="submit">✕</button>
        </form>
      </div>`
    )
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
            <span class="badge" style="background:var(--danger-soft);color:var(--danger)">วันหยุด</span>
            <span class="badge" style="background:var(--violet-soft);color:var(--violet)">อีเว้นท์ของฉัน</span>
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

    ${showMessage(error, success)}

    <section class="panel">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
        ${headerCells}
        ${cells}
      </div>
    </section>

    <section class="panel">
      <div class="panel-title-row">
        <div>
          <h2>อีเว้นท์ของฉัน</h2>
          <p class="muted">เห็นเฉพาะคุณคนเดียว — แสดงในปฏิทินเดือนนี้</p>
        </div>
      </div>

      <form action="/planner/events/create" method="POST" class="action-row" style="margin-bottom:14px">
        <input name="event_date" type="date" class="filter-input" required>
        <input name="title" type="text" class="filter-input" placeholder="ชื่ออีเว้นท์ เช่น ลาพักร้อน, นัดลูกค้า" required maxlength="120" style="flex:1;min-width:180px">
        <input name="note" type="text" class="filter-input" placeholder="โน้ต (ไม่บังคับ)" maxlength="500" style="flex:1;min-width:140px">
        <button class="primary-btn" type="submit">+ เพิ่ม</button>
      </form>

      ${myEventRows || `<p class="muted">ยังไม่มีอีเว้นท์ในเดือนนี้</p>`}
    </section>
    </main>
  </div>
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success === "event_created") return `<div class="alert success">เพิ่มอีเว้นท์แล้ว</div>`;
  if (success === "event_deleted") return `<div class="alert success">ลบอีเว้นท์แล้ว</div>`;
  if (error === "event") return `<div class="alert error">กรุณากรอกชื่ออีเว้นท์และวันที่ให้ถูกต้อง</div>`;
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}