// plannerApp.js — สคริปต์ UX กลางของ Planner
// ให้ทุกหน้าเรียก: <script>${plannerAppScript()}</script> วางไว้ "นอก" #app (ก่อน </body>)
// - แถบโหลดด้านบน + ปุ่ม busy = รู้ว่าระบบกำลังทำ
// - toast แทน alert
// - ถ้า <main id="app" data-ajax> จะทำงานแบบไม่โหลดหน้าใหม่ (กรอง/เปลี่ยนหน้า/บันทึก)
// j  ถ้าไม่มี data-ajax จะยังโหลดหน้าปกติ แต่มีแถบโหลด+ปุ่ม busy ให้

export function plannerAppScript() {
  return `
(function () {
  var css = "#np-bar{position:fixed;top:0;left:0;height:3px;width:0;background:#2563eb;z-index:9999;transition:width .2s ease,opacity .3s ease;box-shadow:0 0 8px rgba(37,99,235,.6)}"
    + "#np-toasts{position:fixed;top:16px;right:16px;z-index:10000;display:flex;flex-direction:column;gap:8px}"
    + ".np-toast{background:#111827;color:#fff;padding:11px 15px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;max-width:340px}"
    + ".np-toast.show{opacity:1;transform:translateY(0)}"
    + ".np-toast.ok{background:#166534}.np-toast.err{background:#991b1b}"
    + "button.np-busy{opacity:.75;cursor:progress}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var bar = document.createElement("div"); bar.id = "np-bar"; document.body.appendChild(bar);
  var toasts = document.createElement("div"); toasts.id = "np-toasts"; document.body.appendChild(toasts);

  var barTimer = null;
  function barStart() { bar.style.opacity = "1"; bar.style.width = "18%"; clearInterval(barTimer); var w = 18; barTimer = setInterval(function () { w += (92 - w) * 0.15; bar.style.width = w + "%"; }, 220); }
  function barDone() { clearInterval(barTimer); bar.style.width = "100%"; setTimeout(function () { bar.style.opacity = "0"; bar.style.width = "0"; }, 300); }

  function toast(msg, type) {
    if (!msg) return;
    var d = document.createElement("div");
    d.className = "np-toast " + (type === "ok" ? "ok" : (type === "err" ? "err" : ""));
    d.textContent = msg;
    toasts.appendChild(d);
    requestAnimationFrame(function () { d.classList.add("show"); });
    setTimeout(function () { d.classList.remove("show"); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 250); }, 2800);
  }

  function popAlerts(root) {
    var els = root.querySelectorAll(".alert");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var t = el.classList.contains("success") ? "ok" : (el.classList.contains("error") ? "err" : "");
      toast(el.textContent.trim(), t);
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  }

  function setBusy(btn) {
    if (!btn) return;
    if (btn.getAttribute("data-orig") === null || btn.getAttribute("data-orig") === undefined) {
      btn.setAttribute("data-orig", btn.textContent);
    }
    btn.textContent = btn.getAttribute("data-busy") || "กำลังทำ…";
    btn.disabled = true;
    btn.classList.add("np-busy");
  }

  var app = document.getElementById("app");
  var ajax = !!(app && app.hasAttribute("data-ajax"));

  function reexec(container) {
    var scripts = container.querySelectorAll("script");
    for (var i = 0; i < scripts.length; i++) {
      var old = scripts[i];
      var s = document.createElement("script");
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    }
  }

  function swap(htmlText, url, keepScroll) {
    var doc = new DOMParser().parseFromString(htmlText, "text/html");
    var fresh = doc.getElementById("app");
    if (!fresh) { window.location.href = url || location.href; return; }
    var y = window.scrollY;
    app.innerHTML = fresh.innerHTML;
    reexec(app);
    if (url) { try { history.pushState({}, "", url); } catch (e) {} }
    window.scrollTo(0, keepScroll ? y : 0);
    if (doc.title) document.title = doc.title;
    popAlerts(app);
  }

  function go(url, keepScroll) {
    barStart();
    fetch(url, { headers: { "X-Requested-With": "fetch" }, redirect: "follow" })
      .then(function (r) { return r.text().then(function (t) { return { t: t, u: r.url || url }; }); })
      .then(function (o) { swap(o.t, o.u, keepScroll); })
      .catch(function () { window.location.href = url; })
      .then(function () { barDone(); });
  }

  if (ajax) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || !app.contains(a)) return;
      if (a.target || a.hasAttribute("data-native")) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#") return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === "/logout") return;
      e.preventDefault();
      go(url.href, false);
    });

    document.addEventListener("submit", function (e) {
      var form = e.target;
      if (!app.contains(form) || form.hasAttribute("data-native")) return;
      if (e.defaultPrevented) return;
      var cf = form.getAttribute("data-confirm");
      if (cf && !window.confirm(cf)) { e.preventDefault(); return; }
      e.preventDefault();
      setBusy(e.submitter);
      barStart();
      var method = (form.getAttribute("method") || "get").toLowerCase();
      if (method === "get") {
        var u = new URL(form.action, location.href);
        var ps = new URLSearchParams();
        new FormData(form).forEach(function (v, k) { ps.append(k, v); });
        u.search = ps.toString();
        go(u.href, false);
        return;
      }
      fetch(form.action, { method: "POST", body: new FormData(form), redirect: "follow" })
        .then(function (r) { return r.text().then(function (t) { return { t: t, u: r.url }; }); })
        .then(function (o) { swap(o.t, o.u, true); })
        .catch(function () { window.location.reload(); })
        .then(function () { barDone(); });
    });

    window.addEventListener("popstate", function () { go(location.href, false); });
  } else {
    document.addEventListener("submit", function (e) {
      if (e.defaultPrevented) return;
      var cf = e.target.getAttribute && e.target.getAttribute("data-confirm");
      if (cf && !window.confirm(cf)) { e.preventDefault(); return; }
      setBusy(e.submitter);
      barStart();
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (a && !a.target && a.getAttribute("href") && a.getAttribute("href").charAt(0) !== "#") barStart();
    });
  }

  popAlerts(document);
})();
`;
}