import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function carLogPage({ user, log }) {
  const rows = (log.rows || [])
    .map((b) => {
      const km =
        b.odometer_in != null && b.odometer_out != null
          ? b.odometer_in - b.odometer_out
          : "";
      return `
      <tr>
        <td>${fmtDate(b.start_at)}</td>
        <td>#${b.id}</td>
        <td style="text-align:right">${b.odometer_out ?? ""}</td>
        <td style="text-align:right">${b.odometer_in ?? ""}</td>
        <td style="text-align:right">${km}</td>
        <td>${escapeHtml(b.purpose)}</td>
        <td>${escapeHtml(b.location || "")}</td>
        <td>${escapeHtml(b.owner_name)}</td>
        <td style="text-align:right">${b.fuel_cost != null ? b.fuel_cost.toLocaleString() : ""}</td>
        <td style="text-align:center">${mark(b.check_vehicle)}</td>
        <td style="text-align:center">${mark(b.check_driving)}</td>
        <td style="text-align:center">${mark(b.check_clean)}</td>
        <td>${escapeHtml(b.issue_note || "")}</td>
      </tr>`;
    })
    .join("");

  const totalKm = (log.rows || []).reduce((sum, b) => {
    if (b.odometer_in != null && b.odometer_out != null) {
      return sum + (b.odometer_in - b.odometer_out);
    }
    return sum;
  }, 0);

  const totalFuel = (log.rows || []).reduce(
    (sum, b) => sum + (b.fuel_cost != null ? b.fuel_cost : 0),
    0
  );

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>บันทึกการใช้รถ ${escapeHtml(log.monthLabel)} - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "car")}
    <main class="container wide-container">
    <section class="hero no-print">
      <div class="panel-title-row">
        <div>
          <h1>บันทึกการใช้รถยนต์</h1>
          <p>ตารางควบคุมการใช้รถ ประจำเดือน ${escapeHtml(log.monthLabel)}</p>
        </div>
        <div class="action-row">
          <a class="secondary-link-btn" href="/car/log?ym=${log.prevYm}">‹ เดือนก่อน</a>
          <a class="secondary-link-btn" href="/car/log?ym=${log.nextYm}">เดือนถัดไป ›</a>
          <button class="primary-btn" type="button" onclick="window.print()">🖨 พิมพ์</button>
          <a class="secondary-link-btn" href="/car">← จองรถ</a>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="print-only" style="margin-bottom:12px">
        <strong>Jastel Network CO.,LTD. — ตารางควบคุมการใช้รถยนต์</strong> · ประจำเดือน ${escapeHtml(log.monthLabel)}
      </div>
      <table style="font-size:12.5px">
        <thead>
          <tr>
            <th>วดป</th>
            <th>เลขที่จอง</th>
            <th>ไมล์ออก</th>
            <th>ไมล์เข้า</th>
            <th>ระยะ (กม.)</th>
            <th>เรื่อง</th>
            <th>สถานที่</th>
            <th>ผู้ขอใช้รถ</th>
            <th>ค่าน้ำมัน (฿)</th>
            <th>สภาพรถ</th>
            <th>การขับขี่</th>
            <th>ความสะอาด</th>
            <th>รายละเอียดผิดปกติ</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="13" class="muted">ไม่มีการใช้รถในเดือนนี้</td></tr>`}
        </tbody>
        ${
          rows
            ? `<tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:700">รวม</td>
                  <td style="text-align:right;font-weight:700">${totalKm.toLocaleString()}</td>
                  <td colspan="3"></td>
                  <td style="text-align:right;font-weight:700">${totalFuel.toLocaleString()}</td>
                  <td colspan="4"></td>
                </tr>
              </tfoot>`
            : ""
        }
      </table>
    </section>
    </main>
  </div>
</body>
</html>
`;
}

function mark(ok) {
  return ok
    ? `<span style="color:var(--ok)">✓</span>`
    : `<span style="color:var(--danger);font-weight:700">✗</span>`;
}

// "2026-07-11T23:00" → "11/07/26"
function fmtDate(dt) {
  const s = String(dt);
  if (s.length < 10) return escapeHtml(s);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(2, 4)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
