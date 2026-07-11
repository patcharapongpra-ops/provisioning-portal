import { mainStyle } from "../styles/main.js";
import { themeInitScript } from "../layout.js";

export function loginPage(error, success) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body class="login-body">
  <div class="login-card">
    <h1>Provisioning Portal</h1>
    <p>เข้าสู่ระบบเพื่อใช้งานพอร์ทัลของแผนก</p>

    ${showMessage(error, success)}

    <form action="/api/login" method="POST" class="login-form">
      <input name="username" type="text" placeholder="Username" required autocomplete="username">
      <input name="password" type="password" placeholder="Password" required autocomplete="current-password">
      <button type="submit">Login</button>
    </form>

    <p style="margin:18px 0 0;font-size:13.5px">
      ยังไม่มีบัญชี? <a href="/register" style="color:var(--accent);font-weight:600">สมัครสมาชิก</a>
      &nbsp;·&nbsp; <a href="/forgot" style="color:var(--ink-3)">ลืมรหัสผ่าน?</a>
    </p>
  </div>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success === "registered") {
    return `<div class="alert success">สมัครสำเร็จ — รอผู้ดูแลระบบอนุมัติ แล้วจึงเข้าสู่ระบบได้</div>`;
  }

  if (error === "missing") {
    return `<div class="alert error">กรุณากรอก Username และ Password</div>`;
  }

  if (error === "pending") {
    return `<div class="alert error">บัญชีของคุณยังไม่ถูกอนุมัติ กรุณาติดต่อผู้ดูแลระบบ</div>`;
  }

  if (error === "invalid") {
    return `<div class="alert error">Username หรือ Password ไม่ถูกต้อง</div>`;
  }

  return "";
}
