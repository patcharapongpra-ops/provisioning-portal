// carBookings.js — ระบบจองรถแผนก (รถ 1 คัน)
// flow: จอง (booked) → รับรถ+ไมล์ออก (in_use) → คืนรถ+ไมล์เข้า/ชั้นจอด/เช็คสภาพ (returned)
// เวลาเก็บเป็นเวลาไทยรูปแบบ "YYYY-MM-DDTHH:MM" เทียบลำดับแบบ string ได้เลย

function redirect(request, path) {
  const url = new URL(request.url);
  url.pathname = path.split("?")[0];
  const query = path.includes("?") ? path.split("?")[1] : "";
  url.search = query ? "?" + query : "";
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

// เวลาไทยตอนนี้ (UTC+7) รูปแบบ "YYYY-MM-DDTHH:MM"
export function nowTH() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16);
}

function canManage(user, booking) {
  return booking.user_id === user.id || user.role === "admin";
}

const DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// ---------- loaders ----------
export async function loadCarPage(env, user) {
  const now = nowTH();

  const inUse = await env.DB
    .prepare(
      `SELECT car_bookings.*, users.full_name AS owner_name
       FROM car_bookings JOIN users ON users.id = car_bookings.user_id
       WHERE car_bookings.status = 'in_use'
       ORDER BY car_bookings.picked_up_at DESC LIMIT 1`
    )
    .first();

  const lastReturn = await env.DB
    .prepare(
      `SELECT parking_floor, odometer_in, returned_at
       FROM car_bookings WHERE status = 'returned'
       ORDER BY returned_at DESC, id DESC LIMIT 1`
    )
    .first();

  const upcomingResult = await env.DB
    .prepare(
      `SELECT car_bookings.*, users.full_name AS owner_name
       FROM car_bookings JOIN users ON users.id = car_bookings.user_id
       WHERE (car_bookings.status = 'booked' AND car_bookings.end_at >= ?)
          OR car_bookings.status = 'in_use'
       ORDER BY car_bookings.start_at ASC LIMIT 30`
    )
    .bind(now)
    .all();

  const historyResult = await env.DB
    .prepare(
      `SELECT car_bookings.*, users.full_name AS owner_name
       FROM car_bookings JOIN users ON users.id = car_bookings.user_id
       WHERE car_bookings.status = 'returned'
       ORDER BY car_bookings.returned_at DESC, car_bookings.id DESC LIMIT 10`
    )
    .all();

  return {
    now,
    inUse: inUse || null,
    lastReturn: lastReturn || null,
    upcoming: upcomingResult.results || [],
    history: historyResult.results || [],
  };
}

export async function loadCarLog(env, ym) {
  const month = /^\d{4}-\d{2}$/.test(ym || "") ? ym : nowTH().slice(0, 7);
  const [year, mon] = month.split("-").map(Number);

  const result = await env.DB
    .prepare(
      `SELECT car_bookings.*, users.full_name AS owner_name
       FROM car_bookings JOIN users ON users.id = car_bookings.user_id
       WHERE car_bookings.status = 'returned' AND substr(car_bookings.start_at, 1, 7) = ?
       ORDER BY car_bookings.start_at ASC, car_bookings.id ASC`
    )
    .bind(month)
    .all();

  const prevYm = new Date(Date.UTC(year, mon - 2, 1)).toISOString().slice(0, 7);
  const nextYm = new Date(Date.UTC(year, mon, 1)).toISOString().slice(0, 7);
  const monthLabel = new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });

  return { month, monthLabel, prevYm, nextYm, rows: result.results || [] };
}

