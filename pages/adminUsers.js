import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function adminUsersPage(user, users, error, success, resetInfo) {
  const rows = users
    .map((item) => {
      const nextStatus = item.is_active ? 0 : 1;
      const buttonText = item.is_active ? "Disable" : "Enable";
      const statusText = item.is_active ? "Active" : "Disabled";

      return `
      <tr>
        <td>${item.id}</td>
        <td>${escapeHtml(item.username)}</td>
        <td>${escapeHtml(item.full_name)}</td>
        <td><span class="badge">${escapeHtml(item.role)}</span></td>
        <td>${statusText}</td>
        <td>${escapeHtml(item.created_at || "")}</td>
        <td>
          <div class="action-row">
            <form action="/admin/users/toggle" method="POST" class="inline-form">
              <input type="hidden" name="user_id" value="${item.id}">
              <input type="hidden" name="next_status" value="${nextStatus}">
              <button class="small-btn" type="submit">${buttonText}</button>
            </form>

            <form action="/admin/users/reset-password" method="POST" class="inline-form" onsubmit="return confirm('ออกรหัสชั่วคราวให้ ${escapeHtml(item.username)}? รหัสเดิมจะใช้ไม่ได้ และผู้ใช้นี้จะถูกตัดออกจากระบบทันที')">
              <input type="hidden" name="user_id" value="${item.id}">
              <button class="small-btn" type="submit">Reset รหัส</button>
            </form>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  const resetNotice = resetInfo
    ? `<div class="alert success">
         รหัสชั่วคราวของ <strong>${escapeHtml(resetInfo.username)}</strong>:
         <code style="font-family:var(--font-mono);font-size:15px;background:var(--surface-2);border:1px solid var(--hairline-strong);padding:3px 10px;border-radius:6px;user-select:all">${escapeHtml(resetInfo.tempPassword)}</code>
         — แสดงครั้งเดียว จดแล้วส่งให้ผู้ใช้ทางช่องทางส่วนตัว เมื่อผู้ใช้ login ระบบจะบังคับตั้งรหัสใหม่
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manage Users - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "admin-users")}
    <main class="container">
    <section class="hero">
      <h1>Users</h1>
      <p>จัดการผู้ใช้งานในระบบ</p>
    </section>

    ${resetNotice}
    ${showMessage(error, success)}

    <section class="panel">
      <h2>Add User</h2>

      <form action="/admin/users/create" method="POST" class="admin-form">
        <div class="form-row">
          <label>
            Full name
            <input name="full_name" type="text" placeholder="Full name" required>
          </label>

          <label>
            Username
            <input name="username" type="text" placeholder="Username" required>
          </label>
        </div>

        <div class="form-row">
          <label>
            Password
            <input name="password" type="password" placeholder="Password" required>
          </label>

          <label>
            Role
            <select name="role" required>
              <option value="user">user</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>

        <button type="submit" class="primary-btn">Create User</button>
      </form>
    </section>

    <section class="panel">
      <h2>User List</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Full name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created at</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
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
  if (success === "created") {
    return `<div class="alert success">สร้าง user สำเร็จ</div>`;
  }

  if (success === "updated") {
    return `<div class="alert success">อัปเดตสถานะ user สำเร็จ</div>`;
  }

  if (error === "missing") {
    return `<div class="alert error">กรุณากรอกข้อมูลให้ครบ</div>`;
  }

  if (error === "exists") {
    return `<div class="alert error">Username นี้มีอยู่แล้ว</div>`;
  }

  if (error === "role") {
    return `<div class="alert error">Role ไม่ถูกต้อง</div>`;
  }

  if (error === "toggle") {
    return `<div class="alert error">ไม่สามารถเปลี่ยนสถานะ user ได้</div>`;
  }

  if (error === "reset") {
    return `<div class="alert error">ไม่สามารถรีเซ็ตรหัสผ่านได้ ไม่พบผู้ใช้ที่ต้องการ</div>`;
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