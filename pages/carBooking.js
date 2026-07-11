import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function carBookingPage({ user, data, error, success, conflict }) {
  const { now, inUse, lastReturn, upcoming, history } = data;
  const isAdmin = user.role === "admin";

  // ---------- hero status ----------
  let statusLine;
  if (inUse) {
    const overdue = inUse.end_at < now;
    statusLine = `🚗 กำลังใช้โดย <strong>${escapeHtml(inUse.owner_name)}</strong> ถึง ${fmtDT(inUse.end_at)}
      ${overdue ? `<span class="badge badge-overdue" style="margin-left:6px">เลยกำหนดคืน</span>` : ""}`;
  } else {
    const next = upcoming.find((b) => b.status === "booked");
    statusLine = `🚗 <strong style="color:var(--ok)">รถว่าง</strong>${
      next ? ` <span class="muted">· คิวถัดไป: ${escapeHtml(next.owner_name)} ${fmtDT(next.start_at)}</span>` : ""
    }`;
  }

  const parkLine = `🅿️ จอดอยู่ชั้น <strong>${escapeHtml(lastReturn?.parking_floor || "-")}</strong>
    <span class="muted">· เลขไมล์ล่าสุด ${lastReturn?.odometer_in ?? "-"} กม.</span>`;

  // ---------- return panel (เฉพาะเมื่อรถถูกใช้อยู่และเป็นของฉัน/admin) ----------
  const canReturn = inUse && (inUse.user_id === user.id || isAdmin);
  const returnPanel = canReturn
    ? `
    <section class="panel" style="border-color:var(--accent)">
      <h2>คืนรถ — ${escapeHtml(inUse.purpose)}</h2>
      <p class="muted" style="margin-bottom:14px">ไมล์ออก: ${inUse.odometer_out ?? "-"} กม. · รับรถเมื่อ ${fmtDT(inUse.picked_up_at || "")}</p>
      <form action="/car/return" method="POST" class="admin-form">
        <input type="hidden" name="booking_id" value="${inUse.id}">
        <div class="form-row">
          <label>เลขไมล์เข้า (กม.)
            <input name="odometer_in" type="number" min="0" required placeholder="เช่น ${(inUse.odometer_out ?? 0) + 10}">
          </label>
          <label>รถจอดชั้น
            <input name="parking_floor" type="text" required maxlength="40" placeholder="เช่น B2, ชั้น 3">
          </label>
        </div>
        <div class="form-row">
          <label>ค่าน้ำมัน (บาท ถ้ามี)
            <input name="fuel_cost" type="number" min="0" step="0.01" placeholder="เว้นว่างถ้าไม่ได้เติม">
          </label>
          <label>&nbsp;</label>
        </div>
        <div class="form-row-3">
          <label>สภาพรถยนต์
            <select name="check_vehicle"><option value="1">ปกติ</option><option value="0">ผิดปกติ</option></select>
          </label>
          <label>การขับขี่ใช้งาน
            <select name="check_driving"><option value="1">ปกติ</option><option value="0">ผิดปกติ</option></select>
          </label>
          <label>ความสะอาด
            <select name="check_clean"><option value="1">ปกติ</option><option value="0">ผิดปกติ</option></select>
          </label>
        </div>
        <label>รายละเอียดความผิดปกติ (บังคับถ้ามีช่องผิดปกติ)
          <input name="issue_note" type="text" maxlength="500" placeholder="เช่น ยางอ่อน, มีรอยขีดข่วนประตูซ้าย">
        </label>
        <button class="primary-btn" type="submit">คืนรถ</button>
      </form>
    </section>`
    : "";

  // ---------- queue rows ----------
  const queueRows = upcoming
    .map((b) => {
      const mine = b.user_id === user.id;
      const overdue = b.status === "in_use" && b.end_at < now;
      const statusBadge =
        b.status === "in_use"
          ? overdue
            ? `<span class="badge badge-overdue">เลยกำหนดคืน</span>`
            : `<span class="badge badge-progress">กำลังใช้</span>`
          : `<span class="badge badge-gray">จองแล้ว</span>`;

      let actions = "";
      if (b.status === "booked" && (mine || isAdmin)) {
        actions = `
          <div class="action-row">
            <form action="/car/pickup" method="POST" class="inline-form">
              <input type="hidden" name="booking_id" value="${b.id}">
              <div class="action-row">
                <input name="odometer_out" type="number" min="0" required placeholder="ไมล์ออก${lastReturn?.odometer_in != null ? ` (ล่าสุด ${lastReturn.odometer_in})` : ""}" class="filter-input" style="width:150px;padding:6px 10px;font-size:13px">
                <button class="small-btn" type="submit">รับรถ</button>
              </div>
            </form>
            <form action="/car/cancel" method="POST" class="inline-form" onsubmit="return confirm('ยกเลิกการจองนี้?')">
              <input type="hidden" name="booking_id" value="${b.id}">
              <button class="danger-btn" type="submit">ยกเลิก</button>
            </form>
          </div>`;
      }

      return `
      <tr${mine ? ` style="background:var(--accent-soft)"` : ""}>
        <td data-label="เวลา">${fmtDT(b.start_at)} → ${fmtDT(b.end_at)}</td>
        <td data-label="ผู้จอง">${escapeHtml(b.owner_name)}${mine ? ` <span class="muted">(คุณ)</span>` : ""}</td>
        <td data-label="เรื่อง">${escapeHtml(b.purpose)}</td>
        <td data-label="สถานที่">${escapeHtml(b.location || "-")}</td>
        <td data-label="สถานะ">${statusBadge}</td>
        <td class="${actions ? "row-actions" : "row-actions row-actions-empty"}">${actions}</td>
      </tr>`;
    })
    .join("");

  // ---------- history rows ----------
  const historyRows = history
    .map((b) => {
      const km =
        b.odometer_in != null && b.odometer_out != null
          ? b.odometer_in - b.odometer_out
          : null;
      const allOk = b.check_vehicle && b.check_driving && b.check_clean;
      const condition = allOk
        ? `<span style="color:var(--ok)">✓ ปกติ</span>`
        : `<span style="color:var(--danger)">✗ ${escapeHtml(b.issue_note || "ผิดปกติ")}</span>`;

      return `
      <tr>
        <td data-label="วันที่">${fmtDT(b.start_at)}</td>
        <td data-label="ผู้ใช้">${escapeHtml(b.owner_name)}</td>
        <td data-label="เรื่อง">${escapeHtml(b.purpose)}${b.location ? `<span class="muted"> · ${escapeHtml(b.location)}</span>` : ""}</td>
        <td data-label="ไมล์">${b.odometer_out ?? "-"} → ${b.odometer_in ?? "-"}${km != null ? ` <span class="muted">(${km} กม.)</span>` : ""}</td>
        <td data-label="จอดชั้น">${escapeHtml(b.parking_floor || "-")}</td>
        <td data-label="น้ำมัน (฿)">${b.fuel_cost != null ? b.fuel_cost.toLocaleString() : "-"}</td>
        <td data-label="สภาพ">${condition}</td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>จองรถ - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "car")}
    <main class="container">
    <section class="hero">
      <div class="panel-title-row">
        <div>
          <h1>จองรถแผนก</h1>
          <p style="margin-bottom:6px">${statusLine}</p>
          <p>${parkLine}</p>
        </div>
        <a class="secondary-link-btn" href="/car/log">บันทึกรายเดือน</a>
      </div>
    </section>

    ${showMessage(error, success, conflict)}

    ${returnPanel}

    <section class="panel">
      <h2>จองรถ</h2>
      <form action="/car/book" method="POST" class="admin-form">
        <div class="form-row">
          <label>วัน-เวลาเริ่มใช้
            <div class="action-row" style="flex-wrap:nowrap">
              <input id="car-start-date" name="start_date" type="date" required class="filter-input" style="flex:1">
              <input name="start_time" type="time" required class="filter-input">
            </div>
          </label>
          <label>วัน-เวลาคืนรถ (ข้ามวันได้ เช่น 23:00 → 03:00 วันถัดไป)
            <div class="action-row" style="flex-wrap:nowrap">
              <input id="car-end-date" name="end_date" type="date" required class="filter-input" style="flex:1">
              <input name="end_time" type="time" required class="filter-input">
            </div>
          </label>
        </div>
        <div class="form-row">
          <label>เรื่อง/ธุระ
            <input name="purpose" type="text" required maxlength="200" placeholder="เช่น ไปไซต์ลูกค้า Tower 66">
          </label>
          <label>สถานที่
            <input name="location" type="text" maxlength="200" placeholder="เช่น Tower 66 พระราม 4">
          </label>
        </div>
        <button class="primary-btn" type="submit">จองรถ</button>
      </form>
    </section>

    <section class="panel">
      <h2>คิวการจอง</h2>
      <table class="stack-table">
        <thead>
          <tr>
            <th>ช่วงเวลา</th>
            <th>ผู้จอง</th>
            <th>เรื่อง</th>
            <th>สถานที่</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          ${queueRows || `<tr><td colspan="6" class="muted">ยังไม่มีการจอง — รถว่าง จองได้เลย</td></tr>`}
        </tbody>
      </table>
    </section>

    <section class="panel">
      <div class="panel-title-row">
        <h2>ประวัติการใช้ล่าสุด</h2>
        <a class="small-link-btn" href="/car/log">ดูบันทึกรายเดือน →</a>
      </div>
      <table class="stack-table">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>ผู้ใช้</th>
            <th>เรื่อง</th>
            <th>ไมล์ ออก→เข้า</th>
            <th>จอดชั้น</th>
            <th>น้ำมัน (฿)</th>
            <th>สภาพ</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows || `<tr><td colspan="7" class="muted">ยังไม่มีประวัติการใช้รถ</td></tr>`}
        </tbody>
      </table>
    </section>
    </main>
  </div>

  <script>
    (function () {
      var sd = document.getElementById("car-start-date");
      var ed = document.getElementById("car-end-date");
      if (!sd || !ed) return;
      sd.addEventListener("change", function () {
        if (!ed.value || ed.value < sd.value) ed.value = sd.value;
      });
    })();
  </script>
</body>
</html>
`;
}

function showMessage(error, success, conflict) {
  if (success === "booked") return `<div class="alert success">จองรถสำเร็จ</div>`;
  if (success === "picked") return `<div class="alert success">รับรถแล้ว — เดินทางปลอดภัย</div>`;
  if (success === "returned") return `<div class="alert success">คืนรถเรียบร้อย ขอบคุณที่บันทึกข้อมูลครบถ้วน</div>`;
  if (success === "cancelled") return `<div class="alert success">ยกเลิกการจองแล้ว</div>`;

  if (error === "conflict" && conflict) {
    return `<div class="alert error">ช่วงเวลานี้ชนกับการจองของ ${escapeHtml(conflict.who || "-")} (${fmtDT(conflict.from || "")} → ${fmtDT(conflict.to || "")}) กรุณาเลือกเวลาอื่น</div>`;
  }
  if (error === "conflict") return `<div class="alert error">ช่วงเวลานี้มีคนจองแล้ว กรุณาเลือกเวลาอื่น</div>`;
  if (error === "missing") return `<div class="alert error">กรุณากรอกเรื่อง/ธุระ และวัน-เวลาให้ครบ</div>`;
  if (error === "order") return `<div class="alert error">เวลาคืนรถต้องอยู่หลังเวลาเริ่มใช้</div>`;
  if (error === "carout") return `<div class="alert error">รับรถไม่ได้ — รถยังถูกใช้งานอยู่ รอคืนรถก่อน</div>`;
  if (error === "odo_out") return `<div class="alert error">กรุณากรอกเลขไมล์ออกเป็นตัวเลข</div>`;
  if (error === "odo_in") return `<div class="alert error">กรุณากรอกเลขไมล์เข้าเป็นตัวเลข</div>`;
  if (error === "odo_less") return `<div class="alert error">เลขไมล์เข้าต้องไม่น้อยกว่าเลขไมล์ออก กรุณาตรวจสอบ</div>`;
  if (error === "floor") return `<div class="alert error">กรุณาระบุว่ารถจอดอยู่ชั้นไหน</div>`;
  if (error === "fuel") return `<div class="alert error">ค่าน้ำมันต้องเป็นตัวเลข</div>`;
  if (error === "issue") return `<div class="alert error">มีช่องผิดปกติ — กรุณาบอกรายละเอียดความผิดปกติด้วย</div>`;
  if (error === "notfound") return `<div class="alert error">ไม่พบการจองนี้ หรือคุณไม่มีสิทธิ์จัดการ</div>`;
  return "";
}

// "2026-07-11T23:00" → "11/07 23:00"
function fmtDT(dt) {
  const s = String(dt);
  if (s.length < 16) return escapeHtml(s);
  return `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
