// plannerViews.js
// loaders สำหรับ Dashboard และ Calendar (คำนวณใน JS จากงานใน scope)

function isSenior(user) {
  return user.role === "staff" || user.role === "admin";
}

function todayTH() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function scope(user, ownerId) {
  const conditions = [];
  const binds = [];
  if (!isSenior(user)) {
    conditions.push("jobs.owner_id = ?");
    binds.push(user.id);
  } else if (ownerId) {
    conditions.push("jobs.owner_id = ?");
    binds.push(Number(ownerId));
  }
  return { conditions, binds };
}

async function fetchScopedJobs(env, user, ownerId, extraCond, extraBinds) {
  const { conditions, binds } = scope(user, ownerId);
  const all = [...conditions, ...(extraCond || [])];
  const where = all.length ? `WHERE ${all.join(" AND ")}` : "";

  const result = await env.DB
    .prepare(
      `
      SELECT
        jobs.id, jobs.owner_id, jobs.category_id, jobs.type_name,
        jobs.cid, jobs.customer_name,
        jobs.install_date, jobs.delivery_date, jobs.cr_close_date,
        jobs.status, jobs.updated_at,
        users.full_name AS owner_name,
        job_categories.name AS category_name
      FROM jobs
      JOIN users ON users.id = jobs.owner_id
      LEFT JOIN job_categories ON job_categories.id = jobs.category_id
      ${where}
      `
    )
    .bind(...binds, ...(extraBinds || []))
    .all();

  return result.results || [];
}

function isOverdue(job, today) {
  if (job.status === "done") return false;
  return [job.install_date, job.delivery_date, job.cr_close_date]
    .filter(Boolean)
    .some((d) => d < today);
}

// ---------- Dashboard ----------
export async function loadDashboard(env, user, ownerId) {
  const jobs = await fetchScopedJobs(env, user, ownerId);
  const today = todayTH();
  const thisMonth = today.slice(0, 7);
  const weekEnd = addDays(today, 7);

  const metrics = { total: jobs.length, todo: 0, in_progress: 0, done: 0, doneThisMonth: 0, overdue: 0 };
  const byCategory = {};
  const byOwner = {};
  const thisWeek = [];

  const dateLabels = [
    ["install_date", "ติดตั้ง"],
    ["delivery_date", "ส่งมอบ"],
    ["cr_close_date", "ปิด CR"],
  ];

  for (const job of jobs) {
    metrics[job.status] = (metrics[job.status] || 0) + 1;
    if (job.status === "done" && String(job.updated_at || "").slice(0, 7) === thisMonth) {
      metrics.doneThisMonth += 1;
    }
    if (isOverdue(job, today)) metrics.overdue += 1;

    const cat = job.category_name || "อื่น ๆ";
    byCategory[cat] = (byCategory[cat] || 0) + 1;

    if (isSenior(user)) {
      const o = job.owner_name || "-";
      if (!byOwner[o]) byOwner[o] = { total: 0, done: 0 };
      byOwner[o].total += 1;
      if (job.status === "done") byOwner[o].done += 1;
    }

    if (job.status !== "done") {
      for (const [field, label] of dateLabels) {
        const d = job[field];
        if (d && d >= today && d <= weekEnd) {
          thisWeek.push({
            id: job.id,
            cid: job.cid,
            customer_name: job.customer_name,
            label,
            date: d,
          });
        }
      }
    }
  }

  thisWeek.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    metrics,
    byCategory: Object.entries(byCategory).map(([name, count]) => ({ name, count })),
    byOwner: Object.entries(byOwner).map(([name, v]) => ({ name, ...v })),
    thisWeek,
    isSenior: isSenior(user),
  };
}

// ---------- Calendar ----------
export async function loadCalendar(env, user, ownerId, ym) {
  const month = /^\d{4}-\d{2}$/.test(ym || "") ? ym : todayTH().slice(0, 7);
  const [year, mon] = month.split("-").map(Number);

  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  const extraCond = [
    "((jobs.install_date BETWEEN ? AND ?) OR (jobs.delivery_date BETWEEN ? AND ?) OR (jobs.cr_close_date BETWEEN ? AND ?))",
  ];
  const extraBinds = [start, end, start, end, start, end];

  const jobs = await fetchScopedJobs(env, user, ownerId, extraCond, extraBinds);

  const eventsByDay = {};
  const push = (day, ev) => {
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  };

  const dateFields = [
    ["install_date", "install"],
    ["delivery_date", "delivery"],
    ["cr_close_date", "crclose"],
  ];

  for (const job of jobs) {
    for (const [field, kind] of dateFields) {
      const d = job[field];
      if (d && d >= start && d <= end) {
        push(Number(d.slice(8, 10)), { id: job.id, cid: job.cid, kind });
      }
    }
  }

  // Monday-first grid
  const firstWeekday = (new Date(Date.UTC(year, mon - 1, 1)).getUTCDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) {
    days.push({
      day: d,
      date: `${month}-${String(d).padStart(2, "0")}`,
      events: eventsByDay[d] || [],
    });
  }

  const prevYm = new Date(Date.UTC(year, mon - 2, 1)).toISOString().slice(0, 7);
  const nextYm = new Date(Date.UTC(year, mon, 1)).toISOString().slice(0, 7);
  const monthLabel = new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });

  return { month, monthLabel, days, prevYm, nextYm, today: todayTH() };
}