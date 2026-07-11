import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function plannerBoardPage({ user, jobs, categories, owners, filters, success }) {
  const senior = user.role === "staff" || user.role === "admin";

  const categoryOptions = (categories || [])
    .map(
      (c) =>
        `<option value="${c.id}" ${
          Number(filters.category_id) === Number(c.id) ? "selected" : ""
        }>${escapeHtml(c.name)}</option>`
    )
    .join("");

  const ownerOptions = (owners || [])
    .map(
      (o) =>
        `<option value="${o.id}" ${
          Number(filters.owner_id) === Number(o.id) ? "selected" : ""
        }>${escapeHtml(o.full_name)}</option>`
    )
    .join("");

  const statusOptions = [
    ["", "ทุกสถานะ"],
    ["todo", "ยังไม่เริ่ม"],
    ["in_progress", "กำลังทำ"],
    ["done", "เสร็จ"],
    ["overdue", "เลยกำหนด"],
  ]
    .map(
      ([val, label]) =>
        `<option value="${val}" ${filters.status === val ? "selected" : ""}>${label}</option>`
    )
    .join("");

  const rows = (jobs || [])
    .map((job) => {
      const total = Number(job.step_total) || 0;
      const done = Number(job.step_done) || 0;
      const pct = total ? Math.round((done / total) * 100) : 0;

      return `
      <tr onclick="location.href='/planner/jobs/view?id=${job.id}'" style="cursor:pointer">
        <td>${escapeHtml(job.cid || "-")}</td>
        <td>${escapeHtml(job.customer_name || "-")}</td>
        <td>${escapeHtml(job.sof || "-")}</td>
        <td>${escapeHtml(job.type_name || "-")}</td>
        ${senior ? `<td>${escapeHtml(job.owner_name || "-")}</td>` : ""}
        <td>${escapeHtml(job.install_date || "-")}</td>
        <td>${escapeHtml(job.delivery_date || "-")}</td>
        <td>${escapeHtml(job.cr_close_date || "-")}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;min-width:60px;height:6px;background:var(--hairline-strong);border-radius:999px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${
        pct === 100 ? "var(--ok)" : "var(--accent)"
      }"></div>
            </div>
            <span class="muted" style="font-size:12px">${done}/${total}</span>
          </div>
        </td>
        <td>${statusBadge(job.status, job.overdue)}</td>
      </tr>
    `;
    })
    .join("");

  const emptyRow = `<tr><td colspan="${
    senior ? 10 : 9
  }" class="muted">ยังไม่มีงาน — กด "สร้างงาน" เพื่อเริ่ม</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planner - บอร์ดงาน</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "planner-board")}
    <main class="container wide-container" id="app" data-ajax>
    <section class="hero">
      <h1>บอร์ดงาน</h1>
      <p>${
        senior
          ? "คุณเห็นงานของทุกคน กรองดูเป็นรายคนได้"
          : "งานทั้งหมดของคุณ ติดตามความคืบหน้าได้จากที่นี่"
      }</p>
    </section>

    ${success === "deleted" ? `<div class="alert success">ลบงานสำเร็จ</div>` : ""}

    <section class="panel">
      <div class="panel-title-row">
        <form action="/planner" method="GET" class="action-row" style="flex-wrap:wrap;gap:10px">
          <input name="q" type="text" class="filter-input" placeholder="ค้นหา CID / ลูกค้า / SOF" value="${escapeHtml(
            filters.q || ""
          )}">
          <select name="category_id" class="filter-input">
            <option value="">ทุกหมวด</option>
            ${categoryOptions}
          </select>
          <select name="status" class="filter-input">
            ${statusOptions}
          </select>
          ${
            senior
              ? `<select name="owner_id" class="filter-input">
                   <option value="">ทุกคน</option>${ownerOptions}
                 </select>`
              : ""
          }
          <button class="small-btn" type="submit">กรอง</button>
          <a class="secondary-link-btn" href="/planner">ล้าง</a>
        </form>

        <a class="primary-link-btn" href="/planner/jobs/new">+ สร้างงาน</a>
      </div>

      <table>
        <thead>
          <tr>
            <th>CID</th>
            <th>ลูกค้า</th>
            <th>SOF</th>
            <th>ชนิด</th>
            ${senior ? "<th>ผู้รับผิดชอบ</th>" : ""}
            <th>ติดตั้ง</th>
            <th>ส่งมอบ</th>
            <th>ปิด CR</th>
            <th>คืบหน้า</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          ${rows || emptyRow}
        </tbody>
      </table>
    </section>
    </main>
  </div>
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function statusBadge(status, overdue) {
  const map = {
    todo: `<span class="badge badge-todo">ยังไม่เริ่ม</span>`,
    in_progress: `<span class="badge badge-progress">กำลังทำ</span>`,
    done: `<span class="badge badge-done">เสร็จ</span>`,
  };
  const base = map[status] || map.todo;
  const flag = overdue
    ? ` <span class="badge badge-overdue">เลยกำหนด</span>`
    : "";
  return base + flag;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}