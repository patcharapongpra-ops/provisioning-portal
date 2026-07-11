import { mainStyle } from "../styles/main.js";
import { themeInitScript } from "../layout.js";

export function registerPage(error) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สมัครสมาชิก - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body class="login-body">
  <div class="login-card">
    <h1>สมัครสมาชิก</h1>
    <p>สร้างบัญชีใหม่ — ใช้งานได้หลังผู้ดูแลระบบอนุมัติ</p>

    ${showError(error)}

    <form action="/api/register" method="POST" class="login-form">
      <input name="full_name" type="text" placeholder="ชื่อ-นามสกุล" required>
      <input name="username" type="text" placeholder="Username" required minlength="3" autocomplete="username">
      <input name="password" type="password" placeholder="Password (อย่างน้อย 8 ตัวอักษร)" required minlength="8" autocomplete="new-password">
      <input name="password_confirm" type="password" placeholder="ยืนยัน Password" required minlength="8" autocomplete="new-password">
      <button type="submit">สมัครสมาชิก</button>
    </form>

    <p style="margin:18px 0 0;font-size:13.5px">
      มีบัญชีอยู่แล้ว? <a href="/login" style="color:var(--accent);font-weight:600">เข้าสู่ระบบ</a>
    </p>
  </div>
</body>
</html>
`;
}

function showError(error) {
  if (error === "missing") {
    return `<div class="alert error">กรุณากรอกข้อมูลให้ครบทุกช่อง</div>`;
  }

  if (error === "password_short") {
    return `<div class="alert error">Password ต้องยาวอย่างน้อย 8 ตัวอักษร</div>`;
  }

  if (error === "password_mismatch") {
    return `<div class="alert error">Password ทั้งสองช่องไม่ตรงกัน</div>`;
  }

  if (error === "username") {
    return `<div class="alert error">Username ใช้ได้เฉพาะ a-z, 0-9, จุด (.), ขีด (-, _) ยาว 3-32 ตัว</div>`;
  }

  if (error === "exists") {
    return `<div class="alert error">Username นี้ถูกใช้แล้ว กรุณาเลือกใหม่</div>`;
  }

  return "";
}
