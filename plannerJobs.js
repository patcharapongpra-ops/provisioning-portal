// plannerJobs.js
// ตรรกะฝั่ง worker สำหรับ "งานจริง" (jobs) + checklist + comments

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

// พี่ = staff/admin (เห็นทุกงาน + แก้ + คอมเมนต์)
function isSenior(user) {
  return user.role === "staff" || user.role === "admin";
}

function canEditJob(user, job) {
  return job.owner_id === user.id || isSenior(user);
}

export function deriveStatus(done, total) {
  if (total > 0 && done >= total) return "done";
  if (done > 0) return "in_progress";
  return "todo";
}

// วันนี้ตามเวลาไทย (UTC+7) รูปแบบ YYYY-MM-DD
export function todayTH() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

async function recomputeJobStatus(env, jobId) {
  const counts = await env.DB
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(is_done), 0) AS done
       FROM job_steps WHERE job_id = ?`
    )
    .bind(jobId)
    .first();

  const status = deriveStatus(Number(counts.done), Number(counts.total));

  if (status === "done") {
    // บันทึกเวลาที่ "เสร็จ" ครั้งแรก (COALESCE = ไม่ทับของเดิม) เพื่อใช้ซ่อนอัตโนมัติหลัง 1 วัน
    await env.DB
      .prepare(
        "UPDATE jobs SET status = 'done', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(jobId)
      .run();
  } else {
    // กลับไปยังไม่เสร็จ → ล้างเวลาเสร็จ (นับ 1 วันใหม่ถ้าทำเสร็จอีกครั้ง)
    await env.DB
      .prepare(
        "UPDATE jobs SET status = ?, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(status, jobId)
      .run();
  }
}

// ---------- create form data ----------
export async function loadActiveTypesGrouped(env, userId) {
  const result = await env.DB
    .prepare(
      `
      SELECT job_types.id, job_types.name,
             job_categories.id AS category_id, job_categories.name AS category_name,
             job_categories.sort_order AS category_sort
      FROM job_types
      JOIN job_categories ON job_categories.id = job_types.category_id
      WHERE job_types.owner_id = ? AND job_types.is_active = 1
      ORDER BY job_categories.sort_order ASC, job_types.name ASC
      `
    )
    .bind(userId)
    .all();

  const rows = result.results || [];
  const groups = [];
  const byId = {};
  for (const row of rows) {
    if (!byId[row.category_id]) {
      byId[row.category_id] = { id: row.category_id, name: row.category_name, types: [] };
      groups.push(byId[row.category_id]);
    }
    byId[row.category_id].types.push({ id: row.id, name: row.name });
  }
  return groups;
}

// ---------- board ----------
export async function loadBoard(env, user, params) {
  const conditions = [];
  const binds = [];

  if (!isSenior(user)) {
    conditions.push("jobs.owner_id = ?");
    binds.push(user.id);
  } else if (params.owner_id) {
    conditions.push("jobs.owner_id = ?");
    binds.push(Number(params.owner_id));
  }

  if (params.category_id) {
    conditions.push("jobs.category_id = ?");
    binds.push(Number(params.category_id));
  }

  if (params.q) {
    conditions.push("(jobs.cid LIKE ? OR jobs.customer_name LIKE ? OR jobs.sof LIKE ?)");
    const like = `%${params.q}%`;
    binds.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await env.DB
    .prepare(
      `
      SELECT
        jobs.id, jobs.owner_id, jobs.category_id, jobs.type_name,
        jobs.cid, jobs.customer_name, jobs.sof,
        jobs.install_date, jobs.delivery_date, jobs.cr_close_date, jobs.status, jobs.completed_at,
        users.full_name AS owner_name,
        (SELECT COUNT(*) FROM job_steps WHERE job_steps.job_id = jobs.id) AS step_total,
        (SELECT COALESCE(SUM(is_done),0) FROM job_steps WHERE job_steps.job_id = jobs.id) AS step_done
      FROM jobs
      JOIN users ON users.id = jobs.owner_id
      ${where}
      ORDER BY jobs.install_date IS NULL, jobs.install_date ASC, jobs.id DESC
      `
    )
    .bind(...binds)
    .all();

  let jobs = result.results || [];
  const today = todayTH();

  jobs = jobs.map((job) => {
    const status = deriveStatus(Number(job.step_done), Number(job.step_total));
    const dates = [job.install_date, job.delivery_date, job.cr_close_date].filter(Boolean);
    const overdue = status !== "done" && dates.some((d) => d < today);
    return { ...job, status, overdue };
  });

  // filter by derived status (ทำใน JS เพราะ status คำนวณจาก checklist)
  if (params.status) {
    // กรองสถานะแบบเจาะจง — เลือก "เสร็จ" จะเห็นงานเสร็จทั้งหมด (รวมของเก่า) ไว้ดูย้อนหลัง
    if (params.status === "overdue") jobs = jobs.filter((j) => j.overdue);
    else jobs = jobs.filter((j) => j.status === params.status);
  } else {
    // มุมมองปกติ: งานที่เสร็จแล้วคงอยู่ 1 วัน (24 ชม.) นับจากเวลาเสร็จ แล้วซ่อนอัตโนมัติ
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    jobs = jobs.filter(
      (j) => !(j.status === "done" && j.completed_at && j.completed_at < cutoff)
    );
  }

  return jobs;
}

export async function loadOwners(env) {
  const result = await env.DB
    .prepare("SELECT id, full_name FROM users WHERE is_active = 1 ORDER BY full_name ASC")
    .all();
  return result.results || [];
}

// ---------- create ----------
export async function handleCreateJob(request, env, user) {
  const formData = await request.formData();
  const jobTypeId = String(formData.get("job_type_id") || "").trim();
  const cid = String(formData.get("cid") || "").trim();
  const customerName = String(formData.get("customer_name") || "").trim();
  const sof = String(formData.get("sof") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const installDate = String(formData.get("install_date") || "").trim();
  const deliveryDate = String(formData.get("delivery_date") || "").trim();
  const crCloseDate = String(formData.get("cr_close_date") || "").trim();

  if (!jobTypeId || !cid || !customerName) {
    return redirect(request, "/planner/jobs/new?error=missing");
  }

  // ต้องเป็นชนิดงานของ user เองและยัง active
  const type = await env.DB
    .prepare(
      "SELECT id, category_id, name FROM job_types WHERE id = ? AND owner_id = ? AND is_active = 1 LIMIT 1"
    )
    .bind(Number(jobTypeId), user.id)
    .first();

  if (!type) return redirect(request, "/planner/jobs/new?error=type");

  const inserted = await env.DB
    .prepare(
      `INSERT INTO jobs
        (owner_id, category_id, job_type_id, type_name, cid, customer_name, sof, note,
         install_date, delivery_date, cr_close_date, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'todo', CURRENT_TIMESTAMP)`
    )
    .bind(
      user.id, type.category_id, type.id, type.name,
      cid, customerName, sof, note,
      installDate || null, deliveryDate || null, crCloseDate || null
    )
    .run();

  const jobId = inserted.meta.last_row_id;

  // copy ขั้นตอนต้นแบบ → checklist ของงาน
  const stepResult = await env.DB
    .prepare(
      "SELECT name, sort_order FROM job_type_steps WHERE job_type_id = ? ORDER BY sort_order ASC, id ASC"
    )
    .bind(type.id)
    .all();

  const steps = stepResult.results || [];
  for (let i = 0; i < steps.length; i++) {
    await env.DB
      .prepare(
        "INSERT INTO job_steps (job_id, name, sort_order, is_done) VALUES (?, ?, ?, 0)"
      )
      .bind(jobId, steps[i].name, i)
      .run();
  }

  return redirect(request, `/planner/jobs/view?id=${jobId}`);
}

// ---------- detail ----------
export async function loadJobDetail(env, user, jobId) {
  const job = await env.DB
    .prepare(
      `
      SELECT jobs.*, users.full_name AS owner_name,
             job_categories.name AS category_name
      FROM jobs
      JOIN users ON users.id = jobs.owner_id
      LEFT JOIN job_categories ON job_categories.id = jobs.category_id
      WHERE jobs.id = ? LIMIT 1
      `
    )
    .bind(Number(jobId))
    .first();

  if (!job) return { job: null };

  // สิทธิ์เข้าถึง: เจ้าของ หรือ พี่ เท่านั้น
  if (job.owner_id !== user.id && !isSenior(user)) {
    return { job: null };
  }

  const stepResult = await env.DB
    .prepare(
      "SELECT id, name, sort_order, is_done FROM job_steps WHERE job_id = ? ORDER BY sort_order ASC, id ASC"
    )
    .bind(job.id)
    .all();

  const commentResult = await env.DB
    .prepare(
      `
      SELECT job_comments.id, job_comments.message, job_comments.created_at,
             users.full_name AS author_name, users.role AS author_role
      FROM job_comments
      JOIN users ON users.id = job_comments.user_id
      WHERE job_comments.job_id = ?
      ORDER BY job_comments.created_at ASC, job_comments.id ASC
      `
    )
    .bind(job.id)
    .all();

  const steps = stepResult.results || [];
  const done = steps.filter((s) => s.is_done).length;
  const today = todayTH();
  const dates = [job.install_date, job.delivery_date, job.cr_close_date].filter(Boolean);
  const status = deriveStatus(done, steps.length);
  const overdue = status !== "done" && dates.some((d) => d < today);

  return {
    job: { ...job, status, overdue, step_total: steps.length, step_done: done },
    steps,
    comments: commentResult.results || [],
    canEdit: canEditJob(user, job),
  };
}

async function assertCanEdit(env, user, jobId) {
  const job = await env.DB
    .prepare("SELECT id, owner_id FROM jobs WHERE id = ? LIMIT 1")
    .bind(Number(jobId))
    .first();
  if (!job) return null;
  if (!canEditJob(user, job)) return null;
  return job;
}

export async function handleUpdateJob(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) return redirect(request, "/planner");

  const job = await assertCanEdit(env, user, jobId);
  if (!job) return redirect(request, "/planner");

  const cid = String(formData.get("cid") || "").trim();
  const customerName = String(formData.get("customer_name") || "").trim();
  const sof = String(formData.get("sof") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const installDate = String(formData.get("install_date") || "").trim();
  const deliveryDate = String(formData.get("delivery_date") || "").trim();
  const crCloseDate = String(formData.get("cr_close_date") || "").trim();

  if (!cid || !customerName) {
    return redirect(request, `/planner/jobs/view?id=${Number(jobId)}&error=missing`);
  }

  await env.DB
    .prepare(
      `UPDATE jobs SET cid = ?, customer_name = ?, sof = ?, note = ?,
        install_date = ?, delivery_date = ?, cr_close_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      cid, customerName, sof, note,
      installDate || null, deliveryDate || null, crCloseDate || null,
      Number(jobId)
    )
    .run();

  return redirect(request, `/planner/jobs/view?id=${Number(jobId)}&success=saved`);
}

