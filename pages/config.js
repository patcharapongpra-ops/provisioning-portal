import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function configPage({
  user,
  templates,
  selectedTemplate,
  fields,
  output,
  error,
  inputValues = {},
}) {
  const groups = new Map();
  for (const template of templates) {
    const groupName = template.device_type_name || "General";
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(template);
  }

  const templateOptions = [...groups.entries()]
    .map(([groupName, list]) => {
      const options = list
        .map((template) => {
          const selected =
            selectedTemplate && Number(selectedTemplate.id) === Number(template.id)
              ? "selected"
              : "";

          return `<option value="${template.id}" ${selected}>${escapeHtml(
            template.name
          )}</option>`;
        })
        .join("");

      return `<optgroup label="${escapeHtml(groupName)}">${options}</optgroup>`;
    })
    .join("");

  const inputFields = fields
    .filter((field) => !field.source_key)
    .map((field) => {
      const required = field.is_required ? "required" : "";
      const savedValue =
        inputValues[field.field_key] !== undefined
          ? inputValues[field.field_key]
          : "";

      if (field.input_type === "select") {
        const selectedValue =
          savedValue !== "" ? savedValue : field.default_value || "";
        const options = parseOptions(field.options_text || "")
          .map((option) => {
            const selected =
              String(selectedValue) === String(option.value) ? "selected" : "";

            return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(
              option.label
            )}</option>`;
          })
          .join("");

        return `
          <label>
            ${escapeHtml(field.label)}
            <select name="${escapeHtml(field.field_key)}" ${required}>
              ${options}
            </select>
          </label>
        `;
      }

      const placeholder = field.placeholder
        ? field.placeholder
        : field.default_value
        ? `เช่น ${field.default_value}`
        : "";

      return `
        <label>
          ${escapeHtml(field.label)}
          <input
            name="${escapeHtml(field.field_key)}"
            type="${escapeHtml(field.input_type || "text")}"
            placeholder="${escapeHtml(placeholder)}"
            value="${escapeHtml(savedValue)}"
            ${required}
          >
        </label>
      `;
    })
    .join("");

  const liveData = selectedTemplate
    ? {
        id: selectedTemplate.id,
        fileName: fileSafeName(selectedTemplate.name),
        text: selectedTemplate.template_text || "",
        fields: fields.map((field) => ({
          key: field.field_key,
          label: field.label || field.field_key,
          source: field.source_key || "",
          transform: field.transform_type || "raw",
          transformValue: field.transform_value || "",
          input: !field.source_key,
        })),
      }
    : null;

  const liveJson = JSON.stringify(liveData).replace(/</g, "\\u003c");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Config Generator - Provisioning Portal</title>
  <style>${mainStyle()}</style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "config")}
    <main class="container wide-container">
    <section class="hero">
      <h1>Config Generator</h1>
      <p>เลือก Template แล้วกรอกข้อมูล — ตัวอย่าง config จะเติมค่าให้เห็นสด ๆ ระหว่างพิมพ์</p>
    </section>

    ${error ? `<div class="alert error">${escapeHtml(error)}</div>` : ""}

    <section class="panel">
      <form action="/config" method="GET" class="admin-form">
        <label>
          Template
          <select name="template_id" required onchange="this.form.submit()">
            <option value="">-- เลือก Template --</option>
            ${templateOptions}
          </select>
        </label>
        <noscript><button class="primary-btn" type="submit">Load Template</button></noscript>
      </form>
    </section>

    ${
      selectedTemplate
        ? `
    <section class="panel">
      <div class="panel-title-row">
        <div>
          <h2>${escapeHtml(selectedTemplate.name)}</h2>
          <p class="muted">Device Type: ${escapeHtml(
            selectedTemplate.device_type_name || "General"
          )} · คลิกช่องสีเหลืองใน preview เพื่อกระโดดไปกรอก</p>
        </div>
        <div class="action-row">
          <span id="live-status" class="live-status"></span>
          <button type="button" class="small-btn" onclick="copyConfig()">Copy</button>
          <button type="button" class="small-btn" onclick="downloadConfig()">ดาวน์โหลด .txt</button>
        </div>
      </div>

      <form class="admin-form" id="gen-form" onsubmit="return false">
        <div class="config-fields-grid">
          ${inputFields}
        </div>

        <pre id="live-preview" class="config-output"></pre>
      </form>
    </section>
    `
        : ""
    }

    <script id="live-data" type="application/json">${liveJson}</script>
    <script>
      (function () {
        var DATA = JSON.parse(document.getElementById("live-data").textContent || "null");
        if (!DATA) return;

        var form = document.getElementById("gen-form");
        var pre = document.getElementById("live-preview");
        var statusEl = document.getElementById("live-status");

        var byKey = {};
        DATA.fields.forEach(function (f) { byKey[f.key] = f; });
        var lastMissing = 0;

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

        function computeValues() {
          var values = {};
          DATA.fields.forEach(function (f) {
            if (!f.input) return;
            var el = form.elements[f.key];
            values[f.key] = el ? String(el.value || "").trim() : "";
          });
          DATA.fields.forEach(function (f) {
            if (f.input) return;
            var sv = values[f.source] !== undefined ? values[f.source] : "";
            values[f.key] = sv ? applyTransform(sv, f.transform, f.transformValue) : "";
          });
          return values;
        }

        function focusField(key) {
          return function () {
            var el = form.elements[key];
            if (!el) return;
            el.focus();
            if (el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
          };
        }

        function renderLive() {
          var values = computeValues();
          pre.innerHTML = "";

          var re = /\\{\\{([A-Z0-9_]+)\\}\\}/g;
          var last = 0;
          var m;
          while ((m = re.exec(DATA.text))) {
            if (m.index > last) pre.appendChild(document.createTextNode(DATA.text.slice(last, m.index)));
            var key = m[1];
            var f = byKey[key];
            var span = document.createElement("span");
            if (!f) {
              span.textContent = m[0];
            } else if (f.input) {
              var v = values[key];
              if (v) {
                span.className = "pv-slot pv-filled";
                span.textContent = v;
              } else {
                span.className = "pv-slot pv-missing";
                span.textContent = "\\u27E8" + f.label + "\\u27E9";
              }
              span.title = f.label + " \\u2014 \\u0E04\\u0E25\\u0E34\\u0E01\\u0E40\\u0E1E\\u0E37\\u0E48\\u0E2D\\u0E44\\u0E1B\\u0E01\\u0E23\\u0E2D\\u0E01";
              span.addEventListener("click", focusField(key));
            } else {
              var dv = values[key];
              span.className = "pv-slot pv-derived";
              span.textContent = dv || "\\u27E8" + f.label + "\\u27E9";
              span.title = "\\u0E04\\u0E33\\u0E19\\u0E27\\u0E13\\u0E2D\\u0E31\\u0E15\\u0E42\\u0E19\\u0E21\\u0E31\\u0E15\\u0E34\\u0E08\\u0E32\\u0E01 {{" + f.source + "}}";
            }
            pre.appendChild(span);
            last = re.lastIndex;
          }
          if (last < DATA.text.length) pre.appendChild(document.createTextNode(DATA.text.slice(last)));

          var missing = DATA.fields.filter(function (f) { return f.input && !values[f.key]; }).length;
          lastMissing = missing;
          if (missing) {
            statusEl.className = "live-status";
            statusEl.textContent = "\\u0E40\\u0E2B\\u0E25\\u0E37\\u0E2D\\u0E2D\\u0E35\\u0E01 " + missing + " \\u0E0A\\u0E48\\u0E2D\\u0E07";
          } else {
            statusEl.className = "live-status ok";
            statusEl.textContent = "\\u0E04\\u0E23\\u0E1A\\u0E17\\u0E38\\u0E01\\u0E0A\\u0E48\\u0E2D\\u0E07 \\u0E1E\\u0E23\\u0E49\\u0E2D\\u0E21 Generate";
          }
        }

        DATA.fields.forEach(function (f) {
          if (!f.input) return;
          var el = form.elements[f.key];
          if (!el) return;
          el.addEventListener("input", renderLive);
          el.addEventListener("change", renderLive);
        });

        function confirmIfIncomplete() {
          if (lastMissing > 0) return confirm("\\u0E22\\u0E31\\u0E07\\u0E01\\u0E23\\u0E2D\\u0E01\\u0E44\\u0E21\\u0E48\\u0E04\\u0E23\\u0E1A " + lastMissing + " \\u0E0A\\u0E48\\u0E2D\\u0E07 \\u0E40\\u0E2D\\u0E32\\u0E15\\u0E48\\u0E2D\\u0E40\\u0E25\\u0E22\\u0E44\\u0E2B\\u0E21?");
          return true;
        }

        function sendHistory() {
          try {
            fetch("/config/history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ template_id: DATA.id, values: computeValues() })
            }).catch(function () {});
          } catch (e) {}
        }

        window.copyConfig = function () {
          if (!confirmIfIncomplete()) return;
          navigator.clipboard.writeText(pre.textContent);
          sendHistory();
          alert("Copied config");
        };

        window.downloadConfig = function () {
          if (!confirmIfIncomplete()) return;
          var blob = new Blob([pre.textContent], { type: "text/plain;charset=utf-8" });
          var d = new Date();
          function pad(n) { return (n < 10 ? "0" : "") + n; }
          var stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = DATA.fileName + "_" + stamp + ".txt";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
          sendHistory();
        };

        renderLive();
      })();
    </script>
    </main>
  </div>
</body>
</html>
`;
}

function fileSafeName(name) {
  return (
    String(name || "config")
      .trim()
      .replace(/[^\w฀-๿.-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "") || "config"
  );
}

function parseOptions(optionsText) {
  const lines = String(optionsText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  if (!lines.length) {
    return [{ label: "None", value: "" }];
  }

  return lines.map((line) => {
    const parts = line.split("|");
    const label = (parts[0] || "").trim();
    const value = parts.length > 1 ? (parts[1] || "").trim() : label;

    return {
      label,
      value,
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
