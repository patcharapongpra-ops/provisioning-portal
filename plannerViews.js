// plannerViews.js
// loaders สำหรับ Dashboard และ Calendar (คำนวณใน JS จากงานใน scope)
// + อีเว้นท์ส่วนตัว (calendar_events) และวันหยุดออฟฟิศ (office_holidays)

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

  // วันหยุดออฟฟิศ (ของกลาง ทุกคนเห็น)
  const holidayResult = await env.DB
    .prepare(
      "SELECT id, holiday_date, name FROM office_holidays WHERE holiday_date BETWEEN ? AND ? ORDER BY holiday_date ASC, id ASC"
    )
    .bind(start, end)
    .all();
  const holidays = holidayResult.results || [];

  // อีเว้นท์ส่วนตัว — เห็นเฉพาะของตัวเองเสมอ ไม่ขึ้นกับ filter รายคนของ senior
  const myEventResult = await env.DB
    .prepare(
      "SELECT id, title, event_date, note FROM calendar_events WHERE owner_id = ? AND event_date BETWEEN ? AND ? ORDER BY event_date ASC, id ASC"
    )
    .bind(user.id, start, end)
    .all();
  const myEvents = myEventResult.results || [];

  const eventsByDay = {};
  const push = (day, ev) => {
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  };

  for (const h of holidays) {
    push(Number(h.holiday_date.slice(8, 10)), { id: h.id, label: h.name, kind: "holiday" });
  }

  const dateFields = [
    ["install_date", "install"],
    ["delivery_date", "delivery"],
    ["cr_close_date", "crclose"],
  ];

  for (const job of jobs) {
    for (const [field, kind] of dateFields) {
      const d = job[field];
      if (d && d >= start && d <= end) {
        push(Number(d.slice(8, 10)), { id: job.id, label: job.cid, kind });
      }
    }
  }

  for (const ev of myEvents) {
    push(Number(ev.event_date.slice(8, 10)), { id: ev.id, label: ev.title, kind: "personal" });
  }

  // การจองรถ (ของกลาง ทุกคนเห็น) — วาดทุกวันที่การจองคาบเกี่ยว รองรับจองข้ามคืน
  const carResult = await env.DB
    .prepare(
      `SELECT car_bookings.id, car_bookings.start_at, car_bookings.end_at,
              users.full_name AS owner_name
       FROM car_bookings JOIN users ON users.id = car_bookings.user_id
       WHERE substr(car_bookings.start_at, 1, 10) <= ?
         AND substr(car_bookings.end_at, 1, 10) >= ?`
    )
    .bind(end, start)
    .all();

  for (const b of carResult.results || []) {
    const fromDate = b.start_at.slice(0, 10) < start ? start : b.start_at.slice(0, 10);
    const toDate = b.end_at.slice(0, 10) > end ? end : b.end_at.slice(0, 10);
    for (let d = fromDate; d <= toDate; d = addDays(d, 1)) {
      push(Number(d.slice(8, 10)), { id: b.id, label: `🚗 ${b.owner_name}`, kind: "car" });
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

  return { month, monthLabel, days, prevYm, nextYm, today: todayTH(), myEvents, holidays };
}

// ---------- Personal calendar events ----------
export async function handleCreateEvent(request, env, user) {
  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim().slice(0, 120);
  const eventDate = String(formData.get("event_date") || "").trim();
  const note = String(formData.get("note") || "").trim().slice(0, 500);

  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return redirect(request, "/planner/calendar?error=event");
  }

  await env.DB
    .prepare(
      "INSERT INTO calendar_events (owner_id, title, event_date, note) VALUES (?, ?, ?, ?)"
    )
    .bind(user.id, title, eventDate, note)
    .run();

  return redirect(
    request,
    `/planner/calendar?ym=${eventDate.slice(0, 7)}&success=event_created`
  );
}

export async function handleDeleteEvent(request, env, user) {
  const formData = await request.formData();
  const eventId = Number(String(formData.get("event_id") || "").trim());

  if (!eventId) return redirect(request, "/planner/calendar");

  // ลบได้เฉพาะของตัวเอง
  const ev = await env.DB
    .prepare("SELECT id, event_date FROM calendar_events WHERE id = ? AND owner_id = ? LIMIT 1")
    .bind(eventId, user.id)
    .first();

  if (!ev) return redirect(request, "/planner/calendar");

  await env.DB
    .prepare("DELETE FROM calendar_events WHERE id = ? AND owner_id = ?")
    .bind(eventId, user.id)
    .run();

  return redirect(
    request,
    `/planner/calendar?ym=${String(ev.event_date).slice(0, 7)}&success=event_deleted`
  );
}