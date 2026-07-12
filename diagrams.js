// diagrams.js — Network Diagram Builder: บันทึก/โหลด/ลบ/โคลน
// สิทธิ์: ทุกคนเห็นทุก diagram (เอกสารวงจรของทีม) / แก้-ลบได้เฉพาะเจ้าของ + staff/admin
// คนอื่นเปิดดูได้และ "บันทึกเป็นสำเนา" ของตัวเองได้เสมอ

function redirect(request, path) {
  const url = new URL(request.url);
  url.pathname = path.split("?")[0];
  const query = path.includes("?") ? path.split("?")[1] : "";
  url.search = query ? "?" + query : "";
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

function isSenior(user) {
  return user.role === "staff" || user.role === "admin";
}

export function canEditDiagram(user, diagram) {
  return diagram.owner_id === user.id || isSenior(user);
}

export async function loadDiagramList(env) {
  const result = await env.DB
    .prepare(
      `SELECT diagrams.id, diagrams.title, diagrams.cid, diagrams.owner_id, diagrams.updated_at,
              users.full_name AS owner_name
       FROM diagrams JOIN users ON users.id = diagrams.owner_id
       ORDER BY diagrams.updated_at DESC, diagrams.id DESC`
    )
    .all();
  return result.results || [];
}

export async function loadDiagram(env, id) {
  if (!Number(id)) return null;
  return await env.DB
    .prepare("SELECT * FROM diagrams WHERE id = ? LIMIT 1")
    .bind(Number(id))
    .first();
}

export async function handleSaveDiagram(request, env, user) {
  const formData = await request.formData();
  const diagramId = Number(String(formData.get("diagram_id") || "").trim()) || 0;
  let title = String(formData.get("title") || "").trim().slice(0, 120);
  const cid = String(formData.get("cid") || "").trim().slice(0, 40);
  const dataJson = String(formData.get("data_json") || "");

  if (!dataJson || dataJson.length > 300000) {
    return redirect(request, "/diagrams?error=data");
  }

  try {
    const parsed = JSON.parse(dataJson);
    if (!parsed || !Array.isArray(parsed.devices) || !Array.isArray(parsed.links)) {
      throw new Error("bad shape");
    }
  } catch (err) {
    return redirect(request, "/diagrams?error=data");
  }

  if (!title) title = cid ? `Diagram ${cid}` : "Untitled";

  if (diagramId) {
    const diagram = await loadDiagram(env, diagramId);
    if (!diagram || !canEditDiagram(user, diagram)) {
      return redirect(request, "/diagrams?error=denied");
    }
    await env.DB
      .prepare(
        "UPDATE diagrams SET title = ?, cid = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(title, cid, dataJson, diagramId)
      .run();
    return redirect(request, `/diagrams/edit?id=${diagramId}&success=saved`);
  }

  const inserted = await env.DB
    .prepare("INSERT INTO diagrams (owner_id, title, cid, data_json) VALUES (?, ?, ?, ?)")
    .bind(user.id, title, cid, dataJson)
    .run();

  return redirect(request, `/diagrams/edit?id=${inserted.meta.last_row_id}&success=saved`);
}

export async function handleDeleteDiagram(request, env, user) {
  const formData = await request.formData();
  const diagramId = Number(String(formData.get("diagram_id") || "").trim());

  const diagram = await loadDiagram(env, diagramId);
  if (!diagram || !canEditDiagram(user, diagram)) {
    return redirect(request, "/diagrams?error=denied");
  }

  await env.DB.prepare("DELETE FROM diagrams WHERE id = ?").bind(diagramId).run();
  return redirect(request, "/diagrams?success=deleted");
}

export async function handleCloneDiagram(request, env, user) {
  const formData = await request.formData();
  const diagramId = Number(String(formData.get("diagram_id") || "").trim());

  const diagram = await loadDiagram(env, diagramId);
  if (!diagram) return redirect(request, "/diagrams?error=denied");

  const inserted = await env.DB
    .prepare("INSERT INTO diagrams (owner_id, title, cid, data_json) VALUES (?, ?, ?, ?)")
    .bind(user.id, `${diagram.title} (copy)`.slice(0, 120), diagram.cid, diagram.data_json)
    .run();

  return redirect(request, `/diagrams/edit?id=${inserted.meta.last_row_id}&success=saved`);
}
