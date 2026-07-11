import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";

export function plannerJobFormPage({ user, typeGroups, error }) {
  const hasTypes = (typeGroups || []).some((g) => g.types.length > 0);

  const typeOptions = (typeGroups || [])
    .map((group) => {
      if (!group.types.length) return "";
      const opts = group.types
        .map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
        .join("");
      return `<optgroup label="${escapeHtml(group.name)}">${opts}</optgroup>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สร้างงาน - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>สร้างงาน</h2>
      <p>${escapeHtml(user.full_name)}</p>
    </div>

    <nav class="nav">
      <a href="/planner">Planner</a>
      <a href="/planner/types">คลังชนิดงาน</a>
      <a href="/logout">Logout</a>
    </nav>
  </header>

  <main class="container" id="app" data-ajax>
    <section class="hero">
      <h1>สร้างงานใหม่</h1>
      <p>เลือกชนิดงาน กรอกข้อมูลและวันสำคัญ — ขั้นตอนจะถูกดึงมาจากคลังของคุณเป็น checklist อัตโนมัติ</p>
    </section>

    ${showError(error)}

    ${
      hasTypes
        ? `
    <form action="/planner/jobs/create" method="POST" class="admin-form">
      <section class="panel">
        <h2>ข้อมูลงาน</h2>

        <div class="form-row">
          <label>
            ชนิดงาน
            <select name="job_type_id" required>
              <option value="">-- เลือกชนิดงาน --</option>
              ${typeOptions}
            </select>
          </label>

          <label>
            CID
            <input name="cid" type="text" placeholder="เช่น C1434" required>
          </label>
        </div>

        <div class="form-row">
          <label>
            ชื่อลูกค้า
            <input name="customer_name" type="text" placeholder="เช่น Hanwa Fellows Engineering" required>
          </label>

          <label>
            SOF
            <input name="sof" type="text" placeholder="เช่น SOF-2207">
          </label>
        </div>
      </section>

      <section class="panel">
        <h2>วันสำคัญ</h2>
        <div class="form-row">
          <label>
            วันติดตั้ง
            <input name="install_date" type="date">
          </label>
          <label>
            วันส่งมอบ
            <input name="delivery_date" type="date">
          </label>
        </div>
        <div class="form-row">
          <label>
            วันปิด CR
            <input name="cr_close_date" type="date">
          </label>
          <label>
            โน้ต
            <input name="note" type="text" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)">
          </label>
        </div>
      </section>

      <section class="panel">
        <button type="submit" class="primary-btn">สร้างงาน</button>
        <a class="secondary-link-btn" href="/planner">ยกเลิก</a>
      </section>
    </form>
    `
        : `
    <section class="panel">
      <div class="help-box">
        <strong>ยังไม่มีชนิดงานที่ใช้ได้</strong>
        <p>ไปสร้างชนิดงาน + ขั้นตอนในคลังของคุณก่อน แล้วค่อยกลับมาสร้างงาน</p>
        <p><a class="primary-link-btn" href="/planner/types">ไปที่คลังชนิดงาน</a></p>
      </div>
    </section>
    `
    }
  </main>
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function showError(error) {
  if (error === "missing") return `<div class="alert error">กรุณากรอกชนิดงาน, CID และชื่อลูกค้า</div>`;
  if (error === "type") return `<div class="alert error">ชนิดงานไม่ถูกต้องหรือถูกปิดใช้งาน</div>`;
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