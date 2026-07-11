import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function adminHolidaysPage({ user, holidays, error, success }) {
  const rows = (holidays || [])
    .map(
      (h) => `
      <tr>
        <td>${escapeHtml(h.holiday_date)}</td>
        <td>${escapeHtml(h.name)}</td>
        <td>
          <form action="/admin/holidays/delete" method="POST" class="inline-form" onsubmit="return confirm('ลบวันหยุด ${escapeHtml(h.name)}?')">
            <input type="hidden" name="holiday_id" value="${h.id}">
            <button class="danger-btn" type="submit">ลบ</button>
          </form>
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>วันหยุดออฟฟิศ - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "admin-holidays")}
    <main class="container">
    <section class="hero">
      <h1>วันหยุดออฟฟิศ</h1>
      <p>วันหยุดที่ใส่ไว้จะแสดงในปฏิทินของทุกคนโดยอัตโนมัติ</p>
    </section>

    ${showMessage(error, success)}

    <section class="panel">
      <h2>เพิ่มวันหยุด</h2>
      <form action="/admin/holidays/create" method="POST" class="action-row">
        <input name="holiday_date" type="date" class="filter-input" required>
        <input name="name" type="text" class="filter-input" placeholder="ชื่อวันหยุด เช่น วันสงกรานต์" required maxlength="120" style="flex:1;min-width:200px">
        <button class="primary-btn" type="submit">+ เพิ่ม</button>
      </form>
    </section>

    <section class="panel">
      <h2>รายการวันหยุด</h2>
      <table>
        <thead>
          <tr>
            <th>วันที่</th>
            <th>ชื่อวันหยุด</th>
            <th style="width:90px">Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="3" class="muted">ยังไม่มีวันหยุดในระบบ</td></tr>`}
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
  if (success === "created") return `<div class="alert success">เพิ่มวันหยุดแล้ว</div>`;
  if (success === "deleted") return `<div class="alert success">ลบวันหยุดแล้ว</div>`;
  if (error === "missing") return `<div class="alert error">กรุณากรอกวันที่และชื่อวันหยุดให้ถูกต้อง</div>`;
  if (error === "exists") return `<div class="alert error">มีวันหยุดชื่อนี้ในวันเดียวกันอยู่แล้ว</div>`;
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