export async function handleToggleStep(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();
  const stepId = String(formData.get("step_id") || "").trim();
  const nextDone = String(formData.get("next_done") || "").trim();

  const job = await assertCanEdit(env, user, jobId);
  if (!job || !stepId || !["0", "1"].includes(nextDone)) {
    return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);
  }

  const doneAt = nextDone === "1" ? "CURRENT_TIMESTAMP" : "NULL";
  await env.DB
    .prepare(
      `UPDATE job_steps SET is_done = ?, done_at = ${doneAt} WHERE id = ? AND job_id = ?`
    )
    .bind(Number(nextDone), Number(stepId), Number(jobId))
    .run();

  await recomputeJobStatus(env, Number(jobId));
  return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);
}

export async function handleAddStep(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  const job = await assertCanEdit(env, user, jobId);
  if (!job || !name) return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);

  const max = await env.DB
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM job_steps WHERE job_id = ?")
    .bind(Number(jobId))
    .first();

  await env.DB
    .prepare("INSERT INTO job_steps (job_id, name, sort_order, is_done) VALUES (?, ?, ?, 0)")
    .bind(Number(jobId), name, Number(max.m) + 1)
    .run();

  await recomputeJobStatus(env, Number(jobId));
  return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);
}

export async function handleRemoveStep(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();
  const stepId = String(formData.get("step_id") || "").trim();

  const job = await assertCanEdit(env, user, jobId);
  if (!job || !stepId) return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);

  await env.DB
    .prepare("DELETE FROM job_steps WHERE id = ? AND job_id = ?")
    .bind(Number(stepId), Number(jobId))
    .run();

  await recomputeJobStatus(env, Number(jobId));
  return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);
}

