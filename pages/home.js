import { mainStyle } from "../styles/main.js";

export function homePage(user) {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>Provisioning Portal</h2>
      <p>Welcome, ${escapeHtml(user.full_name)} (${escapeHtml(user.role)})</p>
    </div>

    <nav class="nav">
      <a href="/home">Home</a>
      <a href="/config">Config Generator</a>
      ${user.role === "admin" ? `<a href="/admin">Admin</a>` : ""}
      <a href="/logout">Logout</a>
    </nav>
  </header>

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