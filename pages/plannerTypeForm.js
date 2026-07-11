import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";

export function plannerTypeFormPage({ user, mode, type, categories, steps, error, presetCategoryId }) {
  const isEdit = mode === "edit";
  const pageTitle = isEdit ? "แก้ไขชนิดงาน" : "สร้างชนิดงาน";
  const formAction = isEdit ? "/planner/types/update" : "/planner/types/store";

  const typeId = type?.id || "";
  const typeName = type?.name || "";
  const selectedCategoryId = Number(
    type?.category_id || presetCategoryId || (categories[0] && categories[0].id) || 0
  );
  const isActive = type?.is_active === 0 ? "0" : "1";

  const categoryOptions = (categories || [])
    .map(
      (c) =>
        `<option value="${c.id}" ${
          Number(c.id) === selectedCategoryId ? "selected" : ""
        }>${escapeHtml(c.name)}</option>`
    )
    .join("");

  const initialSteps =
    steps && steps.length
      ? steps.map((s) => ({ name: s.name }))
      : [{ name: "" }];

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>${pageTitle}</h2>
      <p>${escapeHtml(user.full_name)}</p>
    </div>

    <nav class="nav">
      <a href="/planner/types">คลังชนิดงาน</a>
      <a href="/planner">Planner</a>
      <a href="/logout">Logout</a>
    </nav>
  </header>

  <main class="container" id="app">
    <section class="hero">
      <h1>${pageTitle}</h1>
      <p>เลือกหมวด ตั้งชื่อชนิดงาน แล้วกำหนดขั้นตอน (checklist) ที่จะถูก copy ไปทุกครั้งที่สร้างงานชนิดนี้</p>
    </section>

    ${error ? `<div class="alert error">${escapeHtml(error)}</div>` : ""}

    <form action="${formAction}" method="POST" class="admin-form" onsubmit="return prepareStepsJson()">
      ${isEdit ? `<input type="hidden" name="type_id" value="${typeId}">` : ""}
      <input type="hidden" id="steps-json" name="steps_json" value="">

      <section class="panel">
        <h2>ข้อมูลชนิดงาน</h2>

        <div class="form-row">
          <label>
            หมวดงาน
            <select name="category_id" required>
              ${categoryOptions}
            </select>
          </label>

          <label>
            ชื่อชนิดงาน
            <input name="name" type="text" placeholder="เช่น DIA, Relocate, Terminate-DIA" value="${escapeHtml(typeName)}" required>
          </label>
        </div>

        <label>
          Status
          <select name="is_active">
            <option value="1" ${isActive === "1" ? "selected" : ""}>Active</option>
            <option value="0" ${isActive === "0" ? "selected" : ""}>Disabled</option>
          </select>
        </label>
      </section>

      <section class="panel">
        <div class="panel-title-row">
          <div>
            <h2>ขั้นตอน (Checklist)</h2>
            <p class="muted">ลากเรียงลำดับ / clone / ลบ ได้ตามใจ</p>
          </div>
          <button type="button" class="small-btn" onclick="addStepRow()">+ เพิ่มขั้นตอน</button>
        </div>

        <div class="field-builder-wrap">
          <table class="field-builder-table" style="min-width:640px">
            <thead>
              <tr>
                <th style="width:40px"></th>
                <th style="width:56px">ลำดับ</th>
                <th>ชื่อขั้นตอน</th>
                <th style="width:120px">Move</th>
                <th style="width:150px">Action</th>
              </tr>
            </thead>
            <tbody id="steps-body"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <button type="submit" class="primary-btn">${isEdit ? "บันทึกการแก้ไข" : "สร้างชนิดงาน"}</button>
        <a class="secondary-link-btn" href="/planner/types">ยกเลิก</a>
      </section>
    </form>
  </main>

  <script>
    const initialSteps = ${JSON.stringify(initialSteps)};

    function escapeAttr(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function stepRowTemplate(step = {}) {
      const name = step.name || "";
      return \`
        <tr class="field-row" draggable="true">
          <td class="center-cell">
            <span class="drag-handle" title="ลากเพื่อจัดลำดับ">⠿</span>
          </td>
          <td class="center-cell step-index">-</td>
          <td>
            <input class="fb-step-name" type="text" value="\${escapeAttr(name)}" placeholder="เช่น รับใบงาน / ตรวจสอบข้อมูล">
          </td>
          <td>
            <div class="move-btns">
              <button type="button" class="mini-btn" onclick="moveStepRow(this, -1)">↑</button>
              <button type="button" class="mini-btn" onclick="moveStepRow(this, 1)">↓</button>
            </div>
          </td>
          <td>
            <div class="action-row">
              <button type="button" class="small-btn" onclick="cloneStepRow(this)">Clone</button>
              <button type="button" class="danger-btn" onclick="removeStepRow(this)">Remove</button>
            </div>
          </td>
        </tr>
      \`;
    }

    function renumber() {
      [...document.querySelectorAll("#steps-body .field-row")].forEach((row, i) => {
        const cell = row.querySelector(".step-index");
        if (cell) cell.textContent = i + 1;
      });
    }

    function renderInitialSteps() {
      const body = document.getElementById("steps-body");
      body.innerHTML = "";
      initialSteps.forEach((step) => {
        body.insertAdjacentHTML("beforeend", stepRowTemplate(step));
      });
      renumber();
    }

    function addStepRow(step = {}) {
      document.getElementById("steps-body").insertAdjacentHTML("beforeend", stepRowTemplate(step));
      renumber();
    }

    function cloneStepRow(button) {
      const row = button.closest("tr");
      const name = row.querySelector(".fb-step-name").value;
      row.insertAdjacentHTML("afterend", stepRowTemplate({ name }));
      renumber();
    }

    function removeStepRow(button) {
      button.closest("tr").remove();
      renumber();
    }

    function moveStepRow(button, direction) {
      const row = button.closest("tr");
      const body = document.getElementById("steps-body");
      if (direction < 0 && row.previousElementSibling) {
        body.insertBefore(row, row.previousElementSibling);
      }
      if (direction > 0 && row.nextElementSibling) {
        body.insertBefore(row.nextElementSibling, row);
      }
      renumber();
    }

    // drag & drop reorder
    let dragEl = null;
    document.getElementById("steps-body").addEventListener("dragstart", (e) => {
      const row = e.target.closest(".field-row");
      if (!row) return;
      dragEl = row;
      row.classList.add("dragging");
    });
    document.getElementById("steps-body").addEventListener("dragend", () => {
      if (dragEl) dragEl.classList.remove("dragging");
      dragEl = null;
      renumber();
    });
    document.getElementById("steps-body").addEventListener("dragover", (e) => {
      e.preventDefault();
      const body = document.getElementById("steps-body");
      const after = [...body.querySelectorAll(".field-row:not(.dragging)")].find((row) => {
        const box = row.getBoundingClientRect();
        return e.clientY < box.top + box.height / 2;
      });
      if (!dragEl) return;
      if (after) body.insertBefore(dragEl, after);
      else body.appendChild(dragEl);
    });

    function prepareStepsJson() {
      const names = [...document.querySelectorAll(".fb-step-name")]
        .map((input) => input.value.trim())
        .filter((name) => name.length > 0);

      if (!names.length) {
        alert("กรุณาเพิ่มอย่างน้อย 1 ขั้นตอน");
        return false;
      }

      document.getElementById("steps-json").value = JSON.stringify(names);
      return true;
    }

    renderInitialSteps();
  </script>
  <script>${plannerAppScript()}</script>
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