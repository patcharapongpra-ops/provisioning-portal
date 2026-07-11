import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";

export function plannerTypesPage({ user, categories, types, error, success }) {
  // group types by category (คงลำดับหมวดกลาง)
  const grouped = (categories || []).map((category) => {
    const items = (types || []).filter(
      (t) => Number(t.category_id) === Number(category.id)
    );
    return { category, items };
  });

  const sections = grouped
    .map(({ category, items }) => {
      const rows = items
        .map((type) => {
          const nextStatus = type.is_active ? 0 : 1;
          const buttonText = type.is_active ? "Disable" : "Enable";
          const statusText = type.is_active ? "Active" : "Disabled";
          const statusClass = type.is_active ? "badge" : "badge badge-gray";

          return `
          <tr>
            <td>${escapeHtml(type.name)}</td>
            <td>${type.step_count || 0} ขั้นตอน</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${escapeHtml(type.updated_at || "")}</td>
            <td>
              <div class="action-row">
                <a class="small-link-btn" href="/planner/types/edit?id=${type.id}">Edit</a>

                <form action="/planner/types/clone" method="POST" class="inline-form">
                  <input type="hidden" name="type_id" value="${type.id}">
                  <button class="small-btn" type="submit">Clone</button>
                </form>

                <form action="/planner/types/toggle" method="POST" class="inline-form">
                  <input type="hidden" name="type_id" value="${type.id}">
                  <input type="hidden" name="next_status" value="${nextStatus}">
                  <button class="small-btn" type="submit">${buttonText}</button>
                </form>

                <form action="/planner/types/delete" method="POST" class="inline-form" onsubmit="return confirm('ลบชนิดงานนี้? (ถ้ามีงานผูกอยู่จะลบไม่ได้)')">
                  <input type="hidden" name="type_id" value="${type.id}">
                  <button class="danger-btn" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
        `;
        })
        .join("");

      const body =
        rows ||
        `<tr><td colspan="5" class="muted">ยังไม่มีชนิดงานในหมวดนี้ กด "New Type" เพื่อสร้าง</td></tr>`;

      return `
      <section class="panel">
        <div class="panel-title-row">
          <div>
            <h2>${escapeHtml(category.name)}</h2>
            <p class="muted">ชนิดงานในหมวดนี้ (คลังของคุณเอง)</p>
          </div>
          <a class="primary-link-btn" href="/planner/types/create?category_id=${category.id}">New Type</a>
        </div>

        <table>
          <thead>
            <tr>
              <th>ชนิดงาน</th>
              <th>ขั้นตอน</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </section>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>คลังชนิดงาน - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>คลังชนิดงาน</h2>
      <p>${escapeHtml(user.full_name)}</p>
    </div>

    <nav class="nav">
      <a href="/home">Home</a>
      <a href="/planner">Planner</a>
      <a href="/planner/calendar">ปฏิทิน</a>
      <a href="/planner/dashboard">Dashboard</a>
      <a href="/logout">Logout</a>
    </nav>
  </header>

  <main class="container" id="app" data-ajax>
    <section class="hero">
      <h1>คลังชนิดงาน + ขั้นตอน</h1>
      <p>ชนิดงานและขั้นตอนเหล่านี้เป็นของคุณคนเดียว ปรับแต่งได้อิสระ — เวลาสร้างงานจะดึงขั้นตอนจากที่นี่ไปเป็น checklist</p>
    </section>

    ${showMessage(error, success)}

    ${sections}
  </main>
  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success === "created") return `<div class="alert success">สร้างชนิดงานสำเร็จ</div>`;
  if (success === "updated") return `<div class="alert success">อัปเดตชนิดงานสำเร็จ</div>`;
  if (success === "deleted") return `<div class="alert success">ลบชนิดงานสำเร็จ</div>`;
  if (error === "missing") return `<div class="alert error">กรุณากรอกข้อมูลให้ครบ</div>`;
  if (error === "steps") return `<div class="alert error">ต้องมีอย่างน้อย 1 ขั้นตอน</div>`;
  if (error === "category") return `<div class="alert error">หมวดงานไม่ถูกต้อง</div>`;
  if (error === "notfound") return `<div class="alert error">ไม่พบชนิดงานที่ต้องการ</div>`;
  if (error === "inuse")
    return `<div class="alert error">ลบไม่ได้ เพราะมีงานใช้ชนิดนี้อยู่ — ให้กด Disable แทน</div>`;
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