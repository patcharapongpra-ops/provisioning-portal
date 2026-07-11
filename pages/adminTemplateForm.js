import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function adminTemplateFormPage({ user, mode, template, fields, error }) {
  const isEdit = mode === "edit";
  const t = template || {};
  const formAction = isEdit ? "/admin/templates/update" : "/admin/templates/store";

  const initialModel = (fields || []).map((f) => ({
    key: String(f.field_key || "").toUpperCase(),
    label: f.label || f.field_key || "",
    kind: f.source_key ? "derived" : "input",
    source: String(f.source_key || "").toUpperCase(),
    transform: f.transform_type || "raw",
    transformValue: f.transform_value || "",
    sample: f.default_value || "",
    inputType: f.input_type === "select" ? "select" : "text",
    options: f.options_text || "",
  }));

  const initJson = JSON.stringify(initialModel).replace(/</g, "\\u003c");
  const isActive = t.is_active === 0 ? "0" : "1";

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEdit ? "แก้ไข" : "สร้าง"} Template - Config</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "admin-templates")}
    <main class="container wide-container">
    <section class="hero">
      <h1>${isEdit ? "แก้ไข Template" : "สร้าง Template"}</h1>
      <p>แปะ config จริงลงไป แล้วลากคลุมคำที่อยากให้เปลี่ยนค่า เลือกว่าจะให้ user กรอกเอง หรือดึงจากช่องอื่น (เช่น IP +1)</p>
    </section>

    ${error ? `<div class="alert error">${escapeHtml(error)}</div>` : ""}

    <form action="${formAction}" method="POST" class="admin-form" onsubmit="return prepareSubmit()">
      ${isEdit ? `<input type="hidden" name="template_id" value="${t.id || ""}">` : ""}
      <input type="hidden" name="template_text" id="template_text">
      <input type="hidden" name="fields_json" id="fields_json">

      <section class="panel">
        <h2>ข้อมูล Template</h2>
        <div class="form-row">
          <label>Device Type
            <input name="device_type_name" type="text" placeholder="เช่น Router, Switch" value="${escapeHtml(t.device_type_name || "")}" required>
          </label>
          <label>ชื่อ Template
            <input name="template_name" type="text" placeholder="เช่น DIA - Basic" value="${escapeHtml(t.name || "")}" required>
          </label>
        </div>
        <label>Status
          <select name="is_active">
            <option value="1" ${isActive === "1" ? "selected" : ""}>Active</option>
            <option value="0" ${isActive === "0" ? "selected" : ""}>Disabled</option>
          </select>
        </label>
      </section>

      <section class="panel">
        <div class="panel-title-row">
          <div>
            <h2>Config</h2>
            <p class="muted">แปะ config แล้วลากคลุมคำ → กดปุ่มเพื่อทำเป็นช่อง</p>
          </div>
          <div class="action-row">
            <button type="button" class="small-btn" onclick="openPanel('input')">＋ ช่องกรอก</button>
            <button type="button" class="small-btn" onclick="openPanel('derived')">＝ ดึงจากช่องเดิม</button>
          </div>
        </div>

        <textarea id="config-src" rows="12" placeholder="แปะ config ที่นี่ เช่น&#10;hostname CORE-01&#10; ip address 10.10.20.1 255.255.255.0">${escapeHtml(t.template_text || "")}</textarea>

        <div id="add-panel" class="help-box" style="display:none;margin-top:14px">
          <div class="form-row">
            <label>คำที่เลือก
              <input id="ap-selected" type="text" readonly>
            </label>
            <label>ชื่อช่อง (KEY)
              <input id="ap-key" type="text" placeholder="เช่น HOSTNAME, NETWORK">
            </label>
          </div>
          <div class="form-row">
            <label>ป้ายกำกับ (label)
              <input id="ap-label" type="text" placeholder="ชื่อที่น้องเห็น เช่น Hostname">
            </label>
            <label>ชนิด
              <select id="ap-kind" onchange="toggleKind()">
                <option value="input">ช่องกรอก (user กรอกเอง)</option>
                <option value="derived">ดึงจากช่องเดิม</option>
              </select>
            </label>
          </div>
          <div id="ap-derived" style="display:none">
            <div class="form-row">
              <label>เอาค่ามาจากช่อง
                <select id="ap-source"></select>
              </label>
              <label>วิธีแปลง
                <select id="ap-transform" onchange="toggleTValue()"></select>
              </label>
            </div>
            <label id="ap-tvalue-wrap" style="display:none">ค่า N
              <input id="ap-tvalue" type="number" value="1">
            </label>
          </div>
          <div id="ap-inputtype-wrap">
            <div class="form-row">
              <label>รูปแบบช่อง
                <select id="ap-inputtype" onchange="toggleInputType()">
                  <option value="text">กล่องพิมพ์ (text)</option>
                  <option value="select">Dropdown ตัวเลือก</option>
                </select>
              </label>
              <label>&nbsp;</label>
            </div>
            <label id="ap-options-wrap" style="display:none">ตัวเลือก (บรรทัดละ 1 ตัว รูปแบบ ป้าย|ค่า)
              <textarea id="ap-options" rows="4" placeholder="เช่น&#10;100 Mbps|100&#10;1 Gbps|1000&#10;(ถ้าไม่ใส่ | จะใช้ข้อความเป็นทั้งป้ายและค่า)"></textarea>
            </label>
          </div>
          <div class="action-row" style="margin-top:10px">
            <button type="button" class="primary-btn" onclick="confirmAdd()">เพิ่มช่อง</button>
            <button type="button" class="small-btn" onclick="closePanel()">ยกเลิก</button>
          </div>
        </div>

        <table style="margin-top:16px">
          <thead>
            <tr><th>Placeholder</th><th>Label</th><th>ชนิด</th><th>ค่าตัวอย่าง</th><th>ลำดับ</th><th></th></tr>
          </thead>
          <tbody id="field-list"></tbody>
        </table>
      </section>

      <section class="panel">
        <h2>ตัวอย่างผลลัพธ์ (Preview)</h2>
        <p class="muted">คำนวณสดจาก "ค่าตัวอย่าง" ด้านบน</p>
        <pre id="preview" class="config-output"></pre>
      </section>

      <section class="panel">
        <button type="submit" class="primary-btn">${isEdit ? "บันทึกการแก้ไข" : "สร้าง Template"}</button>
        <a class="secondary-link-btn" href="/admin/templates">ยกเลิก</a>
      </section>
    </form>

    <script id="init-data" type="application/json">${initJson}</script>
    <script>
      var model = JSON.parse(document.getElementById("init-data").textContent || "[]");
      var srcEl = document.getElementById("config-src");
      var lastSel = { start: 0, end: 0, text: "" };

      var TRANSFORMS = [
        ["raw", "ใช้ค่าตรง"],
        ["cidr_host", "IP + N (เช่น +1)"],
        ["cidr_ip", "เอาเฉพาะ IP (ตัด /prefix)"],
        ["cidr_prefix", "เอาเฉพาะ prefix"],
        ["cidr_mask", "แปลงเป็น netmask"],
        ["number_add", "บวกเลข +N"],
        ["number_subtract", "ลบเลข -N"],
        ["upper", "ตัวใหญ่"],
        ["lower", "ตัวเล็ก"],
        ["underscore", "ช่องว่าง → _"],
        ["replace_space_dash", "ช่องว่าง → -"],
        ["after_last_underscore", "เอาส่วนหลัง _ ตัวสุดท้าย"],
        ["before_first_underscore", "เอาส่วนหน้า _ ตัวแรก"]
      ];
      var NEEDVAL = { cidr_host: 1, number_add: 1, number_subtract: 1 };

      function transformLabel(v) {
        for (var i = 0; i < TRANSFORMS.length; i++) if (TRANSFORMS[i][0] === v) return TRANSFORMS[i][1];
        return v;
      }
      function keyify(s) {
        return String(s || "").toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/^_+|_+$/g, "");
      }

      function grabSel() {
        if (srcEl.selectionStart !== srcEl.selectionEnd) {
          lastSel = {
            start: srcEl.selectionStart,
            end: srcEl.selectionEnd,
            text: srcEl.value.substring(srcEl.selectionStart, srcEl.selectionEnd)
          };
        }
      }
      srcEl.addEventListener("mouseup", grabSel);
      srcEl.addEventListener("keyup", grabSel);

      function openPanel(kind) {
        if (!lastSel.text) { alert("ลากคลุมคำในคอนฟิกก่อน แล้วค่อยกดปุ่มนี้"); return; }
        document.getElementById("ap-selected").value = lastSel.text;
        document.getElementById("ap-key").value = keyify(lastSel.text);
        document.getElementById("ap-label").value = "";
        document.getElementById("ap-kind").value = kind;
        document.getElementById("ap-inputtype").value = "text";
        document.getElementById("ap-options").value = "";

        var src = document.getElementById("ap-source");
        src.innerHTML = "";
        model.filter(function (f) { return f.kind === "input"; }).forEach(function (f) {
          var o = document.createElement("option");
          o.value = f.key; o.textContent = "{{" + f.key + "}}";
          src.appendChild(o);
        });

        var tr = document.getElementById("ap-transform");
        tr.innerHTML = "";
        TRANSFORMS.forEach(function (x) {
          var o = document.createElement("option");
          o.value = x[0]; o.textContent = x[1];
          tr.appendChild(o);
        });

        toggleKind();
        toggleTValue();
        toggleInputType();
        document.getElementById("add-panel").style.display = "block";
      }
      function closePanel() { document.getElementById("add-panel").style.display = "none"; }
      function toggleKind() {
        var d = document.getElementById("ap-kind").value === "derived";
        document.getElementById("ap-derived").style.display = d ? "block" : "none";
        document.getElementById("ap-inputtype-wrap").style.display = d ? "none" : "block";
      }
      function toggleInputType() {
        var s = document.getElementById("ap-inputtype").value === "select";
        document.getElementById("ap-options-wrap").style.display = s ? "flex" : "none";
      }
      function parseOptions(text) {
        var lines = String(text || "").split(String.fromCharCode(10)).map(function (l) { return l.trim(); }).filter(Boolean);
        return lines.map(function (line) {
          var parts = line.split("|");
          var label = (parts[0] || "").trim();
          var value = parts.length > 1 ? (parts[1] || "").trim() : label;
          return { label: label, value: value };
        });
      }
      function toggleTValue() {
        var tv = NEEDVAL[document.getElementById("ap-transform").value];
        document.getElementById("ap-tvalue-wrap").style.display = tv ? "flex" : "none";
      }

      function confirmAdd() {
        var key = keyify(document.getElementById("ap-key").value);
        if (!key) { alert("กรุณาตั้งชื่อช่อง (KEY)"); return; }
        if (model.some(function (f) { return f.key === key; })) { alert("ชื่อช่องนี้มีแล้ว"); return; }

        var kind = document.getElementById("ap-kind").value;
        var label = document.getElementById("ap-label").value.trim() || key;
        var field = { key: key, label: label, kind: kind, source: "", transform: "raw", transformValue: "", sample: "", inputType: "text", options: "" };

        if (kind === "input") {
          var itype = document.getElementById("ap-inputtype").value;
          if (itype === "select") {
            var optText = document.getElementById("ap-options").value;
            var opts = parseOptions(optText);
            if (!opts.length) { alert("Dropdown ต้องมีอย่างน้อย 1 ตัวเลือก"); return; }
            field.inputType = "select";
            field.options = optText;
            field.sample = opts[0].value;
          } else {
            field.inputType = "text";
            field.sample = lastSel.text;
          }
        } else {
          var source = document.getElementById("ap-source").value;
          if (!source) { alert("ยังไม่มีช่องกรอกให้ดึงค่า สร้างช่องกรอกก่อน"); return; }
          field.source = source;
          field.transform = document.getElementById("ap-transform").value;
          field.transformValue = NEEDVAL[field.transform] ? document.getElementById("ap-tvalue").value : "";
        }

        var token = "{{" + key + "}}";
        srcEl.value = srcEl.value.slice(0, lastSel.start) + token + srcEl.value.slice(lastSel.end);
        model.push(field);
        lastSel = { start: 0, end: 0, text: "" };
        closePanel();
        renderList();
        renderPreview();
      }

      function removeField(idx) {
        var f = model[idx];
        srcEl.value = srcEl.value.split("{{" + f.key + "}}").join(f.kind === "input" ? (f.sample || "") : "");
        model.splice(idx, 1);
        renderList();
        renderPreview();
      }

      function renderList() {
        var tb = document.getElementById("field-list");
        tb.innerHTML = "";
        if (!model.length) {
          var tr0 = document.createElement("tr");
          var td0 = document.createElement("td");
          td0.colSpan = 5; td0.className = "muted";
          td0.textContent = "ยังไม่มีช่อง — ลากคลุมคำในคอนฟิกแล้วกดปุ่มด้านบน";
          tr0.appendChild(td0); tb.appendChild(tr0); return;
        }
        model.forEach(function (f, idx) {
          var tr = document.createElement("tr");
          var c1 = document.createElement("td"); c1.textContent = "{{" + f.key + "}}"; c1.style.fontFamily = "monospace"; tr.appendChild(c1);
          var c2 = document.createElement("td"); c2.textContent = f.label; tr.appendChild(c2);
          var c3 = document.createElement("td");
          if (f.kind === "input") c3.textContent = f.inputType === "select" ? "Dropdown" : "ช่องกรอก";
          else c3.textContent = "ดึงจาก {{" + f.source + "}} · " + transformLabel(f.transform) + (NEEDVAL[f.transform] ? (" " + f.transformValue) : "");
          tr.appendChild(c3);
          var c4 = document.createElement("td");
          if (f.kind === "input" && f.inputType === "select") {
            var sel = document.createElement("select"); sel.style.width = "160px";
            parseOptions(f.options).forEach(function (o) {
              var op = document.createElement("option"); op.value = o.value; op.textContent = o.label;
              if (o.value === f.sample) op.selected = true;
              sel.appendChild(op);
            });
            sel.addEventListener("change", function () { f.sample = sel.value; renderPreview(); });
            c4.appendChild(sel);
          } else if (f.kind === "input") {
            var inp = document.createElement("input");
            inp.type = "text"; inp.value = f.sample || ""; inp.placeholder = "ค่าตัวอย่าง"; inp.style.width = "150px";
            inp.addEventListener("input", function () { f.sample = inp.value; renderPreview(); });
            c4.appendChild(inp);
          } else { c4.className = "muted"; c4.textContent = "(อัตโนมัติ)"; }
          tr.appendChild(c4);
          var cm = document.createElement("td");
          var mv = document.createElement("div"); mv.className = "move-btns";
          var up = document.createElement("button"); up.type = "button"; up.className = "mini-btn"; up.textContent = "↑";
          up.disabled = idx === 0;
          up.addEventListener("click", function () { moveField(idx, -1); });
          var dn = document.createElement("button"); dn.type = "button"; dn.className = "mini-btn"; dn.textContent = "↓";
          dn.disabled = idx === model.length - 1;
          dn.addEventListener("click", function () { moveField(idx, 1); });
          mv.appendChild(up); mv.appendChild(dn); cm.appendChild(mv); tr.appendChild(cm);
          var c5 = document.createElement("td");
          var b = document.createElement("button"); b.type = "button"; b.className = "mini-btn"; b.textContent = "✕";
          b.addEventListener("click", function () { removeField(idx); });
          c5.appendChild(b); tr.appendChild(c5);
          tb.appendChild(tr);
        });
      }

      function moveField(idx, dir) {
        var to = idx + dir;
        if (to < 0 || to >= model.length) return;
        var tmp = model[idx];
        model[idx] = model[to];
        model[to] = tmp;
        renderList();
        renderPreview();
      }

      function ipToNumber(ip) {
        var p = String(ip).split(".").map(Number);
        if (p.length !== 4 || p.some(function (x) { return isNaN(x); })) return null;
        if (p.some(function (x) { return x < 0 || x > 255; })) return null;
        return p.reduce(function (a, o) { return (a << 8) + o; }, 0) >>> 0;
      }
      function numberToIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
      function prefixToMask(prefix) {
        if (prefix < 0 || prefix > 32) return "";
        var m = [];
        for (var i = 0; i < 4; i++) { var b = Math.max(0, Math.min(8, prefix - i * 8)); m.push(b === 0 ? 0 : 256 - Math.pow(2, 8 - b)); }
        return m.join(".");
      }
      function cidrHost(cidr, offset) {
        var ip = String(cidr).split("/")[0];
        var base = ipToNumber(ip);
        if (base === null || isNaN(offset)) return "";
        return numberToIp(base + offset);
      }
      function applyTransform(value, type, tv) {
        if (!type || type === "raw") return value;
        if (type === "number_add") { var b = Number(value); return isNaN(b) ? value : String(b + Number(tv || 0)); }
        if (type === "number_subtract") { var b2 = Number(value); return isNaN(b2) ? value : String(b2 - Number(tv || 0)); }
        if (type === "upper") return String(value).toUpperCase();
        if (type === "lower") return String(value).toLowerCase();
        if (type === "cidr_ip") return String(value).split("/")[0];
        if (type === "cidr_prefix") return String(value).split("/")[1] || "";
        if (type === "cidr_mask") { var pf = Number(String(value).split("/")[1]); return isNaN(pf) ? "" : prefixToMask(pf); }
        if (type === "cidr_host") return cidrHost(value, Number(tv || 0));
        if (type === "underscore") return String(value).trim().split(" ").filter(Boolean).join("_");
        if (type === "replace_space_dash") return String(value).trim().split(" ").filter(Boolean).join("-");
        if (type === "after_last_underscore") { var ap = String(value).split("_"); return ap[ap.length - 1] || ""; }
        if (type === "before_first_underscore") return String(value).split("_")[0] || "";
        return value;
      }

      function renderPreview() {
        var values = {};
        model.forEach(function (f) { if (f.kind === "input") values[f.key] = f.sample || ""; });
        model.forEach(function (f) {
          if (f.kind === "derived") {
            var sv = values[f.source] !== undefined ? values[f.source] : "";
            values[f.key] = applyTransform(sv, f.transform, f.transformValue);
          }
        });
        var out = srcEl.value;
        model.forEach(function (f) { out = out.split("{{" + f.key + "}}").join(values[f.key] !== undefined ? values[f.key] : ""); });
        document.getElementById("preview").textContent = out;
      }

      srcEl.addEventListener("input", renderPreview);

      function prepareSubmit() {
        if (!model.length) { alert("ต้องมีอย่างน้อย 1 ช่อง"); return false; }
        var out = model.map(function (f, i) {
          var isSelect = f.kind === "input" && f.inputType === "select";
          return {
            field_key: f.key,
            label: f.label || f.key,
            source_key: f.kind === "derived" ? f.source : "",
            input_type: isSelect ? "select" : "text",
            placeholder: "",
            default_value: f.kind === "input" ? (f.sample || "") : "",
            is_required: f.kind === "input",
            sort_order: i,
            transform_type: f.kind === "derived" ? f.transform : "raw",
            transform_value: f.kind === "derived" ? String(f.transformValue || "") : "",
            options_text: isSelect ? (f.options || "") : ""
          };
        });
        document.getElementById("template_text").value = srcEl.value;
        document.getElementById("fields_json").value = JSON.stringify(out);
        return true;
      }

      renderList();
      renderPreview();
    </script>
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