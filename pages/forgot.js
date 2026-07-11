import { mainStyle } from "../styles/main.js";
import { themeInitScript } from "../layout.js";

export function forgotPage() {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ลืมรหัสผ่าน - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body class="login-body">
  <div class="login-card">
    <h1>ลืมรหัสผ่าน</h1>
    <p>ระบบนี้ไม่ใช้อีเมล การรีเซ็ตทำผ่านผู้ดูแลระบบ</p>

    <div class="help-box" style="text-align:left">
      <strong>ขั้นตอนการขอรหัสใหม่</strong>
      <p>1. ติดต่อผู้ดูแลระบบ (admin) แจ้ง username ของคุณ</p>
      <p>2. Admin จะออก "รหัสชั่วคราว" ให้ทางช่องทางส่วนตัว</p>
      <p>3. เข้าสู่ระบบด้วยรหัสชั่วคราว — ระบบจะให้ตั้งรหัสใหม่ทันที</p>
    </div>

    <p style="margin:22px 0 0;font-size:13.5px">
      <a href="/login" style="color:var(--accent);font-weight:600">← กลับไปหน้าเข้าสู่ระบบ</a>
    </p>
  </div>
</body>
</html>
`;
}
