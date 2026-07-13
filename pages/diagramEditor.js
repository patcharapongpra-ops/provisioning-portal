import { mainStyle } from "../styles/main.js";
import { renderSidebar, themeInitScript } from "../layout.js";

export function diagramEditorPage({ user, diagram, canEdit, error, success }) {
  const initJson = diagram
    ? String(diagram.data_json).replace(/</g, "\\u003c")
    : "null";

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  ${themeInitScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${diagram ? escapeHtml(diagram.title) : "สร้าง Diagram"} - Provisioning Portal</title>
  <style>${mainStyle()}</style>
  <style>
    .dg-layout{ display:grid; grid-template-columns:300px 1fr; gap:18px; align-items:start; }
    @media (max-width:980px){ .dg-layout{ grid-template-columns:1fr; } }
    .dg-palette{ display:flex; flex-wrap:wrap; gap:6px; }
    .dg-field{ display:flex; flex-direction:column; gap:3px; font-size:12px; font-weight:600; color:var(--ink-2); margin-bottom:8px; }
    .dg-field input, .insp-card input, .insp-card select{
      padding:8px 10px; border:1px solid var(--hairline-strong); border-radius:7px; font-size:13px;
      font-family:var(--font-mono); background:var(--surface-2); color:var(--ink); min-width:0; width:100%;
    }
    .insp-card select{ font-family:inherit; font-weight:600; }
    .dg-two{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .dg-canvas-card{ background:#fff; border:1px solid var(--hairline); border-radius:12px; padding:10px; position:relative; }
    .dg-canvas-card svg{ width:100%; height:auto; display:block; touch-action:none; user-select:none; }
    .mode-banner{
      position:absolute; top:14px; left:50%; transform:translateX(-50%);
      background:#1f6f6b; color:#fff; font-size:13px; font-weight:700; padding:7px 16px; border-radius:999px;
      box-shadow:0 4px 14px rgba(0,0,0,.25); display:none; white-space:nowrap; z-index:5;
    }
    #inspector{ margin-top:10px; }
    .insp-card{ background:var(--surface); border:2px solid var(--accent); border-radius:12px; padding:12px 14px; }
    .insp-head{ display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
    .insp-head .insp-badge{ background:var(--accent-soft); color:var(--accent); font-size:11px; font-weight:800;
      padding:3px 10px; border-radius:999px; letter-spacing:.04em; }
    .insp-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .insp-grid3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
    @media (max-width:640px){ .insp-grid3, .insp-grid{ grid-template-columns:1fr; } }
    .insp-actions{ display:flex; gap:8px; margin-left:auto; }
    .insp-card label{ display:flex; flex-direction:column; gap:3px; font-size:12px; font-weight:600; color:var(--ink-2); }
    .dg-hint{ font-size:12px; color:var(--ink-3); margin:6px 0 0; }
    .dg-save-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .dg-save-row input[name="title"]{
      padding:9px 12px; border:1px solid var(--hairline-strong); border-radius:8px; font-size:14px;
      background:var(--surface-2); color:var(--ink); min-width:230px; flex:1; max-width:420px; font-family:inherit;
    }
  </style>
</head>
<body>
  <div class="app-shell">
    ${renderSidebar(user, "diagrams")}
    <main class="container wide-container">
    <section class="hero">
      <div class="panel-title-row">
        <div>
          <h1>${diagram ? escapeHtml(diagram.title) : "สร้าง Diagram ใหม่"}</h1>
          <p>${canEdit ? "แตะอุปกรณ์เพื่อแก้ · ลากจุดเขียว ⊕ ต่อสาย · เส้นหลบอุปกรณ์อัตโนมัติ" : "คุณกำลังดู diagram ของคนอื่น — แก้ได้อิสระแล้วกด 'บันทึกเป็นสำเนา'"}</p>
        </div>
        <a class="secondary-link-btn" href="/diagrams">← รายการ</a>
      </div>
    </section>

    ${showMessage(error, success)}

    <section class="panel">
      <form action="/diagrams/save" method="POST" class="dg-save-row" onsubmit="return prepareSave()">
        ${diagram && canEdit ? `<input type="hidden" name="diagram_id" value="${diagram.id}">` : ""}
        <input type="hidden" name="data_json" id="dg-data">
        <input type="hidden" name="cid" id="dg-cid-hidden">
        <input name="title" placeholder="ชื่อ diagram เช่น C5502 DIA - KABIS" maxlength="120" value="${escapeHtml(diagram ? diagram.title : "")}">
        <button class="primary-btn" type="submit">💾 ${canEdit ? "บันทึก" : "บันทึกเป็นสำเนา"}</button>
        <button class="small-btn" type="button" onclick="downloadPNG()">⬇ PNG</button>
        <button class="small-btn" type="button" onclick="downloadSVG()">⬇ SVG</button>
      </form>
    </section>

    <div class="dg-layout">
      <div>
        <section class="panel">
          <h2>หัวเรื่องบนรูป</h2>
          <div class="dg-two">
            <label class="dg-field">CID<input id="cid" value=""></label>
            <label class="dg-field">VLAN รวม (เว้นว่างได้)<input id="vlan" value=""></label>
          </div>
          <label class="dg-field">ชื่อลูกค้า<input id="customer" value=""></label>
        </section>

        <section class="panel" style="margin-top:12px">
          <h2>เพิ่มอุปกรณ์</h2>
          <div class="dg-palette">
            <button class="small-btn" type="button" onclick="addDevice('router')">+ Router</button>
            <button class="small-btn" type="button" onclick="addDevice('switch')">+ Switch</button>
            <button class="small-btn" type="button" onclick="addDevice('firewall')">+ Firewall</button>
            <button class="small-btn" type="button" onclick="addDevice('ap')">+ AP</button>
            <button class="small-btn" type="button" onclick="addDevice('server')">+ Server</button>
            <button class="small-btn" type="button" onclick="addDevice('cctv')">+ CCTV</button>
            <button class="small-btn" type="button" onclick="addDevice('ipphone')">+ IP Phone</button>
            <button class="small-btn" type="button" onclick="addDevice('cloud')">+ MPLS ใหญ่</button>
            <button class="small-btn" type="button" onclick="addDevice('mediacloud')">+ MPLS เล็ก</button>
            <button class="small-btn" type="button" onclick="addDevice('gateway')">+ Gateway</button>
            <button class="small-btn" type="button" onclick="addDevice('box')">+ กรอบ</button>
          </div>
          <div class="dg-palette" style="margin-top:10px">
            <button class="mini-btn" type="button" onclick="undo()">↩ ย้อนกลับ</button>
            <button class="mini-btn" type="button" onclick="presetDIA()">ตัวอย่าง DIA</button>
            <button class="mini-btn" type="button" onclick="presetDPLC()">ตัวอย่าง DPLC</button>
            <button class="mini-btn" type="button" onclick="if(confirm('ล้างทั้งหมด?'))clearAll()">ล้างทั้งหมด</button>
          </div>
        </section>

        <section class="panel" style="margin-top:12px">
          <h2>วิธีใช้</h2>
          <p class="dg-hint" style="margin:0">
            1. แตะอุปกรณ์ → แก้ชื่อ/สีที่การ์ดใต้รูป<br>
            2. <strong>ลากจุดเขียว ⊕</strong> ไปวางบนอีกตัว = ต่อสาย<br>
            3. แตะเส้น → สี / แนวเส้น / VLAN / ป้าย port-IP<br>
            4. กรอบ: เลือกแล้วลากมุมขวาล่างเพื่อขยาย<br>
            5. Delete = ลบ · Ctrl+Z = ย้อนกลับ
          </p>
        </section>
      </div>

      <div>
        <div class="dg-canvas-card">
          <div class="mode-banner" id="mode-banner">🔗 ลากไปใกล้อุปกรณ์ปลายทางแล้วปล่อย ไม่ต้องวางตรงเป๊ะ</div>
          <svg id="dia" viewBox="0 0 1280 660" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Noto Sans Thai, sans-serif"></svg>
        </div>
        <div id="inspector"></div>
      </div>
    </div>
    </main>
  </div>

  <script id="dg-init" type="application/json">${initJson}</script>
  <script>
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function v(id){ return document.getElementById(id).value; }

var TYPE_META = {
  router:     { tag: "ROUTER",   r: 56 },
  switch:     { tag: "SWITCH",   r: 56 },
  firewall:   { tag: "FIREWALL", r: 56 },
  ap:         { tag: "AP",       r: 52 },
  cloud:      { tag: "MPLS",     r: 150 },
  mediacloud: { tag: "MPLS",     r: 110 },
  gateway:    { tag: "GATEWAY",  r: 62 },
  server:     { tag: "SERVER",   r: 58 },
  cctv:       { tag: "CCTV",     r: 56 },
  ipphone:    { tag: "IP PHONE", r: 54 },
  box:        { tag: "กรอบ",     r: 0 },
};
var LINK_STYLES = {
  red:    { stroke: "#e03434", width: 7, dash: "" },
  blue:   { stroke: "#8fb8dd", width: 6, dash: "" },
  green:  { stroke: "#3f9d6e", width: 6, dash: "" },
  backup: { stroke: "#e08a2e", width: 5, dash: "12,8" },
};
var CLOUD_COLORS = {
  blue:   { g1: "#eaf4fd", g2: "#bcd8ef", stroke: "#93b7d8", text: "#111",    label: "ฟ้า — Jastel" },
  orange: { g1: "#fdf3e7", g2: "#f2d6ab", stroke: "#d9b98a", text: "#7a5510", label: "ส้ม — NT" },
  green:  { g1: "#eaf7ef", g2: "#bde3cb", stroke: "#94c9a9", text: "#1e5c38", label: "เขียว — AIS" },
  red:    { g1: "#fdeeee", g2: "#f0c2c2", stroke: "#dba0a0", text: "#7c2222", label: "แดง — True" },
  purple: { g1: "#f4f0fb", g2: "#d9cbef", stroke: "#b4a1d9", text: "#4b3380", label: "ม่วง — 3BB" },
  gray:   { g1: "#f3f5f7", g2: "#d4dade", stroke: "#a9b3bd", text: "#3c454e", label: "เทา — อื่นๆ" },
};

var state = { devices: [], links: [], seq: 1 };
var selection = null;
var connecting = null;
var undoStack = [];

function pushUndo(){
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 40) undoStack.shift();
}
function undo(){
  if (!undoStack.length) return;
  state = JSON.parse(undoStack.pop());
  selection = null; connecting = null;
  buildInspector(); render();
}

function addDevice(type, opts){
  opts = opts || {};
  if (!opts.silent) pushUndo();
  var defaults = {
    router:     { name: "Jastel Router AR5710-S", sub: "10.20.25.44" },
    switch:     { name: "CX600_XXX 1-1", sub: "10.10.144.126" },
    firewall:   { name: "Firewall", sub: "" },
    ap:         { name: "AP", sub: "" },
    cloud:      { name: "JasTel MPLS", sub: "" },
    mediacloud: { name: "NT Fiber", sub: "" },
    gateway:    { name: "Internet Gateway", sub: "(Jasmine)" },
    server:     { name: "Server", sub: "" },
    cctv:       { name: "CCTV", sub: "" },
    ipphone:    { name: "IP Phone", sub: "" },
    box:        { name: "Customer", sub: "" },
  };
  var d = {
    id: state.seq++, type: type,
    x: opts.x != null ? opts.x : 600 + ((state.seq * 37) % 120) - 60,
    y: opts.y != null ? opts.y : 330 + ((state.seq * 53) % 100) - 50,
    name: opts.name != null ? opts.name : defaults[type].name,
    sub: opts.sub != null ? opts.sub : defaults[type].sub,
  };
  if (type === "cloud") d.color = opts.color || "blue";
  if (type === "mediacloud") d.color = opts.color || "orange";
  if (type === "box"){ d.w = opts.w || 320; d.h = opts.h || 200; }
  state.devices.push(d);
  if (!opts.silent){ select("device", d.id); }
  render();
  return d;
}

function addLink(opts){
  var l = {
    id: state.seq++, from: opts.from, to: opts.to,
    style: opts.style || "red",
    curve: opts.curve != null ? opts.curve : "auto",
    vlan: opts.vlan || "",
    labelA: opts.labelA || "", labelMid: opts.labelMid || "", labelB: opts.labelB || "",
  };
  state.links.push(l);
  return l;
}

function deleteSelection(){
  if (!selection) return;
  pushUndo();
  if (selection.kind === "device"){
    state.devices = state.devices.filter(function(d){ return d.id !== selection.id; });
    state.links = state.links.filter(function(l){ return l.from !== selection.id && l.to !== selection.id; });
  } else {
    state.links = state.links.filter(function(l){ return l.id !== selection.id; });
  }
  select(null); render();
}

function clearAll(skipUndo){
  if (!skipUndo) pushUndo();
  state.devices = []; state.links = []; connecting = null;
  select(null); render();
}

function presetDIA(){
  pushUndo(); clearAll(true);
  var box = addDevice("box",    { x: 250, y: 360, silent: true });
  var rt  = addDevice("router", { x: 250, y: 360, silent: true });
  var sw  = addDevice("switch", { x: 645, y: 360, name: "CX600_ESIE 1-2", silent: true });
  var cl  = addDevice("cloud",  { x: 830, y: 370, silent: true });
  var g1  = addDevice("gateway",{ x: 1090, y: 215, sub: "(Jasmine)", silent: true });
  var g2  = addDevice("gateway",{ x: 1090, y: 500, sub: "(Suan Luang)", silent: true });
  addLink({ from: rt.id, to: sw.id, style: "red", labelA: "GE0/0/0", labelMid: "203.156.59.21/30", labelB: "GE0/3/15" });
  addLink({ from: sw.id, to: cl.id, style: "blue" });
  addLink({ from: cl.id, to: g1.id, style: "blue" });
  addLink({ from: cl.id, to: g2.id, style: "blue" });
  select(null); render();
}

function presetDPLC(){
  pushUndo(); clearAll(true);
  addDevice("box",    { x: 195, y: 380, silent: true });
  var rtA = addDevice("router", { x: 195, y: 380, sub: "10.20.25.44", silent: true });
  var swA = addDevice("switch", { x: 430, y: 380, name: "CX600_ESIE 1-2", silent: true });
  var cl  = addDevice("cloud",  { x: 640, y: 380, silent: true });
  var swB = addDevice("switch", { x: 850, y: 380, name: "CX600_LKB 1-1", sub: "10.10.150.10", silent: true });
  var rtB = addDevice("router", { x: 1085, y: 380, sub: "10.20.25.45", silent: true });
  addDevice("box",    { x: 1085, y: 380, silent: true });
  addLink({ from: rtA.id, to: swA.id, style: "red", labelA: "GE0/0/0", labelB: "GE0/3/15", vlan: "214" });
  addLink({ from: swA.id, to: cl.id, style: "blue" });
  addLink({ from: cl.id, to: swB.id, style: "blue" });
  addLink({ from: swB.id, to: rtB.id, style: "red", labelA: "GE0/2/10", labelB: "GE0/0/0", vlan: "318" });
  select(null); render();
}

function select(kind, id){
  selection = kind ? { kind: kind, id: id } : null;
  buildInspector();
}
function findDev(id){ return state.devices.find(function(d){ return d.id === id; }); }
function findLink(id){ return state.links.find(function(l){ return l.id === id; }); }

function buildInspector(){
  var el = document.getElementById("inspector");
  if (!selection){ el.innerHTML = ""; return; }

  if (selection.kind === "device"){
    var d = findDev(selection.id);
    if (!d){ el.innerHTML = ""; return; }
    var isCloud = d.type === "cloud" || d.type === "mediacloud";
    var colorSel = "";
    if (isCloud){
      colorSel = '<label>สีเมฆ (ผู้ให้บริการ)<select onchange="inspDev(\\'color\\',this.value)">'
        + Object.keys(CLOUD_COLORS).map(function(k){
            return '<option value="' + k + '" ' + (d.color === k ? "selected" : "") + '>' + CLOUD_COLORS[k].label + '</option>';
          }).join("")
        + '<option value="custom" ' + (d.color === "custom" ? "selected" : "") + '>🎨 กำหนดสีเอง…</option>'
        + '</select></label>'
        + (d.color === "custom"
          ? '<label>เลือกสี<input type="color" value="' + esc(d.customHex || "#4a90d9") + '" oninput="inspDev(\\'customHex\\',this.value)" style="height:38px;padding:3px"></label>'
          : "");
    }
    el.innerHTML = '<div class="insp-card">'
      + '<div class="insp-head"><span class="insp-badge">' + TYPE_META[d.type].tag + '</span>'
      + '<span style="font-size:13px;color:var(--ink-3)">แก้ไข — ลากจุดเขียว ⊕ บนรูปเพื่อต่อสาย</span>'
      + '<span class="insp-actions">'
      + '<button class="danger-btn" type="button" onclick="deleteSelection()">🗑 ลบ</button></span></div>'
      + '<div class="' + (isCloud ? "insp-grid3" : "insp-grid") + '">'
      + '<label>ชื่อ<input value="' + esc(d.name) + '" oninput="inspDev(\\'name\\',this.value)"></label>'
      + '<label>บรรทัดรอง (IP ฯลฯ)<input value="' + esc(d.sub) + '" oninput="inspDev(\\'sub\\',this.value)"></label>'
      + colorSel
      + '</div></div>';
  } else {
    var l = findLink(selection.id);
    if (!l){ el.innerHTML = ""; return; }
    var a = findDev(l.from), b = findDev(l.to);
    el.innerHTML = '<div class="insp-card">'
      + '<div class="insp-head"><span class="insp-badge">เส้นเชื่อม</span>'
      + '<span style="font-size:13px;color:var(--ink-2)">' + esc((a ? a.name : "?") + " → " + (b ? b.name : "?")) + '</span>'
      + '<span class="insp-actions"><button class="danger-btn" type="button" onclick="deleteSelection()">🗑 ลบเส้น</button></span></div>'
      + '<div class="insp-grid3" style="margin-bottom:8px">'
      + '<label>สีเส้น<select onchange="inspLink(\\'style\\',this.value)">'
      + '<option value="red" ' + (l.style === "red" ? "selected" : "") + '>แดง (ลิงก์ลูกค้า)</option>'
      + '<option value="blue" ' + (l.style === "blue" ? "selected" : "") + '>ฟ้า (ภายใน)</option>'
      + '<option value="green" ' + (l.style === "green" ? "selected" : "") + '>เขียว (media เจ้าอื่น)</option>'
      + '<option value="backup" ' + (l.style === "backup" ? "selected" : "") + '>ส้มประ (Backup)</option>'
      + '</select></label>'
      + '<label>แนวเส้น<select onchange="inspCurve(this.value)">'
      + '<option value="auto" ' + (l.curve === "auto" || l.curve == null ? "selected" : "") + '>อัตโนมัติ (หลบอุปกรณ์)</option>'
      + '<option value="0" ' + (l.curve === 0 ? "selected" : "") + '>บังคับตรง</option>'
      + '<option value="-70" ' + (l.curve === -70 ? "selected" : "") + '>โค้งขึ้น</option>'
      + '<option value="70" ' + (l.curve === 70 ? "selected" : "") + '>โค้งลง</option>'
      + '</select></label>'
      + '<label>VLAN ของเส้นนี้<input value="' + esc(l.vlan || "") + '" oninput="inspLink(\\'vlan\\',this.value)" placeholder="เช่น 214"></label>'
      + '</div>'
      + '<div class="insp-grid3">'
      + '<label>ป้ายฝั่งต้น (port)<input value="' + esc(l.labelA) + '" oninput="inspLink(\\'labelA\\',this.value)"></label>'
      + '<label>ป้ายกลาง (IP)<input value="' + esc(l.labelMid) + '" oninput="inspLink(\\'labelMid\\',this.value)"></label>'
      + '<label>ป้ายฝั่งปลาย (port)<input value="' + esc(l.labelB) + '" oninput="inspLink(\\'labelB\\',this.value)"></label>'
      + '</div></div>';
  }
}

function inspDev(key, val){
  var d = selection && findDev(selection.id);
  if (!d) return;
  d[key] = val;
  render();
  if (key === "color") buildInspector();
}
function inspLink(key, val){
  var l = selection && findLink(selection.id);
  if (l){ l[key] = val; render(); }
}
function inspCurve(val){
  inspLink("curve", val === "auto" ? "auto" : Number(val));
}

function startConnect(){
  if (!selection || selection.kind !== "device") return;
  connecting = { fromId: selection.id, x: null, y: null };
  banner(true);
  render();
}

function svgDefs(){
  var s = '<defs>'
    + '<linearGradient id="rtTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2e8"/><stop offset="1" stop-color="#4d89cf"/></linearGradient>'
    + '<linearGradient id="rtSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d76c4"/><stop offset="1" stop-color="#255693"/></linearGradient>'
    + '<linearGradient id="boxFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c86cf"/><stop offset="1" stop-color="#2c5fa3"/></linearGradient>'
    + '<linearGradient id="boxTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8cbee"/><stop offset="1" stop-color="#6ba0d8"/></linearGradient>'
    + '<linearGradient id="boxSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#37699f"/><stop offset="1" stop-color="#234b7a"/></linearGradient>'
    + '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#1a3a5c" flood-opacity="0.25"/></filter>';
  Object.keys(CLOUD_COLORS).forEach(function(k){
    var c = CLOUD_COLORS[k];
    s += '<radialGradient id="cg_' + k + '" cx="0.4" cy="0.32" r="0.85">'
      + '<stop offset="0" stop-color="' + c.g1 + '"/><stop offset="1" stop-color="' + c.g2 + '"/></radialGradient>';
  });
  return s + '</defs>';
}

var HALO = ' stroke="#ffffff" stroke-width="4" paint-order="stroke" stroke-linejoin="round"';

function routerSvg(d){
  var arrows = "";
  for (var i = 0; i < 4; i++){
    arrows += '<g transform="rotate(' + (i * 90) + ')">'
      + '<line x1="7" y1="0" x2="24" y2="0" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>'
      + '<path d="M22,-8 L38,0 L22,8 Z" fill="#fff"/></g>';
  }
  return '<g filter="url(#soft)">'
    + '<path d="M-48,-6 L-48,14 A48,17 0 0 0 48,14 L48,-6 A48,17 0 0 1 -48,-6 Z" fill="url(#rtSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<ellipse cx="0" cy="-6" rx="48" ry="17" fill="url(#rtTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<g transform="translate(0,-6) scale(1,0.35)">' + arrows + '</g></g>'
    + nameSub(d, 62);
}

function switchSvg(d){
  return '<g filter="url(#soft)">'
    + '<polygon points="-44,-16 30,-16 48,-34 -26,-34" fill="url(#boxTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<polygon points="30,-16 48,-34 48,4 30,22" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-44" y="-16" width="74" height="38" rx="2" fill="url(#boxFront)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<g stroke="#fff" stroke-width="3.6" stroke-linecap="round" fill="#fff">'
    + '<line x1="-32" y1="-6" x2="6" y2="-6"/><path d="M4,-11 L16,-6 L4,-1 Z" stroke-width="0"/>'
    + '<line x1="18" y1="12" x2="-20" y2="12"/><path d="M-18,7 L-30,12 L-18,17 Z" stroke-width="0"/>'
    + '</g></g>'
    + nameSub(d, 48);
}

function firewallSvg(d){
  var mortar = '<g stroke="#fff" stroke-width="1.8">'
    + '<line x1="-40" y1="-5" x2="30" y2="-5"/><line x1="-40" y1="6" x2="30" y2="6"/>'
    + '<line x1="-22" y1="-16" x2="-22" y2="-5"/><line x1="-4" y1="-16" x2="-4" y2="-5"/><line x1="14" y1="-16" x2="14" y2="-5"/>'
    + '<line x1="-31" y1="-5" x2="-31" y2="6"/><line x1="-13" y1="-5" x2="-13" y2="6"/><line x1="5" y1="-5" x2="5" y2="6"/><line x1="23" y1="-5" x2="23" y2="6"/>'
    + '<line x1="-22" y1="6" x2="-22" y2="18"/><line x1="-4" y1="6" x2="-4" y2="18"/><line x1="14" y1="6" x2="14" y2="18"/>'
    + '</g>';
  return '<g filter="url(#soft)">'
    + '<polygon points="-40,-16 30,-16 46,-31 -24,-31" fill="#eab68d" stroke="#8f3f1c" stroke-width="1.5"/>'
    + '<polygon points="30,-16 46,-31 46,3 30,18" fill="#b35a2f" stroke="#8f3f1c" stroke-width="1.5"/>'
    + '<rect x="-40" y="-16" width="70" height="34" rx="2" fill="#d97742" stroke="#8f3f1c" stroke-width="1.5"/>'
    + mortar
    + '</g>'
    + nameSub(d, 44);
}

function apSvg(d){
  return '<g filter="url(#soft)">'
    + '<path d="M-34,2 L-34,10 A34,11 0 0 0 34,10 L34,2 A34,11 0 0 1 -34,2 Z" fill="url(#rtSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<ellipse cx="0" cy="2" rx="34" ry="11" fill="url(#rtTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<circle cx="0" cy="1" r="3.4" fill="#fff"/>'
    + '<path d="M-12,-9 A17,17 0 0 1 12,-9" fill="none" stroke="#3d76c4" stroke-width="4.5" stroke-linecap="round"/>'
    + '<path d="M-21,-17 A30,30 0 0 1 21,-17" fill="none" stroke="#3d76c4" stroke-width="4.5" stroke-linecap="round" opacity="0.75"/>'
    + '</g>'
    + nameSub(d, 40);
}

function serverSvg(d){
  return '<g filter="url(#soft)">'
    + '<polygon points="-22,-42 12,-42 24,-54 -10,-54" fill="url(#boxTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<polygon points="12,-42 24,-54 24,28 12,40" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-22" y="-42" width="34" height="82" rx="2" fill="url(#boxFront)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-17" y="-33" width="24" height="6" rx="1.5" fill="#a8cbee"/>'
    + '<rect x="-17" y="-21" width="24" height="6" rx="1.5" fill="#a8cbee"/>'
    + '<rect x="-17" y="-9" width="24" height="6" rx="1.5" fill="#a8cbee"/>'
    + '<circle cx="-13" cy="20" r="2.6" fill="#7ef29b"/>'
    + '<circle cx="-4" cy="20" r="2.6" fill="#ffd166"/>'
    + '</g>'
    + '<text y="66" text-anchor="middle" font-size="17" font-weight="700" fill="#111"' + HALO + '>' + esc(d.name) + '</text>'
    + (d.sub ? '<text y="88" text-anchor="middle" font-size="15" fill="#333"' + HALO + '>' + esc(d.sub) + '</text>' : "");
}

function cctvSvg(d){
  return '<g filter="url(#soft)">'
    + '<rect x="-4" y="8" width="8" height="16" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.2"/>'
    + '<ellipse cx="0" cy="25" rx="14" ry="4.5" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.2"/>'
    + '<polygon points="-30,-14 22,-14 32,-24 -20,-24" fill="url(#boxTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<polygon points="22,-14 32,-24 32,-2 22,8" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-30" y="-14" width="52" height="22" rx="4" fill="url(#boxFront)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<circle cx="28" cy="-3" r="8" fill="#12365c" stroke="#a8cbee" stroke-width="2"/>'
    + '<circle cx="30" cy="-5" r="2.2" fill="#fff"/>'
    + '<circle cx="-24" cy="-9" r="2.2" fill="#ff6b6b"/>'
    + '</g>'
    + nameSub(d, 48);
}

function ipphoneSvg(d){
  return '<g filter="url(#soft)">'
    + '<polygon points="-14,-18 34,-18 40,-24 -8,-24" fill="url(#boxTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<polygon points="34,-18 40,-24 40,12 34,18" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-14" y="-18" width="48" height="36" rx="4" fill="url(#boxFront)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-8" y="-12" width="18" height="12" rx="2" fill="#d7e7f7"/>'
    + '<circle cx="16" cy="6" r="2" fill="#fff"/><circle cx="23" cy="6" r="2" fill="#fff"/><circle cx="30" cy="6" r="2" fill="#fff"/>'
    + '<circle cx="16" cy="12" r="2" fill="#fff"/><circle cx="23" cy="12" r="2" fill="#fff"/><circle cx="30" cy="12" r="2" fill="#fff"/>'
    + '<rect x="-36" y="-20" width="15" height="38" rx="7.5" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<circle cx="-28.5" cy="-13" r="3" fill="#a8cbee"/>'
    + '<circle cx="-28.5" cy="11" r="3" fill="#a8cbee"/>'
    + '</g>'
    + nameSub(d, 44);
}

function gatewaySvg(d){
  return '<g filter="url(#soft)">'
    + '<polygon points="-25,-48 13,-48 27,-62 -11,-62" fill="url(#boxTop)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<polygon points="13,-48 27,-62 27,32 13,46" fill="url(#boxSide)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<rect x="-25" y="-48" width="38" height="94" rx="2" fill="url(#boxFront)" stroke="#1d4f92" stroke-width="1.5"/>'
    + '<path d="M-15,-26 Q6,-20 0,-2" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M-4,-6 L1,6 L7,-6 Z" fill="#fff" transform="rotate(14 1 0)"/>'
    + '<path d="M3,24 Q-18,18 -12,0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M-16,4 L-11,-8 L-5,4 Z" fill="#fff" transform="rotate(14 -11 -2)"/></g>'
    + '<text y="72" text-anchor="middle" font-size="19" font-weight="700" fill="#111"' + HALO + '>' + esc(d.name) + '</text>'
    + '<text y="94" text-anchor="middle" font-size="19" font-weight="700" fill="#111"' + HALO + '>' + esc(d.sub) + '</text>';
}

function mixWhite(hex, t){
  var n = parseInt(hex.slice(1), 16);
  var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * t); g = Math.round(g + (255 - g) * t); b = Math.round(b + (255 - b) * t);
  return "rgb(" + r + "," + g + "," + b + ")";
}
function shadeHex(hex, f){
  var n = parseInt(hex.slice(1), 16);
  var r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return "rgb(" + r + "," + g + "," + b + ")";
}

function cloudSvg(d){
  var media = d.type === "mediacloud";
  var scale = media ? 0.75 : 1.4;
  var c, fillVal;
  if (d.color === "custom"){
    var hex = d.customHex || "#4a90d9";
    fillVal = mixWhite(hex, 0.78);
    c = { stroke: hex, text: shadeHex(hex, 0.45) };
  } else {
    c = CLOUD_COLORS[d.color] || CLOUD_COLORS.blue;
    fillVal = "url(#cg_" + (d.color || "blue") + ")";
  }
  var out = '<g transform="scale(' + scale + ')">'
    + '<path d="M -120 40 C -170 40 -170 -30 -115 -28 C -110 -75 -40 -85 -15 -50 C 5 -95 90 -85 95 -35 C 150 -40 160 30 105 42 C 100 65 60 72 40 58 C 20 80 -30 80 -50 60 C -75 78 -115 65 -120 40 Z"'
    + ' fill="' + fillVal + '" stroke="' + c.stroke + '" stroke-width="3"/></g>';
  var parts = String(d.name).trim().split(" ");
  var size = media ? 20 : 32;
  if (parts.length > 1){
    out += '<text y="-4" text-anchor="middle" font-size="' + size + '" font-weight="800" font-family="Georgia,serif" fill="' + c.text + '">' + esc(parts[0]) + '</text>';
    out += '<text y="' + (size + 4) + '" text-anchor="middle" font-size="' + size + '" font-weight="800" font-family="Georgia,serif" fill="' + c.text + '">' + esc(parts.slice(1).join(" ")) + '</text>';
  } else {
    out += '<text y="' + (size * 0.35) + '" text-anchor="middle" font-size="' + size + '" font-weight="800" font-family="Georgia,serif" fill="' + c.text + '">' + esc(parts[0] || "") + '</text>';
  }
  if (d.sub){
    out += '<text y="' + (media ? 58 : 88) + '" text-anchor="middle" font-size="13" fill="' + c.text + '">' + esc(d.sub) + '</text>';
  }
  return out;
}

function boxSvg(d){
  var w = d.w || 320, h = d.h || 200;
  return '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" fill="none" stroke="#555" stroke-width="1.6" stroke-dasharray="7,5" rx="8"/>'
    + '<text x="' + (-w / 2 + 10) + '" y="' + (-h / 2 - 12) + '" font-size="22" font-weight="700" fill="#d02b2b"' + HALO + '>' + esc(d.name) + '</text>';
}

function nameSub(d, dy){
  return '<text y="' + dy + '" text-anchor="middle" font-size="17" font-weight="700" fill="#111"' + HALO + '>' + esc(d.name) + '</text>'
    + (d.sub ? '<text y="' + (dy + 22) + '" text-anchor="middle" font-size="15" fill="#333"' + HALO + '>' + esc(d.sub) + '</text>' : "");
}

function deviceExtras(d){
  var isSel = selection && selection.kind === "device" && selection.id === d.id;
  if (!isSel) return "";
  var s = "";
  var color = "#2563c9";
  if (d.type === "box"){
    var w = d.w || 320, h = d.h || 200;
    s += '<rect x="' + (-w / 2 - 8) + '" y="' + (-h / 2 - 8) + '" width="' + (w + 16) + '" height="' + (h + 16) + '" rx="12" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-dasharray="6,5"/>';
    s += '<circle data-resize="1" cx="' + (w / 2) + '" cy="' + (h / 2) + '" r="11" fill="' + color + '" style="cursor:nwse-resize"/>'
      + '<path d="M' + (w / 2 - 4) + ',' + (h / 2 + 4) + ' L' + (w / 2 + 4) + ',' + (h / 2 - 4) + '" stroke="#fff" stroke-width="2"/>';
  } else {
    var r = TYPE_META[d.type].r + 8;
    s += '<circle r="' + r + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-dasharray="6,5"/>';
    s += '<g data-connect="1" transform="translate(' + (r + 26) + ',0)" style="cursor:crosshair">'
      + '<circle r="34" fill="transparent"/>'
      + '<circle r="18" fill="#1f6f6b"/>'
      + '<path d="M-8,0 H8 M0,-8 V8" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>';
  }
  return s;
}

function deviceSvg(d){
  var inner;
  if (d.type === "router") inner = routerSvg(d);
  else if (d.type === "switch") inner = switchSvg(d);
  else if (d.type === "firewall") inner = firewallSvg(d);
  else if (d.type === "ap") inner = apSvg(d);
  else if (d.type === "gateway") inner = gatewaySvg(d);
  else if (d.type === "server") inner = serverSvg(d);
  else if (d.type === "cctv") inner = cctvSvg(d);
  else if (d.type === "ipphone") inner = ipphoneSvg(d);
  else if (d.type === "cloud" || d.type === "mediacloud") inner = cloudSvg(d);
  else inner = boxSvg(d);
  var hit;
  if (d.type === "box"){
    var w = d.w || 320, h = d.h || 200;
    hit = '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" fill="transparent"/>';
  } else {
    hit = '<circle r="' + TYPE_META[d.type].r + '" fill="transparent"/>';
  }
  return '<g data-id="' + d.id + '" transform="translate(' + d.x + ',' + d.y + ')" style="cursor:grab">'
    + hit + inner + deviceExtras(d) + '</g>';
}

function linkOffsets(){
  var groups = {};
  state.links.forEach(function(l){
    var key = Math.min(l.from, l.to) + "-" + Math.max(l.from, l.to);
    (groups[key] = groups[key] || []).push(l.id);
  });
  var map = {};
  Object.keys(groups).forEach(function(key){
    var ids = groups[key];
    ids.forEach(function(id, i){
      map[id] = ids.length > 1 ? (i - (ids.length - 1) / 2) * 56 : 0;
    });
  });
  return map;
}

function polyAt(pts, t){
  var total = 0, lens = [];
  for (var i = 0; i < pts.length - 1; i++){
    var dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    var L = Math.sqrt(dx * dx + dy * dy);
    lens.push(L); total += L;
  }
  var target = Math.max(0, Math.min(1, t)) * total;
  for (var j = 0; j < lens.length; j++){
    if (target <= lens[j] || j === lens.length - 1){
      var u = lens[j] ? target / lens[j] : 0;
      return { x: pts[j].x + (pts[j + 1].x - pts[j].x) * u, y: pts[j].y + (pts[j + 1].y - pts[j].y) * u };
    }
    target -= lens[j];
  }
  return pts[pts.length - 1];
}

// เส้นหลบแบบหักเหลี่ยม 45°: ตรง → เฉียงออก → ขนานแนวเดิม → เฉียงกลับ → ตรง
// (แทนเส้นโค้ง bezier เดิม) ถ้าเส้นสั้นเกินจะหักยอดเดียวตรงกลางแทน
function bendPts(p0, p1, px, py, off){
  if (!off) return [p0, p1];
  var dx = p1.x - p0.x, dy = p1.y - p0.y;
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var ux = dx / len, uy = dy / len;
  var a = Math.abs(off);
  var h = Math.max(46, a * 0.8);
  var s1 = len / 2 - h - a, s2 = len / 2 + h + a;
  function P(s, o){ return { x: p0.x + ux * s + px * o, y: p0.y + uy * s + py * o }; }
  if (s1 < 12) return [p0, P(len / 2, off), p1];
  return [p0, P(s1, 0), P(s1 + a, off), P(s2 - a, off), P(s2, 0), p1];
}

function autoAvoidOffset(l, p0, p1, px, py, base){
  var obstacles = state.devices.filter(function(d){
    return d.id !== l.from && d.id !== l.to
      && d.type !== "box" && d.type !== "cloud" && d.type !== "mediacloud";
  });
  if (!obstacles.length) return base;

  function clears(off){
    var pts = bendPts(p0, p1, px, py, off);
    for (var oi = 0; oi < obstacles.length; oi++){
      var d = obstacles[oi];
      var rr = TYPE_META[d.type].r + 16;
      for (var i = 0; i <= 24; i++){
        var p = polyAt(pts, i / 24);
        var dx = p.x - d.x, dy = p.y - d.y;
        if (dx * dx + dy * dy < rr * rr) return false;
      }
    }
    return true;
  }

  var candidates = [base];
  [50, 100, 150, 210, 280].forEach(function(s){
    candidates.push(base - s, base + s);
  });
  for (var i = 0; i < candidates.length; i++){
    if (clears(candidates[i])) return candidates[i];
  }
  return base;
}

function linkGeom(l, autoOffset){
  var a = findDev(l.from), b = findDev(l.to);
  if (!a || !b) return null;
  var st = LINK_STYLES[l.style] || LINK_STYLES.red;
  var dx = b.x - a.x, dy = b.y - a.y;
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var ux = dx / len, uy = dy / len;
  var ra = a.type === "box" ? 0 : TYPE_META[a.type].r * 0.7;
  var rb = b.type === "box" ? 0 : TYPE_META[b.type].r * 0.7;
  if (ra + rb > len - 20){ ra = 0; rb = 0; }
  var p0 = { x: a.x + ux * ra, y: a.y + uy * ra };
  var p1 = { x: b.x - ux * rb, y: b.y - uy * rb };

  var px = -uy, py = ux;
  // เส้นคู่ขนาน: เลื่อนทั้งเส้นตามแนวตั้งฉาก ให้เป็นเส้นตรงขนานกันจริง ๆ
  // (เดิมดันจุดควบคุมกลางเส้น ทำให้บวมเป็นเส้นโค้งคนละทิศ)
  if (autoOffset){
    p0.x += px * autoOffset; p0.y += py * autoOffset;
    p1.x += px * autoOffset; p1.y += py * autoOffset;
  }
  var off;
  if (l.curve === "auto" || l.curve == null){
    off = autoAvoidOffset(l, p0, p1, px, py, 0);
  } else {
    off = Number(l.curve) || 0;
  }
  var pts = bendPts(p0, p1, px, py, off);
  var path = 'M' + pts[0].x + ',' + pts[0].y;
  for (var pi = 1; pi < pts.length; pi++) path += ' L' + pts[pi].x + ',' + pts[pi].y;
  return {
    st: st, p0: p0, p1: p1, px: px, py: py, path: path,
    at: function(t){ return polyAt(pts, t); },
  };
}

function linkStrokeSvg(l, g){
  var isSel = selection && selection.kind === "link" && selection.id === l.id;
  var s = "";
  if (isSel){
    s += '<path d="' + g.path + '" fill="none" stroke="#2563c9" stroke-width="' + (g.st.width + 8) + '" opacity="0.3"/>';
  }
  s += '<path d="' + g.path + '" fill="none" stroke="' + g.st.stroke + '" stroke-width="' + g.st.width + '"'
    + (g.st.dash ? ' stroke-dasharray="' + g.st.dash + '"' : "") + '/>';
  s += '<path data-link-id="' + l.id + '" d="' + g.path + '" fill="none" stroke="transparent" stroke-width="26" style="cursor:pointer"/>';
  return s;
}

function linkLabelsSvg(l, g){
  function lab(t, text, size, color){
    if (!text) return "";
    var p = g.at(t);
    return '<text x="' + (p.x + g.px * -18) + '" y="' + (p.y + g.py * -18) + '" text-anchor="middle" font-size="' + size + '" fill="' + color + '"' + HALO + '>' + esc(text) + '</text>';
  }
  var s = lab(0.18, l.labelA, 14, "#333")
    + lab(0.5, l.labelMid, 15, "#111")
    + lab(0.82, l.labelB, 14, "#333");

  if (l.vlan){
    var vt = "VLAN " + l.vlan;
    var w = vt.length * 8.5 + 18;
    var p = g.at(0.5);
    var cx = p.x + g.px * 24, cy = p.y + g.py * 24;
    s += '<g transform="translate(' + cx + ',' + cy + ')">'
      + '<rect x="' + (-w / 2) + '" y="-12" width="' + w + '" height="24" rx="12" fill="#eef4fb" stroke="#8fb8dd" stroke-width="1.5"/>'
      + '<text y="4.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="#24466b">' + esc(vt) + '</text></g>';
  }
  return s;
}

function titleBlock(){
  var s = '<text x="640" y="34" text-anchor="middle" font-size="17" fill="#111">' + esc(v("cid") + " " + v("customer")) + '</text>'
    + '<text x="640" y="56" text-anchor="middle" font-size="16" fill="#111">:' + esc(v("cid")) + '</text>';
  if (String(v("vlan")).trim()){
    s += '<text x="640" y="78" text-anchor="middle" font-size="16" fill="#111">VLAN ' + esc(v("vlan")) + '</text>';
  }
  return s;
}

function render(){
  var s = svgDefs() + '<rect width="1280" height="660" fill="#ffffff"/>' + titleBlock();
  var offsets = linkOffsets();

  var geoms = [];
  state.links.forEach(function(l){
    var g = linkGeom(l, offsets[l.id]);
    if (g) geoms.push([l, g]);
  });

  state.devices.filter(function(d){ return d.type === "box"; }).forEach(function(d){ s += deviceSvg(d); });
  geoms.forEach(function(pair){ s += linkStrokeSvg(pair[0], pair[1]); });
  state.devices.filter(function(d){ return d.type === "cloud" || d.type === "mediacloud"; }).forEach(function(d){ s += deviceSvg(d); });
  state.devices.filter(function(d){ return d.type !== "box" && d.type !== "cloud" && d.type !== "mediacloud"; }).forEach(function(d){ s += deviceSvg(d); });
  s += '<g pointer-events="none">';
  geoms.forEach(function(pair){ s += linkLabelsSvg(pair[0], pair[1]); });

  if (connecting && connecting.x != null){
    var from = findDev(connecting.fromId);
    var tgt = connecting.targetId != null ? findDev(connecting.targetId) : null;
    if (from){
      var ex = tgt ? tgt.x : connecting.x, ey = tgt ? tgt.y : connecting.y;
      if (tgt){
        s += '<circle cx="' + tgt.x + '" cy="' + tgt.y + '" r="' + (TYPE_META[tgt.type].r + 12)
          + '" fill="none" stroke="#1f6f6b" stroke-width="5" opacity="0.85"/>';
      }
      s += '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + ex + '" y2="' + ey
        + '" stroke="#1f6f6b" stroke-width="4" stroke-dasharray="8,6" opacity="0.8"/>';
    }
  }
  s += '</g>';
  document.getElementById("dia").innerHTML = s;
}

var svgEl = document.getElementById("dia");
var pointer = null;
var resizing = null;

function toSvgXY(evt){
  var r = svgEl.getBoundingClientRect();
  return { x: (evt.clientX - r.left) * 1280 / r.width, y: (evt.clientY - r.top) * 660 / r.height };
}
function banner(show){
  document.getElementById("mode-banner").style.display = show ? "block" : "none";
}
function snapTarget(x, y, fromId){
  var best = null, bestDist = Infinity;
  state.devices.forEach(function(d){
    if (d.id === fromId || d.type === "box") return;
    var dist = Math.sqrt((d.x - x) * (d.x - x) + (d.y - y) * (d.y - y)) - TYPE_META[d.type].r;
    if (dist < bestDist){ bestDist = dist; best = d; }
  });
  return bestDist <= 80 ? best : null;
}

svgEl.addEventListener("pointerdown", function(e){
  var p = toSvgXY(e);

  if (e.target.closest("[data-resize]")){
    var g = e.target.closest("g[data-id]");
    var d = findDev(Number(g.getAttribute("data-id")));
    if (d){
      pushUndo();
      resizing = { d: d, left: d.x - (d.w || 320) / 2, top: d.y - (d.h || 200) / 2 };
      svgEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    return;
  }

  if (e.target.closest("[data-connect]")){
    var g2 = e.target.closest("g[data-id]");
    connecting = { fromId: Number(g2.getAttribute("data-id")), x: p.x, y: p.y, targetId: null };
    banner(true);
    svgEl.setPointerCapture(e.pointerId);
    e.preventDefault();
    render();
    return;
  }

  var linkEl = e.target.closest("[data-link-id]");
  if (linkEl){
    select("link", Number(linkEl.getAttribute("data-link-id")));
    render();
    return;
  }

  var gg = e.target.closest("g[data-id]");
  if (!gg){ select(null); render(); return; }

  var id = Number(gg.getAttribute("data-id"));
  var d2 = findDev(id);
  if (!d2) return;
  pointer = { devId: id, dx: p.x - d2.x, dy: p.y - d2.y, sx: e.clientX, sy: e.clientY, moved: false, pushed: false };
  svgEl.setPointerCapture(e.pointerId);
  e.preventDefault();
});

svgEl.addEventListener("pointermove", function(e){
  var p = toSvgXY(e);

  if (resizing){
    var d = resizing.d;
    var newW = Math.max(160, Math.min(1100, p.x - resizing.left));
    var newH = Math.max(120, Math.min(540, p.y - resizing.top));
    d.w = Math.round(newW); d.h = Math.round(newH);
    d.x = Math.round(resizing.left + newW / 2);
    d.y = Math.round(resizing.top + newH / 2);
    render();
    return;
  }

  if (connecting){
    connecting.x = p.x; connecting.y = p.y;
    var t = snapTarget(p.x, p.y, connecting.fromId);
    connecting.targetId = t ? t.id : null;
    render();
    return;
  }

  if (!pointer) return;
  var d2 = findDev(pointer.devId);
  if (!d2) return;
  var nx = Math.round(Math.max(20, Math.min(1260, p.x - pointer.dx)));
  var ny = Math.round(Math.max(90, Math.min(640, p.y - pointer.dy)));
  if (Math.abs(e.clientX - pointer.sx) > 6 || Math.abs(e.clientY - pointer.sy) > 6){
    if (!pointer.pushed){ pushUndo(); pointer.pushed = true; }
    pointer.moved = true;
  }
  if (pointer.moved){ d2.x = nx; d2.y = ny; render(); }
});

svgEl.addEventListener("pointerup", function(e){
  if (resizing){ resizing = null; return; }

  if (connecting){
    var p2 = toSvgXY(e);
    var from = findDev(connecting.fromId);
    var target = snapTarget(p2.x, p2.y, connecting.fromId);
    var fromId = connecting.fromId;
    connecting = null;
    pointer = null;
    banner(false);
    if (from && target){
      pushUndo();
      var isCloud = from.type.indexOf("cloud") >= 0 || target.type.indexOf("cloud") >= 0;
      var l = addLink({ from: fromId, to: target.id, style: isCloud ? "blue" : "red" });
      select("link", l.id);
    }
    render();
    return;
  }

  if (!pointer) return;
  var id = pointer.devId, moved = pointer.moved;
  pointer = null;
  if (moved) return;
  select("device", id);
  render();
});

svgEl.addEventListener("pointercancel", function(){
  pointer = null; resizing = null;
  if (connecting){ connecting = null; banner(false); render(); }
});

document.addEventListener("keydown", function(e){
  var tag = (document.activeElement && document.activeElement.tagName) || "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if ((e.key === "Delete" || e.key === "Backspace") && selection){ e.preventDefault(); deleteSelection(); }
  if (e.key === "Escape" && connecting){ connecting = null; banner(false); render(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z"){ e.preventDefault(); undo(); }
});

function svgText(){
  var keepSel = selection, keepConn = connecting;
  selection = null; connecting = null;
  render();
  var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 660" font-family="Segoe UI, Noto Sans Thai, sans-serif">'
    + svgEl.innerHTML + '<' + '/svg>';
  selection = keepSel; connecting = keepConn;
  render();
  return out;
}
function downloadSVG(){
  var blob = new Blob([svgText()], { type: "image/svg+xml" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (v("cid") || "diagram") + "-diagram.svg";
  a.click();
}
function downloadPNG(){
  var img = new Image();
  var blob = new Blob([svgText()], { type: "image/svg+xml" });
  img.onload = function(){
    var c = document.createElement("canvas");
    c.width = 2560; c.height = 1320;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(function(b){
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = (v("cid") || "diagram") + "-diagram.png";
      a.click();
    }, "image/png");
  };
  img.src = URL.createObjectURL(blob);
}

function prepareSave(){
  document.getElementById("dg-data").value = JSON.stringify({
    devices: state.devices,
    links: state.links,
    seq: state.seq,
    meta: { cid: v("cid"), vlan: v("vlan"), customer: v("customer") },
  });
  document.getElementById("dg-cid-hidden").value = v("cid");
  return true;
}

["cid", "vlan", "customer"].forEach(function(id){
  document.getElementById(id).addEventListener("input", render);
});

// โหลดข้อมูลเดิม (แก้ไข) หรือเริ่มจากตัวอย่าง DIA (สร้างใหม่)
(function init(){
  var raw = document.getElementById("dg-init").textContent;
  var data = null;
  try { data = JSON.parse(raw); } catch (e) {}

  if (data && Array.isArray(data.devices)){
    var maxId = 0;
    data.devices.concat(data.links || []).forEach(function(x){ if (x.id > maxId) maxId = x.id; });
    state = {
      devices: data.devices,
      links: data.links || [],
      seq: Math.max(Number(data.seq) || 0, maxId + 1),
    };
    var meta = data.meta || {};
    document.getElementById("cid").value = meta.cid || "";
    document.getElementById("vlan").value = meta.vlan || "";
    document.getElementById("customer").value = meta.customer || "";
    render();
  } else {
    document.getElementById("cid").value = "C0000";
    document.getElementById("vlan").value = "";
    document.getElementById("customer").value = "ชื่อลูกค้า";
    presetDIA();
  }
  undoStack = [];
})();
  </script>
</body>
</html>
`;
}

function showMessage(error, success) {
  if (success === "saved") return `<div class="alert success">บันทึก diagram แล้ว</div>`;
  if (error === "data") return `<div class="alert error">ข้อมูล diagram ไม่ถูกต้องหรือใหญ่เกินไป</div>`;
  if (error === "denied") return `<div class="alert error">คุณไม่มีสิทธิ์แก้ไข diagram นี้</div>`;
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
