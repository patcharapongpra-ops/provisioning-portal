import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function homePage(user) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "home")}
    <main class="container">
    <section class="hero">
      <h1>Home</h1>
      <p>ศูนย์รวมเครื่องมือ เอกสาร คู่มือ และระบบ Generate Config ของแผนก</p>
    </section>

    <section class="grid">
      <a class="card" href="/config">
        <h3>Config Generator</h3>
        <p>สร้าง Config จาก Template ที่ Admin กำหนดไว้</p>
      </a>

      <a class="card" href="/planner">
        <h3>Planner</h3>
        <p>วางแผนงาน ติดตามขั้นตอน และดูปฏิทินงานของคุณ</p>
      </a>

      <a class="card" href="/car">
        <h3>จองรถแผนก</h3>
        <p>จองรถ ดูคิว รับ-คืนรถ พร้อมบันทึกไมล์และชั้นจอด</p>
      </a>

      <div class="card">
        <h3>SOP / คู่มือ</h3>
        <p>รวมขั้นตอนการทำงานและคู่มือภายใน</p>
      </div>

      <div class="card">
        <h3>Documents</h3>
        <p>เอกสาร แบบฟอร์ม และไฟล์ดาวน์โหลด</p>
      </div>

      ${
        user.role === "admin" || user.role === "staff"
          ? `
      <div class="card">
        <h3>Staff Area</h3>
        <p>เมนูเฉพาะ admin และ staff</p>
      </div>
      `
          : ""
      }
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