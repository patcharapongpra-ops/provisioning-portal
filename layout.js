// layout.js — shared app shell (sidebar navigation + dark-mode toggle)
// ทุกหน้าที่ล็อกอินแล้วเรียก renderSidebar(user, activeKey) แทนการเขียน topbar/nav เอง
// activeKey: "home" | "planner-board" | "planner-calendar" | "planner-dashboard" | "planner-types"
//            | "config" | "admin-overview" | "admin-users" | "admin-templates"

const NAV_GROUPS = [
  {
    label: "ภาพรวม",
    items: [{ key: "home", href: "/home", label: "Home" }],
  },
  {
    label: "งานติดตั้ง",
    items: [
      { key: "planner-board", href: "/planner", label: "บอร์ดงาน" },
      { key: "planner-calendar", href: "/planner/calendar", label: "ปฏิทิน" },
      { key: "planner-dashboard", href: "/planner/dashboard", label: "Dashboard" },
      { key: "planner-types", href: "/planner/types", label: "คลังชนิดงาน" },
    ],
  },
  {
    label: "เครื่องมือ",
    items: [
      { key: "config", href: "/config", label: "Config Generator" },
      { key: "diagrams", href: "/diagrams", label: "Diagram" },
      { key: "car", href: "/car", label: "จองรถ" },
    ],
  },
];

const ADMIN_GROUP = {
  label: "ผู้ดูแลระบบ",
  items: [
    { key: "admin-overview", href: "/admin", label: "Overview" },
    { key: "admin-users", href: "/admin/users", label: "Manage Users" },
    { key: "admin-templates", href: "/admin/templates", label: "Manage Templates" },
    { key: "admin-holidays", href: "/admin/holidays", label: "วันหยุดออฟฟิศ" },
  ],
};

export function renderSidebar(user, active) {
  const groups = user.role === "admin" ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  const groupsHtml = groups
    .map((group) => {
      const items = group.items
        .map(
          (item) => `
          <a href="${item.href}"${item.key === active ? ' class="active"' : ""}>
            <span class="nav-dot"></span>${escapeHtml(item.label)}
          </a>`
        )
        .join("");

      return `
      <nav class="nav-group">
        <h4>${escapeHtml(group.label)}</h4>
        ${items}
      </nav>`;
    })
    .join("");

  const initial = escapeHtml((user.full_name || "?").trim().charAt(0) || "?");

  return `
  <aside class="sidebar">
    <div class="sidebar-head">
      <p class="wordmark">Provisioning<span>Portal</span></p>
      <button class="sidebar-collapse" id="sidebarToggle" type="button" title="พับเมนู">&laquo;</button>
      <p class="wordmark-mini">P</p>
    </div>

    ${groupsHtml}

    <div class="sidebar-foot">
      <div class="who">
        <div class="who-av">${initial}</div>
        <div class="who-meta">
          <b>${escapeHtml(user.full_name || "")}</b>
          <span>${escapeHtml(user.role || "")}</span>
        </div>
      </div>

      <button class="theme-toggle" id="themeToggle" type="button">
        <span id="themeToggleLabel">Light mode</span>
        <span class="theme-switch"></span>
      </button>

      <a href="/account/password" class="logout-link" data-native>เปลี่ยนรหัสผ่าน</a>
      <a href="/logout" class="logout-link" data-native>Logout</a>
    </div>
  </aside>
  <script>
    (function () {
      var btn = document.getElementById("themeToggle");
      if (!btn) return;
      var label = document.getElementById("themeToggleLabel");
      function setLabel(theme) { label.textContent = theme === "dark" ? "Dark mode" : "Light mode"; }
      setLabel(document.documentElement.getAttribute("data-theme") || "light");
      btn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") || "light";
        var next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        setLabel(next);
      });
    })();

    (function () {
      var btn = document.getElementById("sidebarToggle");
      if (!btn) return;
      function apply(collapsed) {
        if (collapsed) document.documentElement.setAttribute("data-sidebar", "collapsed");
        else document.documentElement.removeAttribute("data-sidebar");
        btn.innerHTML = collapsed ? "&raquo;" : "&laquo;";
        btn.title = collapsed ? "ขยายเมนู" : "พับเมนู";
      }
      apply(document.documentElement.getAttribute("data-sidebar") === "collapsed");
      btn.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-sidebar") !== "collapsed";
        apply(next);
        try { localStorage.setItem("sidebar", next ? "collapsed" : ""); } catch (e) {}
      });
    })();
  </script>
  `;
}

// วางไว้ต้น <head> (ก่อน <style>) เพื่อตั้งธีมจาก localStorage ก่อน paint แรก กัน flash
export function themeInitScript() {
  return `<script>
    (function () {
      try {
        var t = localStorage.getItem("theme");
        if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
        if (localStorage.getItem("sidebar") === "collapsed") document.documentElement.setAttribute("data-sidebar", "collapsed");
      } catch (e) {}
    })();
  </script>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
