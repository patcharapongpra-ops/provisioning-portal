import { mainStyle } from "../styles/main.js";

export function loginPage(error) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body class="login-body">
  <div class="login-card">
    <h1>Provisioning Portal</h1>
    <p>เข้าสู่ระบบเพื่อใช้งานพอร์ทัลของแผนก</p>

    ${showError(error)}

    <form action="/api/login" method="POST" class="login-form">
      <input name="username" type="text" placeholder="Username" required>
      <input name="password" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>
`;
}

function showError(error) {
  if (error === "missing") {
    return `<div class="alert error">กรุณากรอก Username และ Password</div>`;
  }

  if (error === "invalid") {
    return `<div class="alert error">Username หรือ Password ไม่ถูกต้อง</div>`;
  }

  return "";
}
