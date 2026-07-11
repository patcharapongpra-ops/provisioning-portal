import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function accountPasswordPage({ user, error, success, required }) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>เปลี่ยนรหัสผ่าน - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "account-password")}
    <main class="container">
    <section class="hero">
      <h1>เปลี่ยนรหัสผ่าน</h1>
      <p>ตั้งรหัสผ่านใหม่สำหรับบัญชี ${escapeHtml(user.username)}</p>
    </section>

    ${
      required
        ? `<div class="alert error">คุณกำลังใช้รหัสผ่านชั่วคราวจากผู้ดูแลระบบ กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งาน</div>`
        : ""
    }
    ${showMessage(error, success)}

    <section class="panel" style="max-width:480px">
      <form action="/account/password/update" method="POST" class="admin-form">
        <label>
          รหัสผ่านปัจจุบัน${required ? " (รหัสชั่วคราวที่ได้รับ)" : ""}
          <input name="current_password" type="password" required autocomplete="current-password">
        </label>
        <label>
          รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
          <input name="new_password" type="password" required minlength="8" autocomplete="new-password">
        </label>
        <label>
          ยืนยันรหัสผ่านใหม่
          <input name="new_password_confirm" type="password" required minlength="8" autocomplete="new-password">
        </label>
        <button type="submit" class="primary-btn">บันทึกรหัสผ่านใหม่</button>
      </form>
    </section>
    </main>
  </div>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success) {
    return `<div class="alert success">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</div>`;
  }

  if (error === "missing") {
    return `<div class="alert error">กรุณากรอกข้อมูลให้ครบทุกช่อง</div>`;
  }

  if (error === "current") {
    return `<div class="alert error">รหัสผ่านปัจจุบันไม่ถูกต้อง</div>`;
  }

  if (error === "password_short") {
    return `<div class="alert error">รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร</div>`;
  }

  if (error === "password_mismatch") {
    return `<div class="alert error">รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน</div>`;
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
