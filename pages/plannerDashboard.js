import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function plannerDashboardPage({ user, data, owners, filters }) {
  const m = data.metrics;
  const senior = data.isSenior;

  const ownerOptions = (owners || [])
    .map(
      (o) =>
        `<option value="${o.id}" ${
          Number(filters.owner_id) === Number(o.id) ? "selected" : ""
        }>${escapeHtml(o.full_name)}</option>`
    )
    .join("");

  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.count));
  const categoryBars = data.byCategory.length
    ? data.byCategory
        .map(
          (c) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="width:110px;font-size:13px">${escapeHtml(c.name)}</span>
          <div style="flex:1;height:8px;background:var(--hairline-strong);border-radius:999px;overflow:hidden">
            <div style="width:${Math.round(
              (c.count / maxCat) * 100
            )}%;height:100%;background:var(--accent)"></div>
          </div>
          <span class="muted" style="font-size:12px">${c.count}</span>
        </div>`
        )
        .join("")
    : `<p class="muted">ยังไม่มีข้อมูล</p>`;

  const weekItems = data.thisWeek.length
    ? data.thisWeek
        .map(
          (w) => `
        <div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--hairline);font-size:13px">
          <a href="/planner/jobs/view?id=${w.id}" style="color:var(--accent);text-decoration:none">${escapeHtml(
            w.cid || "-"
          )} · ${escapeHtml(w.customer_name || "")}</a>
          <span class="muted">${escapeHtml(w.label)} ${escapeHtml(w.date)}</span>
        </div>`
        )
        .join("")
    : `<p class="muted">ไม่มีงานครบกำหนดใน 7 วันข้างหน้า</p>`;

  const maxOwner = Math.max(1, ...data.byOwner.map((o) => o.total));
  const ownerBars = data.byOwner.length
    ? data.byOwner
        .map(
          (o) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="width:110px;font-size:13px">${escapeHtml(o.name)}</span>
          <div style="flex:1;height:8px;background:var(--hairline-strong);border-radius:999px;overflow:hidden">
            <div style="width:${Math.round(
              (o.total / maxOwner) * 100
            )}%;height:100%;background:var(--accent)"></div>
          </div>
          <span class="muted" style="font-size:12px">${o.done}/${o.total}</span>
        </div>`
        )
        .join("")
    : `<p class="muted">ยังไม่มีข้อมูล</p>`;

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "planner-dashboard")}
    <main class="container" id="app" data-ajax>
    <section class="hero">
      <div class="panel-title-row">
        <div>
          <h1>Dashboard</h1>
          <p>${senior ? "ภาพรวมงานของทุกคน" : "ภาพรวมงานของคุณ"}</p>
        </div>
        ${
          senior
            ? `<form action="/planner/dashboard" method="GET" class="action-row">
                 <select name="owner_id" class="filter-input">
                   <option value="">ทุกคน</option>${ownerOptions}
                 </select>
                 <button class="small-btn" type="submit">ดู</button>
               </form>`
            : ""
        }
      </div>
    </section>

    <section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
      ${kpi("งานทั้งหมด", m.total)}
      ${kpi("กำลังทำ", m.in_progress)}
      ${kpi("เสร็จเดือนนี้", m.doneThisMonth)}
      ${kpiDanger("เลยกำหนด", m.overdue)}
    </section>

    <section class="panel">
      <h2>งานสัปดาห์นี้</h2>
      ${weekItems}
    </section>

    <section class="panel">
      <h2>แยกตามหมวด</h2>
      ${categoryBars}
    </section>

    ${
      senior
        ? `<section class="panel">
             <h2>แยกตามคน</h2>
             ${ownerBars}
           </section>`
        : ""
    }
    </main>
  </div>
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function kpi(label, value) {
  return `
    <div class="card">
      <p class="muted" style="font-size:12.5px;margin:0 0 6px">${label}</p>
      <p class="value">${value}</p>
    </div>`;
}

function kpiDanger(label, value) {
  return `
    <div class="card">
      <p class="muted" style="font-size:12.5px;margin:0 0 6px">${label}</p>
      <p class="value" style="color:var(--danger)">${value}</p>
    </div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}