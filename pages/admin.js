import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function adminPage(user) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "admin-overview")}
    <main class="container">
    <section class="hero">
      <h1>Admin Dashboard</h1>
      <p>จัดการผู้ใช้งานและ Config Template</p>
    </section>

    <section class="grid">
      <a class="card" href="/admin/users">
        <h3>Manage Users</h3>
        <p>เพิ่ม user, เปลี่ยน role, เปิด/ปิด user</p>
      </a>

      <a class="card" href="/admin/templates">
        <h3>Manage Templates</h3>
        <p>สร้าง Template และกำหนด Field สำหรับ Generate Config</p>
      </a>

      <a class="card" href="/config">
        <h3>Config Generator</h3>
        <p>ทดสอบ Generate Config จาก Template</p>
      </a>

      <a class="card" href="/home">
        <h3>Portal Home</h3>
        <p>กลับไปหน้าหลักของพอร์ทัล</p>
      </a>
    </section>
    </main>
  </div>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}