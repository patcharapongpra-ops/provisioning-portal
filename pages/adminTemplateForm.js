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
    keep: true,
    auto: false,
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
      <p>แปะ config จริงลงไป แล้วพิมพ์ <code>{{ชื่อช่อง}}</code> ตรงไหนก็ได้ (ซ้ำกี่จุดก็ได้) ระบบจะสร้างช่องให้อัตโนมัติ</p>
    </section>

    ${error ? `<div class="alert error">${escapeHtml(error)}</div>` : ""}

    <form action="${formAction}" method="POST" class="admin-form" onsubmit="return prepareSubmit()">
      ${isEdit ? `<input type="hidden" name="template_id" value="${t.id || ""}">` : ""}
      <input type="hidden" name="template_text" id="template_text">
      <input type="hidden" name="fields_json" id="fields_json">

      <section class="panel">
        <div class="panel-title-row">
          <h2>ข้อมูล Template</h2>
          <div class="action-row">
            <button type="submit" class="primary-btn">${isEdit ? "บันทึกการแก้ไข" : "สร้าง Template"}</button>
            <a class="secondary-link-btn" href="/admin/templates">ยกเลิก</a>
          </div>
        </div>
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

      <section class="panel tpl-config-panel">
        <div class="panel-title-row">
          <div>
            <h2>Config</h2>
            <p class="muted">พิมพ์ {{KEY}} ในเนื้อ config ได้เลย ช่องจะโผล่ในตารางเอง · ลาก ⋮⋮ จัดลำดับช่องที่ user จะกรอกในหน้า Config Generator</p>
          </div>
          <div class="action-row">
            <button type="button" class="small-btn" onclick="openHolder()">＋ ช่องเก็บค่า (ไม่แสดงใน config)</button>
          </div>
        </div>

        <div class="tpl-edit-grid">
          <div class="tpl-src-col">
            <textarea id="config-src" rows="14" placeholder="แปะ config ที่นี่ เช่น&#10;hostname CORE-01&#10; ip address 10.10.20.1 255.255.255.0">${escapeHtml(t.template_text || "")}</textarea>
          </div>

          <div class="tpl-resizer" id="tpl-resizer" title="ลากเพื่อปรับความกว้าง"></div>

          <div class="tpl-field-col">
            <table>
              <thead>
                <tr><th>ช่อง</th><th>ชนิด</th><th>ค่าตัวอย่าง</th><th>ลำดับ</th><th></th></tr>
              </thead>
              <tbody id="field-list"></tbody>
            </table>
          </div>
        </div>

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
      </section>

      <section class="panel">
        <h2>ฟอร์มที่ user จะเห็น</h2>
        <p class="muted">หน้าตาเดียวกับหน้า Config Generator จริง · ลากช่องเพื่อจัดลำดับก่อน-หลังได้เลย</p>
        <div id="user-form-preview" class="config-fields-grid"></div>
      </section>

      <section class="panel">
        <h2>ตัวอย่างผลลัพธ์ (Preview)</h2>
        <p class="muted">จุดสีคือตำแหน่งที่ค่าจะถูกเปลี่ยน — <span class="pv-slot pv-filled">เขียว</span> จากช่องกรอก · <span class="pv-slot pv-derived">ฟ้า</span> คำนวณอัตโนมัติ · <span class="pv-slot pv-missing">เหลือง</span> ยังไม่มีค่าตัวอย่าง</p>
        <pre id="preview" class="config-output"></pre>
      </section>

    </form>

    <script id="init-data" type="application/json">${initJson}</script>
    <script>
      var model = JSON.parse(document.getElementById("init-data").textContent || "[]");
      var srcEl = document.getElementById("config-src");
      var editIdx = -1;
      var holderMode = false;
      var textTokens = {};
      var dragIdx = null;
      var ufDragIdx = null;

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

      function populateSelects(excludeKey, sourceValue, transformValue) {
        var src = document.getElementById("ap-source");
        src.innerHTML = "";
        model.filter(function (f) { return f.kind === "input" && f.key !== excludeKey; }).forEach(function (f) {
          var o = document.createElement("option");
          o.value = f.key; o.textContent = "{{" + f.key + "}}";
          src.appendChild(o);
        });
        if (sourceValue) src.value = sourceValue;

        var tr = document.getElementById("ap-transform");
        tr.innerHTML = "";
        TRANSFORMS.forEach(function (x) {
          var o = document.createElement("option");
          o.value = x[0]; o.textContent = x[1];
          tr.appendChild(o);
        });
        if (transformValue) tr.value = transformValue;
      }

      function openHolder() {
        editIdx = -1;
        holderMode = true;
        var keyEl = document.getElementById("ap-key");
        var kindEl = document.getElementById("ap-kind");
        keyEl.readOnly = false;
        keyEl.value = "";
        document.getElementById("ap-selected").value = "(ช่องเก็บค่า — ให้ user กรอก แล้วช่องอื่นดึงไปใช้)";
        document.getElementById("ap-label").value = "";
        kindEl.value = "input";
        kindEl.disabled = true;
        document.getElementById("ap-inputtype").value = "text";
        document.getElementById("ap-options").value = "";
        document.getElementById("ap-tvalue").value = "1";

        populateSelects("", "", "");
        toggleKind();
        toggleTValue();
        toggleInputType();
        document.getElementById("add-panel").style.display = "block";
        keyEl.focus();
      }

      function openEdit(idx) {
        var f = model[idx];
        editIdx = idx;
        holderMode = false;
        var keyEl = document.getElementById("ap-key");
        document.getElementById("ap-selected").value = "{{" + f.key + "}}";
        keyEl.value = f.key;
        keyEl.readOnly = true;
        document.getElementById("ap-label").value = f.label || "";
        var kindEl = document.getElementById("ap-kind");
        kindEl.disabled = false;
        kindEl.value = f.kind;
        document.getElementById("ap-inputtype").value = f.inputType === "select" ? "select" : "text";
        document.getElementById("ap-options").value = f.options || "";
        document.getElementById("ap-tvalue").value = f.transformValue || "1";

        populateSelects(f.key, f.source || "", f.transform || "raw");
        toggleKind();
        toggleTValue();
        toggleInputType();
        document.getElementById("add-panel").style.display = "block";
      }

      function closePanel() {
        editIdx = -1;
        holderMode = false;
        document.getElementById("ap-kind").disabled = false;
        document.getElementById("add-panel").style.display = "none";
      }
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
        var isEditMode = editIdx >= 0;
        if (!isEditMode && !holderMode) { closePanel(); return; }
        var old = isEditMode ? model[editIdx] : null;
        var key = isEditMode ? old.key : keyify(document.getElementById("ap-key").value);
        if (!key) { alert("กรุณาตั้งชื่อช่อง (KEY)"); return; }
        if (!isEditMode && model.some(function (f) { return f.key === key; })) { alert("ชื่อช่องนี้มีแล้ว"); return; }

        var kind = document.getElementById("ap-kind").value;
        var label = document.getElementById("ap-label").value.trim() || key;
        var field = {
          key: key, label: label, kind: kind, source: "", transform: "raw", transformValue: "",
          sample: "", inputType: "text", options: "",
          missing: old ? old.missing : false,
          keep: old ? !!old.keep : holderMode,
          auto: false
        };

        if (kind === "input") {
          var itype = document.getElementById("ap-inputtype").value;
          if (itype === "select") {
            var optText = document.getElementById("ap-options").value;
            var opts = parseOptions(optText);
            if (!opts.length) { alert("Dropdown ต้องมีอย่างน้อย 1 ตัวเลือก"); return; }
            field.inputType = "select";
            field.options = optText;
            var keepSample = old && opts.some(function (o) { return o.value === old.sample; });
            field.sample = keepSample ? old.sample : opts[0].value;
          } else {
            field.inputType = "text";
            field.sample = old && old.kind === "input" ? (old.sample || "") : "";
          }
        } else {
          var source = document.getElementById("ap-source").value;
          if (!source) { alert("ยังไม่มีช่องกรอกให้ดึงค่า สร้างช่องกรอกก่อน"); return; }
          field.source = source;
          field.transform = document.getElementById("ap-transform").value;
          field.transformValue = NEEDVAL[field.transform] ? document.getElementById("ap-tvalue").value : "";
        }

        if (isEditMode) {
          model[editIdx] = field;
        } else {
          model.push(field);
        }
        closePanel();
        syncModelFromText();
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
          td0.textContent = "ยังไม่มีช่อง — พิมพ์ {{KEY}} ลงในคอนฟิกได้เลย";
          tr0.appendChild(td0); tb.appendChild(tr0);
          renderUserForm();
          return;
        }
        model.forEach(function (f, idx) {
          var tr = document.createElement("tr");
          if (f.missing) tr.className = "row-missing";
          var c1 = document.createElement("td");
          var lbl = document.createElement("input");
          lbl.type = "text"; lbl.value = f.label || ""; lbl.placeholder = f.key; lbl.style.width = "140px";
          lbl.addEventListener("input", function () { f.label = lbl.value; f.auto = false; });
          c1.appendChild(lbl);
          var keyTag = document.createElement("div");
          keyTag.className = "muted";
          keyTag.style.fontFamily = "monospace";
          keyTag.style.fontSize = "11px";
          keyTag.style.marginTop = "4px";
          keyTag.textContent = "{{" + f.key + "}}";
          c1.appendChild(keyTag);
          if (f.missing) {
            var warn = document.createElement("span");
            warn.className = "field-warn";
            warn.textContent = "ไม่พบใน config — จะไม่ถูกบันทึก";
            c1.appendChild(warn);
            var keepBtn = document.createElement("button");
            keepBtn.type = "button"; keepBtn.className = "mini-btn"; keepBtn.textContent = "เก็บไว้";
            keepBtn.title = "เก็บช่องนี้ไว้เป็นช่องพักค่า แม้ไม่อยู่ใน config";
            keepBtn.style.marginTop = "4px";
            keepBtn.addEventListener("click", function () { f.keep = true; f.missing = false; f.auto = false; renderList(); });
            c1.appendChild(keepBtn);
          } else if (f.keep && !textTokens[f.key]) {
            var note = document.createElement("span");
            note.className = "field-note";
            note.textContent = "ช่องเก็บค่า — ไม่แสดงใน config";
            c1.appendChild(note);
          }
          tr.appendChild(c1);
          var c3 = document.createElement("td");
          if (f.kind === "input") c3.textContent = f.inputType === "select" ? "Dropdown" : "ช่องกรอก";
          else {
            c3.textContent = "ดึงจาก {{" + f.source + "}} · " + transformLabel(f.transform) + (NEEDVAL[f.transform] ? (" " + f.transformValue) : "");
            c3.style.fontSize = "12.5px";
          }
          tr.appendChild(c3);
          var c4 = document.createElement("td");
          if (f.kind === "input" && f.inputType === "select") {
            var sel = document.createElement("select"); sel.style.width = "160px";
            parseOptions(f.options).forEach(function (o) {
              var op = document.createElement("option"); op.value = o.value; op.textContent = o.label;
              if (o.value === f.sample) op.selected = true;
              sel.appendChild(op);
            });
            sel.addEventListener("change", function () { f.sample = sel.value; f.auto = false; renderPreview(); });
            c4.appendChild(sel);
          } else if (f.kind === "input") {
            var inp = document.createElement("input");
            inp.type = "text"; inp.value = f.sample || ""; inp.placeholder = "ค่าตัวอย่าง"; inp.style.width = "150px";
            inp.addEventListener("input", function () { f.sample = inp.value; f.auto = false; renderPreview(); });
            c4.appendChild(inp);
          } else { c4.className = "muted"; c4.textContent = "(อัตโนมัติ)"; }
          tr.appendChild(c4);
          var cm = document.createElement("td");
          var mv = document.createElement("div"); mv.className = "move-btns";
          var hd = document.createElement("span");
          hd.className = "drag-handle"; hd.textContent = "⋮⋮"; hd.title = "ลากเพื่อจัดลำดับ";
          hd.draggable = true;
          hd.addEventListener("dragstart", function (e) {
            dragIdx = idx;
            tr.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", String(idx)); } catch (err) {}
            if (e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(tr, 12, 12);
          });
          hd.addEventListener("dragend", function () { dragIdx = null; tr.classList.remove("dragging"); });
          tr.addEventListener("dragover", function (e) {
            if (dragIdx === null || dragIdx === idx) return;
            e.preventDefault();
            tr.classList.add("drag-over");
          });
          tr.addEventListener("dragleave", function () { tr.classList.remove("drag-over"); });
          tr.addEventListener("drop", function (e) {
            if (dragIdx === null || dragIdx === idx) return;
            e.preventDefault();
            var it = model.splice(dragIdx, 1)[0];
            it.auto = false;
            model.splice(idx, 0, it);
            dragIdx = null;
            renderList();
            renderPreview();
          });
          mv.appendChild(hd); cm.appendChild(mv); tr.appendChild(cm);
          var c5 = document.createElement("td");
          var actions = document.createElement("div"); actions.className = "move-btns";
          var ed = document.createElement("button"); ed.type = "button"; ed.className = "mini-btn"; ed.textContent = "แก้ไข";
          ed.addEventListener("click", function () { openEdit(idx); });
          var b = document.createElement("button"); b.type = "button"; b.className = "mini-btn"; b.textContent = "✕";
          b.addEventListener("click", function () { removeField(idx); });
          actions.appendChild(ed); actions.appendChild(b);
          c5.appendChild(actions); tr.appendChild(c5);
          tb.appendChild(tr);
        });
        renderUserForm();
      }

      function renderUserForm() {
        var wrap = document.getElementById("user-form-preview");
        if (!wrap) return;
        wrap.innerHTML = "";
        var inputs = model.filter(function (f) { return f.kind === "input" && !f.missing; });
        if (!inputs.length) {
          var p = document.createElement("p");
          p.className = "muted";
          p.textContent = "ยังไม่มีช่องกรอก";
          wrap.appendChild(p);
          return;
        }
        inputs.forEach(function (f) {
          var lab = document.createElement("label");
          lab.className = "uf-item";
          lab.draggable = true;
          lab.title = "ลากเพื่อจัดลำดับ";
          lab.appendChild(document.createTextNode(f.label || f.key));
          var ctrl;
          if (f.inputType === "select") {
            ctrl = document.createElement("select");
            parseOptions(f.options).forEach(function (o) {
              var op = document.createElement("option");
              op.textContent = o.label;
              ctrl.appendChild(op);
            });
          } else {
            ctrl = document.createElement("input");
            ctrl.type = "text";
            ctrl.readOnly = true;
            ctrl.placeholder = f.sample ? "เช่น " + f.sample : "";
          }
          ctrl.tabIndex = -1;
          lab.appendChild(ctrl);

          lab.addEventListener("dragstart", function (e) {
            ufDragIdx = model.indexOf(f);
            lab.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", f.key); } catch (err) {}
          });
          lab.addEventListener("dragend", function () { ufDragIdx = null; lab.classList.remove("dragging"); });
          lab.addEventListener("dragover", function (e) {
            if (ufDragIdx === null || model[ufDragIdx] === f) return;
            e.preventDefault();
            lab.classList.add("drag-over");
          });
          lab.addEventListener("dragleave", function () { lab.classList.remove("drag-over"); });
          lab.addEventListener("drop", function (e) {
            if (ufDragIdx === null || model[ufDragIdx] === f) return;
            e.preventDefault();
            var moved = model.splice(ufDragIdx, 1)[0];
            moved.auto = false;
            model.splice(model.indexOf(f), 0, moved);
            ufDragIdx = null;
            renderList();
            renderPreview();
          });
          wrap.appendChild(lab);
        });
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
        var byKey = {};
        model.forEach(function (f) { byKey[f.key] = f; if (f.kind === "input") values[f.key] = f.sample || ""; });
        model.forEach(function (f) {
          if (f.kind === "derived") {
            var sv = values[f.source] !== undefined ? values[f.source] : "";
            values[f.key] = sv ? applyTransform(sv, f.transform, f.transformValue) : "";
          }
        });

        var pre = document.getElementById("preview");
        pre.innerHTML = "";
        var text = srcEl.value;
        var re = /\\{\\{([A-Z0-9_]+)\\}\\}/g;
        var last = 0;
        var m;
        while ((m = re.exec(text))) {
          if (m.index > last) pre.appendChild(document.createTextNode(text.slice(last, m.index)));
          var f = byKey[m[1]];
          var span = document.createElement("span");
          if (!f) {
            span.textContent = m[0];
          } else {
            var v = values[f.key] || "";
            if (f.kind === "derived") {
              span.className = "pv-slot pv-derived";
              span.title = "คำนวณอัตโนมัติจาก {{" + f.source + "}}";
            } else if (v) {
              span.className = "pv-slot pv-filled";
              span.title = f.label || f.key;
            } else {
              span.className = "pv-slot pv-missing";
              span.title = (f.label || f.key) + " — ใส่ค่าตัวอย่างในตารางเพื่อดูผล";
            }
            span.textContent = v || "\\u27E8" + (f.label || f.key) + "\\u27E9";
          }
          pre.appendChild(span);
          last = re.lastIndex;
        }
        if (last < text.length) pre.appendChild(document.createTextNode(text.slice(last)));
      }

      function syncModelFromText() {
        var found = {};
        var re = /\\{\\{([A-Z0-9_]+)\\}\\}/g;
        var m;
        while ((m = re.exec(srcEl.value))) found[m[1]] = true;
        textTokens = found;
        var known = {};
        model.forEach(function (f) { known[f.key] = true; f.missing = !found[f.key] && !f.keep; });
        Object.keys(found).forEach(function (key) {
          if (known[key]) return;
          model.push({ key: key, label: key, kind: "input", source: "", transform: "raw", transformValue: "", sample: "", inputType: "text", options: "", missing: false, keep: false, auto: true });
        });
        // ช่องที่ไม่อยู่ในเนื้อ config แต่ถูกช่องอื่นดึงค่าไปใช้ ยังถือว่าใช้งานอยู่
        model.forEach(function (f) {
          if (f.missing || !f.source) return;
          model.forEach(function (s) { if (s.key === f.source) s.missing = false; });
        });
        // ช่องที่ระบบสร้างเองแล้ว token หายไป (เช่น เศษจากการพิมพ์ {{A}} → {{AAA}})
        // ถ้ายังไม่เคยถูกแก้อะไรเลย ลบทิ้งให้อัตโนมัติ
        for (var i = model.length - 1; i >= 0; i--) {
          if (model[i].missing && model[i].auto) model.splice(i, 1);
        }
      }

      var syncTimer = null;
      srcEl.addEventListener("input", function () {
        renderPreview();
        clearTimeout(syncTimer);
        syncTimer = setTimeout(function () {
          syncModelFromText();
          renderList();
          renderPreview();
        }, 400);
      });

      function prepareSubmit() {
        var active = model.filter(function (f) { return !f.missing; });
        if (!active.length) { alert("ต้องมีอย่างน้อย 1 ช่อง"); return false; }
        if (active.length !== model.length) {
          var dropped = model.length - active.length;
          if (!confirm("มี " + dropped + " ช่องที่ไม่พบใน config จะถูกตัดออก — บันทึกต่อเลยไหม?")) return false;
        }
        var out = active.map(function (f, i) {
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

      syncModelFromText();
      renderList();
      renderPreview();

      (function () {
        var grid = document.querySelector(".tpl-edit-grid");
        var handle = document.getElementById("tpl-resizer");
        if (!grid || !handle) return;
        try {
          var saved = localStorage.getItem("tplSplit");
          if (saved) grid.style.setProperty("--tpl-split", saved);
        } catch (e) {}

        handle.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          handle.classList.add("dragging");
          handle.setPointerCapture(e.pointerId);
          document.body.style.userSelect = "none";

          function onMove(ev) {
            var rect = grid.getBoundingClientRect();
            var pct = ((ev.clientX - rect.left) / rect.width) * 100;
            pct = Math.max(20, Math.min(70, pct));
            grid.style.setProperty("--tpl-split", pct.toFixed(1) + "%");
          }
          function onUp(ev) {
            handle.classList.remove("dragging");
            handle.releasePointerCapture(ev.pointerId);
            document.body.style.userSelect = "";
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onUp);
            try { localStorage.setItem("tplSplit", grid.style.getPropertyValue("--tpl-split")); } catch (err) {}
          }
          handle.addEventListener("pointermove", onMove);
          handle.addEventListener("pointerup", onUp);
        });
      })();
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