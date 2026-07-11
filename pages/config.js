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
  const templateOptions = templates
    .map((template) => {
      const selected =
        selectedTemplate && Number(selectedTemplate.id) === Number(template.id)
          ? "selected"
          : "";

      return `<option value="${template.id}" ${selected}>${escapeHtml(
        template.device_type_name || "General"
      )} - ${escapeHtml(template.name)}</option>`;
    })
    .join("");

  const inputFields = fields
    .filter((field) => !field.source_key)
    .map((field) => {
      const required = field.is_required ? "required" : "";
      const savedValue =
        inputValues[field.field_key] !== undefined
          ? inputValues[field.field_key]
          : field.default_value || "";

      if (field.input_type === "select") {
        const options = parseOptions(field.options_text || "")
          .map((option) => {
            const selected =
              String(savedValue) === String(option.value) ? "selected" : "";

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

      return `
        <label>
          ${escapeHtml(field.label)}
          <input 
            name="${escapeHtml(field.field_key)}" 
            type="${escapeHtml(field.input_type || "text")}" 
            placeholder="${escapeHtml(field.placeholder || "")}" 
            value="${escapeHtml(savedValue)}"
            ${required}
          >
        </label>
      `;
    })
    .join("");

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
    <main class="container">
    <section class="hero">
      <h1>Config Generator</h1>
      <p>เลือก Template กรอกข้อมูล แล้วสร้าง Config ได้ทันที</p>
    </section>

    ${error ? `<div class="alert error">${escapeHtml(error)}</div>` : ""}

    <section class="panel">
      <h2>เลือก Template</h2>

      <form action="/config" method="GET" class="admin-form">
        <div class="form-row">
          <label>
            Template
            <select name="template_id" required>
              <option value="">-- Select template --</option>
              ${templateOptions}
            </select>
          </label>
        </div>

        <button class="primary-btn" type="submit">Load Template</button>
      </form>
    </section>

    ${
      selectedTemplate
        ? `
    <section class="panel">
      <h2>${escapeHtml(selectedTemplate.name)}</h2>
      <p class="muted">Device Type: ${escapeHtml(
        selectedTemplate.device_type_name || "General"
      )}</p>

      <form action="/config/generate" method="POST" class="admin-form">
        <input type="hidden" name="template_id" value="${selectedTemplate.id}">

        <div class="form-row">
          ${inputFields}
        </div>

        <button class="primary-btn" type="submit">Generate Config</button>
      </form>
    </section>
    `
        : ""
    }

    ${
      output
        ? `
    <section class="panel">
      <div class="panel-title-row">
        <h2>Result Config</h2>
        <button class="small-btn" onclick="copyConfig()">Copy</button>
      </div>

      <pre id="config-output" class="config-output">${escapeHtml(output)}</pre>
    </section>

    <script>
      function copyConfig() {
        const text = document.getElementById("config-output").innerText;
        navigator.clipboard.writeText(text);
        alert("Copied config");
      }
    </script>
    `
        : ""
    }
    </main>
  </div>
</body>
</html>
`;
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