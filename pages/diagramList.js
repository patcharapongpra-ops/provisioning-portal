import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function diagramListPage({ user, diagrams, error, success }) {
  const senior = user.role === "staff" || user.role === "admin";

  const rows = (diagrams || [])
    .map((d) => {
      const canEdit = d.owner_id === user.id || senior;
      return `
      <tr>
        <td data-label="ชื่อ"><a href="/diagrams/edit?id=${d.id}" style="color:var(--accent);font-weight:600;text-decoration:none">${escapeHtml(d.title)}</a></td>
        <td data-label="CID">${escapeHtml(d.cid || "-")}</td>
        <td data-label="เจ้าของ">${escapeHtml(d.owner_name)}${d.owner_id === user.id ? ` <span class="muted">(คุณ)</span>` : ""}</td>
        <td data-label="อัปเดต">${escapeHtml(String(d.updated_at || "").slice(0, 16))}</td>
        <td class="${canEdit ? "row-actions" : "row-actions"}">
          <div class="action-row">
            <a class="small-link-btn" href="/diagrams/edit?id=${d.id}">เปิด</a>
            <form action="/diagrams/clone" method="POST" class="inline-form">
              <input type="hidden" name="diagram_id" value="${d.id}">
              <button class="small-btn" type="submit">Clone</button>
            </form>
            ${
              canEdit
                ? `<form action="/diagrams/delete" method="POST" class="inline-form" onsubmit="return confirm('ลบ diagram นี้?')">
                     <input type="hidden" name="diagram_id" value="${d.id}">
                     <button class="danger-btn" type="submit">ลบ</button>
                   </form>`
                : ""
            }
          </div>
        </td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagram - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "diagrams")}
    <main class="container">
    <section class="hero">
      <div class="panel-title-row">
        <div>
          <h1>Network Diagram</h1>
          <p>วาด diagram วงจรลูกค้า บันทึกแก้ต่อได้ ดาวน์โหลด PNG/SVG ไปแปะเอกสาร</p>
        </div>
        <a class="primary-link-btn" href="/diagrams/new">+ สร้าง Diagram</a>
      </div>
    </section>

    ${showMessage(error, success)}

    <section class="panel">
      <h2>Diagram ทั้งหมดของทีม</h2>
      <table class="stack-table">
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>CID</th>
            <th>เจ้าของ</th>
            <th>อัปเดตล่าสุด</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" class="muted">ยังไม่มี diagram — กด "สร้าง Diagram" เพื่อเริ่ม</td></tr>`}
        </tbody>
      </table>
    </section>
    </main>
  </div>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success === "deleted") return `<div class="alert success">ลบ diagram แล้ว</div>`;
  if (error === "notfound") return `<div class="alert error">ไม่พบ diagram ที่ต้องการ</div>`;
  if (error === "denied") return `<div class="alert error">คุณไม่มีสิทธิ์แก้ไข diagram นี้ — ใช้ Clone เพื่อทำสำเนาของคุณเอง</div>`;
  if (error === "data") return `<div class="alert error">ข้อมูล diagram ไม่ถูกต้องหรือใหญ่เกินไป</div>`;
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
