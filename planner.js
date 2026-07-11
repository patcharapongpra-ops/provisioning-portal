// planner.js
// ตรรกะฝั่ง worker สำหรับ "คลังชนิดงาน" (ของแต่ละคน) + seed ชุดเริ่มต้น
// ใช้ helper html()/redirect() แบบเดียวกับ worker.js (ประกาศซ้ำในไฟล์นี้ให้ standalone)

// ---------- helpers (เหมือน worker.js) ----------
function html(content) {
  return new Response(content, {
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}

function redirect(request, path) {
  const url = new URL(request.url);
  url.pathname = path.split("?")[0];
  const query = path.includes("?") ? path.split("?")[1] : "";
  url.search = query ? "?" + query : "";
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

// ---------- categories (ของกลาง) ----------
export async function getCategories(env) {
  const result = await env.DB
    .prepare(
      "SELECT id, key, name FROM job_categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
    )
    .all();
  return result.results || [];
}

// ---------- seed ชุดเริ่มต้นให้ user (ครั้งเดียว) ----------
const STARTER_TYPES = [
  {
    categoryKey: "new_service",
    name: "DIA",
    steps: [
      "รับใบงาน / ตรวจสอบข้อมูล",
      "จองพอร์ต / VLAN",
      "Config อุปกรณ์",
      "ทดสอบสัญญาณ",
      "ส่งมอบ / ปิด CR",
    ],
  },
  {
    categoryKey: "new_service",
    name: "DPLC",
    steps: [
      "รับใบงาน / ตรวจสอบข้อมูล",
      "จองวงจร / เส้นทาง",
      "Config ปลายทาง A-B",
      "ทดสอบ End-to-End",
      "ส่งมอบ / ปิด CR",
    ],
  },
  {
    categoryKey: "renew",
    name: "Upgrade",
    steps: [
      "รับคำขอ Upgrade",
      "ตรวจสอบทรัพยากรปลายทาง",
      "ปรับ Config / Bandwidth",
      "ทดสอบ",
      "ปิด CR",
    ],
  },
  {
    categoryKey: "renew",
    name: "Downgrade",
    steps: ["รับคำขอ Downgrade", "ปรับ Config / Bandwidth", "ทดสอบ", "ปิด CR"],
  },
  {
    categoryKey: "renew",
    name: "Relocate",
    steps: [
      "รับคำขอย้ายจุด",
      "สำรวจ / จองทรัพยากรจุดใหม่",
      "ติดตั้ง / ย้ายวงจร",
      "ทดสอบ",
      "ส่งมอบ / ปิด CR",
    ],
  },
];

export async function ensurePlannerSeed(env, userId) {
  const already = await env.DB
    .prepare("SELECT user_id FROM planner_user_init WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first();

  if (already) return;

  const categories = await getCategories(env);
  const catByKey = {};
  categories.forEach((c) => (catByKey[c.key] = c.id));

  for (const starter of STARTER_TYPES) {
    const categoryId = catByKey[starter.categoryKey];
    if (!categoryId) continue;

    const inserted = await env.DB
      .prepare(
        `INSERT INTO job_types (owner_id, category_id, name, is_active, updated_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`
      )
      .bind(userId, categoryId, starter.name)
      .run();

    const typeId = inserted.meta.last_row_id;

    for (let i = 0; i < starter.steps.length; i++) {
      await env.DB
        .prepare(
          "INSERT INTO job_type_steps (job_type_id, name, sort_order) VALUES (?, ?, ?)"
        )
        .bind(typeId, starter.steps[i], i)
        .run();
    }
  }

  await env.DB
    .prepare("INSERT INTO planner_user_init (user_id) VALUES (?)")
    .bind(userId)
    .run();
}

// ---------- loaders ----------
export async function loadUserTypes(env, userId) {
  const result = await env.DB
    .prepare(
      `
      SELECT
        job_types.id,
        job_types.name,
        job_types.is_active,
        job_types.updated_at,
        job_categories.id   AS category_id,
        job_categories.name AS category_name,
        job_categories.sort_order AS category_sort,
        (SELECT COUNT(*) FROM job_type_steps WHERE job_type_steps.job_type_id = job_types.id) AS step_count
      FROM job_types
      JOIN job_categories ON job_categories.id = job_types.category_id
      WHERE job_types.owner_id = ?
      ORDER BY job_categories.sort_order ASC, job_types.name ASC
      `
    )
    .bind(userId)
    .all();
  return result.results || [];
}

export async function loadTypeForEdit(env, userId, typeId) {
  const type = await env.DB
    .prepare(
      "SELECT id, category_id, name, is_active FROM job_types WHERE id = ? AND owner_id = ? LIMIT 1"
    )
    .bind(Number(typeId), userId)
    .first();

  let steps = [];
  if (type) {
    const stepResult = await env.DB
      .prepare(
        "SELECT id, name, sort_order FROM job_type_steps WHERE job_type_id = ? ORDER BY sort_order ASC, id ASC"
      )
      .bind(type.id)
      .all();
    steps = stepResult.results || [];
  }

  return { type, steps };
}

// ---------- parse + save steps ----------
function parseStepsJson(stepsJson) {
  let steps;
  try {
    steps = JSON.parse(stepsJson);
  } catch (err) {
    return [];
  }
  if (!Array.isArray(steps)) return [];

  return steps
    .map((step) => (typeof step === "string" ? step : step && step.name) || "")
    .map((name) => String(name).trim())
    .filter((name) => name.length > 0);
}

async function saveTypeSteps(env, typeId, stepNames) {
  for (let i = 0; i < stepNames.length; i++) {
    await env.DB
      .prepare(
        "INSERT INTO job_type_steps (job_type_id, name, sort_order) VALUES (?, ?, ?)"
      )
      .bind(typeId, stepNames[i], i)
      .run();
  }
}

async function categoryExists(env, categoryId) {
  const row = await env.DB
    .prepare("SELECT id FROM job_categories WHERE id = ? AND is_active = 1 LIMIT 1")
    .bind(Number(categoryId))
    .first();
  return !!row;
}

// ---------- handlers ----------
export async function handleStoreType(request, env, user) {
  const formData = await request.formData();
  const categoryId = String(formData.get("category_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const stepsJson = String(formData.get("steps_json") || "").trim();
  const isActive = String(formData.get("is_active") || "1") === "1" ? 1 : 0;

  if (!categoryId || !name || !stepsJson) {
    return redirect(request, "/planner/types?error=missing");
  }
  if (!(await categoryExists(env, categoryId))) {
    return redirect(request, "/planner/types?error=category");
  }

  const steps = parseStepsJson(stepsJson);
  if (!steps.length) {
    return redirect(request, "/planner/types?error=steps");
  }

  const inserted = await env.DB
    .prepare(
      `INSERT INTO job_types (owner_id, category_id, name, is_active, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(user.id, Number(categoryId), name, isActive)
    .run();

  await saveTypeSteps(env, inserted.meta.last_row_id, steps);
  return redirect(request, "/planner/types?success=created");
}

export async function handleUpdateType(request, env, user) {
  const formData = await request.formData();
  const typeId = String(formData.get("type_id") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const stepsJson = String(formData.get("steps_json") || "").trim();
  const isActive = String(formData.get("is_active") || "1") === "1" ? 1 : 0;

  if (!typeId || !categoryId || !name || !stepsJson) {
    return redirect(request, "/planner/types?error=missing");
  }

  // ownership check
  const owned = await env.DB
    .prepare("SELECT id FROM job_types WHERE id = ? AND owner_id = ? LIMIT 1")
    .bind(Number(typeId), user.id)
    .first();
  if (!owned) return redirect(request, "/planner/types?error=notfound");

  if (!(await categoryExists(env, categoryId))) {
    return redirect(request, "/planner/types?error=category");
  }

  const steps = parseStepsJson(stepsJson);
  if (!steps.length) {
    return redirect(request, `/planner/types/edit?id=${Number(typeId)}`);
  }

  await env.DB
    .prepare(
      `UPDATE job_types
       SET category_id = ?, name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND owner_id = ?`
    )
    .bind(Number(categoryId), name, isActive, Number(typeId), user.id)
    .run();

  await env.DB
    .prepare("DELETE FROM job_type_steps WHERE job_type_id = ?")
    .bind(Number(typeId))
    .run();

  await saveTypeSteps(env, Number(typeId), steps);
  return redirect(request, "/planner/types?success=updated");
}

export async function handleToggleType(request, env, user) {
  const formData = await request.formData();
  const typeId = String(formData.get("type_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();

  if (!typeId || !["0", "1"].includes(nextStatus)) {
    return redirect(request, "/planner/types?error=toggle");
  }

  await env.DB
    .prepare(
      "UPDATE job_types SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?"
    )
    .bind(Number(nextStatus), Number(typeId), user.id)
    .run();

  return redirect(request, "/planner/types?success=updated");
}

export async function handleCloneType(request, env, user) {
  const formData = await request.formData();
  const typeId = String(formData.get("type_id") || "").trim();
  if (!typeId) return redirect(request, "/planner/types?error=notfound");

  const source = await env.DB
    .prepare(
      "SELECT id, category_id, name FROM job_types WHERE id = ? AND owner_id = ? LIMIT 1"
    )
    .bind(Number(typeId), user.id)
    .first();
  if (!source) return redirect(request, "/planner/types?error=notfound");

  const inserted = await env.DB
    .prepare(
      `INSERT INTO job_types (owner_id, category_id, name, is_active, updated_at)
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`
    )
    .bind(user.id, source.category_id, `${source.name} (copy)`)
    .run();

  const newTypeId = inserted.meta.last_row_id;

  const stepResult = await env.DB
    .prepare(
      "SELECT name, sort_order FROM job_type_steps WHERE job_type_id = ? ORDER BY sort_order ASC, id ASC"
    )
    .bind(source.id)
    .all();

  const steps = stepResult.results || [];
  for (let i = 0; i < steps.length; i++) {
    await env.DB
      .prepare(
        "INSERT INTO job_type_steps (job_type_id, name, sort_order) VALUES (?, ?, ?)"
      )
      .bind(newTypeId, steps[i].name, i)
      .run();
  }

  return redirect(request, "/planner/types?success=created");
}

export async function handleDeleteType(request, env, user) {
  const formData = await request.formData();
  const typeId = String(formData.get("type_id") || "").trim();
  if (!typeId) return redirect(request, "/planner/types?error=notfound");

  const owned = await env.DB
    .prepare("SELECT id FROM job_types WHERE id = ? AND owner_id = ? LIMIT 1")
    .bind(Number(typeId), user.id)
    .first();
  if (!owned) return redirect(request, "/planner/types?error=notfound");

  // ถ้ามีงานผูกอยู่ → ห้ามลบ ให้ปิดการใช้งานแทน (กันประวัติหาย)
  const used = await env.DB
    .prepare("SELECT id FROM jobs WHERE job_type_id = ? LIMIT 1")
    .bind(Number(typeId))
    .first();
  if (used) return redirect(request, "/planner/types?error=inuse");

  // ไม่มีงานผูก → ลบได้ (steps ตามด้วย ON DELETE CASCADE)
  await env.DB
    .prepare("DELETE FROM job_types WHERE id = ? AND owner_id = ?")
    .bind(Number(typeId), user.id)
    .run();

  return redirect(request, "/planner/types?success=deleted");
}