export async function handleReorderSteps(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();
  const order = String(formData.get("order") || "").trim();

  const job = await assertCanEdit(env, user, jobId);
  if (!job || !order) return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);

  const ids = order
    .split(",")
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0);

  for (let i = 0; i < ids.length; i++) {
    await env.DB
      .prepare("UPDATE job_steps SET sort_order = ? WHERE id = ? AND job_id = ?")
      .bind(i, ids[i], Number(jobId))
      .run();
  }

  return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);
}

export async function handleAddComment(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const job = await assertCanEdit(env, user, jobId);
  if (!job || !message) return redirect(request, `/planner/jobs/view?id=${Number(jobId)}`);

  await env.DB
    .prepare("INSERT INTO job_comments (job_id, user_id, message) VALUES (?, ?, ?)")
    .bind(Number(jobId), user.id, message)
    .run();

  return redirect(request, `/planner/jobs/view?id=${Number(jobId)}#comments`);
}

export async function handleDeleteJob(request, env, user) {
  const formData = await request.formData();
  const jobId = String(formData.get("job_id") || "").trim();

  const job = await assertCanEdit(env, user, jobId);
  if (!job) return redirect(request, "/planner");

  await env.DB.prepare("DELETE FROM job_steps WHERE job_id = ?").bind(Number(jobId)).run();
  await env.DB.prepare("DELETE FROM job_comments WHERE job_id = ?").bind(Number(jobId)).run();
  await env.DB.prepare("DELETE FROM jobs WHERE id = ?").bind(Number(jobId)).run();

  return redirect(request, "/planner?success=deleted");
}