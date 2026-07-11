import { mainStyle } from "../styles/main.js";

export function adminTemplatesPage({ user, templates, error, success }) {
  const rows = (templates || [])
    .map((template) => {
      const nextStatus = template.is_active ? 0 : 1;
      const buttonText = template.is_active ? "Disable" : "Enable";
      const statusText = template.is_active ? "Active" : "Disabled";
      const statusClass = template.is_active ? "badge" : "badge badge-gray";

      return `
      <tr>
        <td>${template.id}</td>
        <td>${escapeHtml(template.device_type_name || "General")}</td>
        <td>${escapeHtml(template.name)}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>${escapeHtml(template.updated_at || template.created_at || "")}</td>
        <td>
          <div class="action-row">
            <a class="small-link-btn" href="/admin/templates/edit?id=${template.id}">Edit</a>

            <form action="/admin/templates/clone" method="POST" class="inline-form">
              <input type="hidden" name="template_id" value="${template.id}">
              <button class="small-btn" type="submit">Clone</button>
            </form>

            <form action="/admin/templates/toggle" method="POST" class="inline-form">
              <input type="hidden" name="template_id" value="${template.id}">
              <input type="hidden" name="next_status" value="${nextStatus}">
              <button class="small-btn" type="submit">${buttonText}</button>
            </form>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Manager - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>Template Manager</h2>
      <p>Admin: ${escapeHtml(user.full_name)}</p>
    </div>

    <nav class="nav">
      <a href="/home">Home</a>
      <a href="/admin">Admin</a>
      <a href="/config">Config Generator</a>
      <a href="/logout">Logout</a>
    </nav>
  </header>

  <main class="container">
    <section class="hero">
      <h1>Config Templates</h1>
      <p>จัดการ Template สำหรับ Generate Config</p>
    </section>

    ${showMessage(error, success)}

    <section class="panel">
      <div class="panel-title-row">
        <div>
          <h2>Template List</h2>
          <p class="muted">ดูรายการ Template เดิม แก้ไข Clone หรือเปิด/ปิดการใช้งานได้จากหน้านี้</p>
        </div>

        <a class="primary-link-btn" href="/admin/templates/create">Create New Template</a>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Device Type</th>
            <th>Template Name</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `
            <tr>
              <td colspan="6">ยังไม่มี Template ในระบบ</td>
            </tr>
            `
          }
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success === "created") {
    return `<div class="alert success">สร้าง Template สำเร็จ</div>`;
  }

  if (success === "updated") {
    return `<div class="alert success">อัปเดต Template สำเร็จ</div>`;
  }

  if (error === "missing") {
    return `<div class="alert error">กรุณากรอกข้อมูลให้ครบ</div>`;
  }

  if (error === "fields") {
    return `<div class="alert error">Field ไม่ถูกต้อง</div>`;
  }

  if (error === "toggle") {
    return `<div class="alert error">ไม่สามารถเปลี่ยนสถานะ Template ได้</div>`;
  }

  if (error === "notfound") {
    return `<div class="alert error">ไม่พบ Template ที่ต้องการ</div>`;
  }

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