import { mainStyle } from "../styles/main.js";
import { plannerAppScript } from "../plannerApp.js";

export function plannerJobViewPage({ user, job, steps, comments, canEdit, error, success }) {
  const pct = job.step_total
    ? Math.round((job.step_done / job.step_total) * 100)
    : 0;

  const stepRows = (steps || [])
    .map((step) => {
      const nextDone = step.is_done ? 0 : 1;
      const box = step.is_done
        ? `<span style="color:#16a34a">☑</span>`
        : `<span style="color:#9ca3af">☐</span>`;
      const label = step.is_done
        ? `<span style="text-decoration:line-through;color:#9ca3af">${escapeHtml(step.name)}</span>`
        : escapeHtml(step.name);

      return `
      <div class="job-step" data-step-id="${step.id}"${canEdit ? ' draggable="true"' : ""} style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9">
        ${canEdit ? `<span class="drag-handle" title="ลากเพื่อจัดลำดับ">⠿</span>` : ""}
        <form action="/planner/jobs/step/toggle" method="POST" class="inline-form ajax">
          <input type="hidden" name="job_id" value="${job.id}">
          <input type="hidden" name="step_id" value="${step.id}">
          <input type="hidden" name="next_done" value="${nextDone}">
          <button type="submit" style="background:none;border:0;cursor:pointer;font-size:18px;padding:0">${box}</button>
        </form>
        <div style="flex:1;font-size:14px">${label}</div>
        ${
          canEdit
            ? `<form action="/planner/jobs/step/remove" method="POST" class="inline-form ajax" data-confirm="ลบขั้นตอนนี้?">
                 <input type="hidden" name="job_id" value="${job.id}">
                 <input type="hidden" name="step_id" value="${step.id}">
                 <button class="mini-btn" type="submit">✕</button>
               </form>`
            : ""
        }
      </div>
    `;
    })
    .join("");

  const commentItems = (comments || [])
    .map((c) => {
      const initial = escapeHtml((c.author_name || "?").trim().charAt(0) || "?");
      return `
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="width:30px;height:30px;border-radius:50%;background:#dbeafe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${initial}</div>
        <div>
          <div style="font-size:13px"><strong>${escapeHtml(c.author_name)}</strong> <span class="muted">(${escapeHtml(c.author_role)}) · ${escapeHtml(c.created_at || "")}</span></div>
          <div style="font-size:14px;margin-top:2px">${escapeHtml(c.message)}</div>
        </div>
      </div>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(job.cid || "งาน")} - Planner</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <header class="topbar">
    <div>
      <h2>รายละเอียดงาน</h2>
      <p>${escapeHtml(user.full_name)}</p>
    </div>

    <nav class="nav">
      <a href="/planner">Planner</a>
      <a href="/planner/calendar">ปฏิทิน</a>
      <a href="/planner/dashboard">Dashboard</a>
      <a href="/logout">Logout</a>
    </nav>
  </header>

  <main class="container" id="app" data-ajax>
    <section class="hero">
      <div class="panel-title-row">
        <div>
          <h1>${escapeHtml(job.cid || "-")} · ${escapeHtml(job.customer_name || "")}</h1>
          <p>
            <span class="badge">${escapeHtml(job.type_name || "-")}</span>
            ${statusBadge(job.status, job.overdue)}
            <span class="muted"> · ผู้รับผิดชอบ: ${escapeHtml(job.owner_name || "-")}</span>
          </p>
        </div>
        ${
          canEdit
            ? `<form action="/planner/jobs/delete" method="POST" class="inline-form" onsubmit="return confirm('ลบงานนี้ทั้งหมด?')">
                 <input type="hidden" name="job_id" value="${job.id}">
                 <button class="danger-btn" type="submit">ลบงาน</button>
               </form>`
            : ""
        }
      </div>
    </section>

    ${success === "saved" ? `<div class="alert success">บันทึกข้อมูลงานสำเร็จ</div>` : ""}
    ${error === "missing" ? `<div class="alert error">กรุณากรอก CID และชื่อลูกค้า</div>` : ""}

    <section class="panel">
      <h2>ข้อมูลงาน & วันสำคัญ</h2>
      <form action="/planner/jobs/update" method="POST" class="admin-form ajax">
        <input type="hidden" name="job_id" value="${job.id}">
        <div class="form-row">
          <label>CID<input name="cid" type="text" value="${escapeHtml(job.cid || "")}" required></label>
          <label>ชื่อลูกค้า<input name="customer_name" type="text" value="${escapeHtml(job.customer_name || "")}" required></label>
        </div>
        <div class="form-row">
          <label>SOF<input name="sof" type="text" value="${escapeHtml(job.sof || "")}"></label>
          <label>โน้ต<input name="note" type="text" value="${escapeHtml(job.note || "")}"></label>
        </div>
        <div class="form-row">
          <label>วันติดตั้ง<input name="install_date" type="date" value="${escapeHtml(job.install_date || "")}"></label>
          <label>วันส่งมอบ<input name="delivery_date" type="date" value="${escapeHtml(job.delivery_date || "")}"></label>
        </div>
        <div class="form-row">
          <label>วันปิด CR<input name="cr_close_date" type="date" value="${escapeHtml(job.cr_close_date || "")}"></label>
          <label>&nbsp;</label>
        </div>
        ${canEdit ? `<button class="primary-btn" type="submit">บันทึก</button>` : ""}
      </form>
    </section>

    <section class="panel">
      <div class="panel-title-row">
        <h2>ขั้นตอน (Checklist) · ${job.step_done}/${job.step_total}</h2>
      </div>
      <div style="height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-bottom:14px">
        <div style="width:${pct}%;height:100%;background:${pct === 100 ? "#16a34a" : "#2563eb"}"></div>
      </div>

      <div id="steps-list" data-job-id="${job.id}">${stepRows || `<p class="muted">ยังไม่มีขั้นตอน</p>`}</div>

      ${
        canEdit
          ? `
      <form id="reorder-form" action="/planner/jobs/step/reorder" method="POST" style="display:none">
        <input type="hidden" name="job_id" value="${job.id}">
        <input type="hidden" name="order" id="reorder-order">
      </form>
      <p class="muted" style="font-size:12px;margin-top:10px">ลากไอคอน ⠿ เพื่อจัดลำดับขั้นตอน</p>

      <form action="/planner/jobs/step/add" method="POST" class="action-row ajax" style="margin-top:14px">
        <input type="hidden" name="job_id" value="${job.id}">
        <input name="name" type="text" placeholder="เพิ่มขั้นตอนใหม่" required style="flex:1;padding:9px 12px;border:1px solid #d1d5db;border-radius:10px">
        <button class="small-btn" type="submit">+ เพิ่ม</button>
      </form>
      `
          : ""
      }
    </section>

    <section class="panel" id="comments">
      <h2>คอมเมนต์</h2>
      ${commentItems || `<p class="muted">ยังไม่มีคอมเมนต์</p>`}

      ${
        canEdit
          ? `
      <form action="/planner/jobs/comment" method="POST" class="action-row ajax" style="margin-top:12px">
        <input type="hidden" name="job_id" value="${job.id}">
        <input name="message" type="text" placeholder="เขียนคอมเมนต์…" required style="flex:1;padding:9px 12px;border:1px solid #d1d5db;border-radius:10px">
        <button class="small-btn" type="submit">ส่ง</button>
      </form>
      `
          : ""
      }
    </section>

    ${canEdit ? `<script>
      (function () {
        var list = document.getElementById("steps-list");
        if (!list) return;
        var dragEl = null, startOrder = "";
        function orderNow() { return [].slice.call(list.querySelectorAll(".job-step")).map(function (r) { return r.dataset.stepId; }).join(","); }
        list.addEventListener("dragstart", function (e) { var row = e.target.closest(".job-step"); if (!row) return; dragEl = row; startOrder = orderNow(); row.style.opacity = "0.5"; });
        list.addEventListener("dragend", function () {
          if (dragEl) dragEl.style.opacity = "";
          var changed = orderNow() !== startOrder; dragEl = null;
          if (changed) { document.getElementById("reorder-order").value = orderNow(); document.getElementById("reorder-form").requestSubmit(); }
        });
        list.addEventListener("dragover", function (e) {
          e.preventDefault(); if (!dragEl) return;
          var target = [].slice.call(list.querySelectorAll(".job-step")).filter(function (r) { if (r === dragEl) return false; var box = r.getBoundingClientRect(); return e.clientY < box.top + box.height / 2; })[0];
          if (target) list.insertBefore(dragEl, target); else list.appendChild(dragEl);
        });
      })();
    </script>` : ""}
  </main>

  <script>${plannerAppScript()}</script>
</body>
</html>
`;
}

function statusBadge(status, overdue) {
  const map = {
    todo: `<span class="badge badge-gray">ยังไม่เริ่ม</span>`,
    in_progress: `<span class="badge">กำลังทำ</span>`,
    done: `<span class="badge" style="background:#dcfce7;color:#166534">เสร็จ</span>`,
  };
  const base = map[status] || map.todo;
  const flag = overdue
    ? ` <span class="badge" style="background:#fee2e2;color:#991b1b">เลยกำหนด</span>`
    : "";
  return base + flag;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}