// ---------- handlers ----------
export async function handleCreateBooking(request, env, user) {
  const formData = await request.formData();
  const startDate = String(formData.get("start_date") || "").trim();
  const startTime = String(formData.get("start_time") || "").trim();
  const endDate = String(formData.get("end_date") || "").trim();
  const endTime = String(formData.get("end_time") || "").trim();
  const purpose = String(formData.get("purpose") || "").trim().slice(0, 200);
  const location = String(formData.get("location") || "").trim().slice(0, 200);

  const startAt = `${startDate}T${startTime}`;
  const endAt = `${endDate}T${endTime}`;

  if (!purpose || !DT_RE.test(startAt) || !DT_RE.test(endAt)) {
    return redirect(request, "/car?error=missing");
  }

  if (endAt <= startAt) {
    return redirect(request, "/car?error=order");
  }

  // กันจองชน: ช่วงเวลาทับกับการจองที่ยัง active อยู่ (booked/in_use)
  const conflict = await env.DB
    .prepare(
      `SELECT car_bookings.start_at, car_bookings.end_at, users.full_name AS owner_name
       FROM car_bookings JOIN users ON users.id = car_bookings.user_id
       WHERE car_bookings.status IN ('booked', 'in_use')
         AND NOT (car_bookings.end_at <= ? OR car_bookings.start_at >= ?)
       LIMIT 1`
    )
    .bind(startAt, endAt)
    .first();

  if (conflict) {
    const q = new URLSearchParams({
      error: "conflict",
      who: conflict.owner_name || "",
      from: conflict.start_at,
      to: conflict.end_at,
    });
    return redirect(request, `/car?${q.toString()}`);
  }

  await env.DB
    .prepare(
      "INSERT INTO car_bookings (user_id, start_at, end_at, purpose, location) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(user.id, startAt, endAt, purpose, location)
    .run();

  return redirect(request, "/car?success=booked");
}

export async function handlePickupBooking(request, env, user) {
  const formData = await request.formData();
  const bookingId = Number(String(formData.get("booking_id") || "").trim());
  const odometerOut = String(formData.get("odometer_out") || "").trim();

  const booking = await env.DB
    .prepare("SELECT * FROM car_bookings WHERE id = ? LIMIT 1")
    .bind(bookingId)
    .first();

  if (!booking || booking.status !== "booked" || !canManage(user, booking)) {
    return redirect(request, "/car?error=notfound");
  }

  const odo = Number(odometerOut);
  if (!Number.isInteger(odo) || odo < 0) {
    return redirect(request, "/car?error=odo_out");
  }

  // รถออกได้ทีละคัน — ถ้ามีคนกำลังใช้อยู่ รับรถซ้อนไม่ได้
  const inUse = await env.DB
    .prepare("SELECT id FROM car_bookings WHERE status = 'in_use' LIMIT 1")
    .first();

  if (inUse) {
    return redirect(request, "/car?error=carout");
  }

  await env.DB
    .prepare(
      "UPDATE car_bookings SET status = 'in_use', odometer_out = ?, picked_up_at = ? WHERE id = ?"
    )
    .bind(odo, nowTH(), bookingId)
    .run();

  return redirect(request, "/car?success=picked");
}

export async function handleReturnBooking(request, env, user) {
  const formData = await request.formData();
  const bookingId = Number(String(formData.get("booking_id") || "").trim());
  const odometerIn = String(formData.get("odometer_in") || "").trim();
  const parkingFloor = String(formData.get("parking_floor") || "").trim().slice(0, 40);
  const fuelCostRaw = String(formData.get("fuel_cost") || "").trim();
  const checkVehicle = String(formData.get("check_vehicle") || "1") === "1" ? 1 : 0;
  const checkDriving = String(formData.get("check_driving") || "1") === "1" ? 1 : 0;
  const checkClean = String(formData.get("check_clean") || "1") === "1" ? 1 : 0;
  const issueNote = String(formData.get("issue_note") || "").trim().slice(0, 500);

  const booking = await env.DB
    .prepare("SELECT * FROM car_bookings WHERE id = ? LIMIT 1")
    .bind(bookingId)
    .first();

  if (!booking || booking.status !== "in_use" || !canManage(user, booking)) {
    return redirect(request, "/car?error=notfound");
  }

  const odo = Number(odometerIn);
  if (!Number.isInteger(odo) || odo < 0) {
    return redirect(request, "/car?error=odo_in");
  }

  if (booking.odometer_out !== null && odo < booking.odometer_out) {
    return redirect(request, "/car?error=odo_less");
  }

  if (!parkingFloor) {
    return redirect(request, "/car?error=floor");
  }

  let fuelCost = null;
  if (fuelCostRaw) {
    const f = Number(fuelCostRaw);
    if (Number.isNaN(f) || f < 0) return redirect(request, "/car?error=fuel");
    fuelCost = f;
  }

  // ถ้าติ๊กผิดปกติช่องไหน ต้องบอกรายละเอียดด้วย (ตามฟอร์มกระดาษ)
  if ((!checkVehicle || !checkDriving || !checkClean) && !issueNote) {
    return redirect(request, "/car?error=issue");
  }

  await env.DB
    .prepare(
      `UPDATE car_bookings
       SET status = 'returned', odometer_in = ?, parking_floor = ?, fuel_cost = ?,
           check_vehicle = ?, check_driving = ?, check_clean = ?, issue_note = ?,
           returned_at = ?
       WHERE id = ?`
    )
    .bind(
      odo, parkingFloor, fuelCost,
      checkVehicle, checkDriving, checkClean, issueNote,
      nowTH(), bookingId
    )
    .run();

  return redirect(request, "/car?success=returned");
}

export async function handleCancelBooking(request, env, user) {
  const formData = await request.formData();
  const bookingId = Number(String(formData.get("booking_id") || "").trim());

  const booking = await env.DB
    .prepare("SELECT * FROM car_bookings WHERE id = ? LIMIT 1")
    .bind(bookingId)
    .first();

  // ยกเลิกได้เฉพาะที่ยังไม่รับรถ — ถ้ารับรถแล้วต้องกดคืนรถแทน
  if (!booking || booking.status !== "booked" || !canManage(user, booking)) {
    return redirect(request, "/car?error=notfound");
  }

  await env.DB
    .prepare("DELETE FROM car_bookings WHERE id = ?")
    .bind(bookingId)
    .run();

  return redirect(request, "/car?success=cancelled");
}
