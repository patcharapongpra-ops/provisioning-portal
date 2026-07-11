import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";

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
          <div style="flex:1;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden">
            <div style="width:${Math.round(
              (c.count / maxCat) * 100
            )}%;height:100%;background:#2563eb"></div>
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
        <div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:13px">
          <a href="/planner/jobs/view?id=${w.id}" style="color:#2563eb;text-decoration:none">${escapeHtml(
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
          <div style="flex:1;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden">
            <div style="width:${Math.round(
              (o.total / maxOwner) * 100
            )}%;height:100%;background:#2563eb"></div>
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, ${escapeHtml(user.full_name)} (${escapeHtml(user.role)})</p>
    </div>

    <nav class="nav">
      <a href="/home">Home</a>
      <a href="/planner">Planner</a>
      <a href="/planner/calendar">ปฏิทิน</a>
      <a href="/planner/types">คลังชนิดงาน</a>
      <a href="/logout">Logout</a>
    </nav>
  </header>

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
                 <select name="owner_id" style="padding:9px 12px;border:1px solid #d1d5db;border-radius:10px">
                   <option value="">ทุกคน</option>${ownerOptions}
                 </select>
                 <button class="small-btn" type="submit">ดู</button>
               </form>`
            : ""
        }
      </div>
    </section>

    <section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
      ${kpi("งานทั้งหมด", m.total, "#111827")}
      ${kpi("กำลังทำ", m.in_progress, "#2563eb")}
      ${kpi("เสร็จเดือนนี้", m.doneThisMonth, "#16a34a")}
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
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function kpi(label, value, color) {
  return `
    <div class="card">
      <p class="muted" style="font-size:13px;margin:0 0 6px">${label}</p>
      <p style="font-size:28px;font-weight:800;margin:0;color:${color}">${value}</p>
    </div>`;
}

function kpiDanger(label, value) {
  return `
    <div class="card" style="background:#fef2f2">
      <p style="font-size:13px;margin:0 0 6px;color:#991b1b">${label}</p>
      <p style="font-size:28px;font-weight:800;margin:0;color:#dc2626">${value}</p>
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