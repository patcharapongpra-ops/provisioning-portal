import { loginPage } from "./pages/login.js";
import { registerPage } from "./pages/register.js";
import { forgotPage } from "./pages/forgot.js";
import { accountPasswordPage } from "./pages/accountPassword.js";
import { homePage } from "./pages/home.js";
import { adminPage } from "./pages/admin.js";
import { adminUsersPage } from "./pages/adminUsers.js";
import { configPage } from "./pages/config.js";
import { adminTemplatesPage } from "./pages/adminTemplates.js";
import { adminTemplateFormPage } from "./pages/adminTemplateForm.js";
import { plannerTypesPage } from "./pages/plannerTypes.js";
import { plannerTypeFormPage } from "./pages/plannerTypeForm.js";
import {
  getCategories, ensurePlannerSeed, loadUserTypes, loadTypeForEdit,
  handleStoreType, handleUpdateType, handleToggleType, handleCloneType, handleDeleteType,
} from "./planner.js";
import { plannerBoardPage } from "./pages/plannerBoard.js";
import { plannerJobFormPage } from "./pages/plannerJobForm.js";
import { plannerJobViewPage } from "./pages/plannerJob.js";
import {
  loadBoard, loadOwners, loadActiveTypesGrouped, handleCreateJob,
  loadJobDetail, handleUpdateJob, handleToggleStep, handleAddStep,
  handleRemoveStep, handleReorderSteps, handleAddComment, handleDeleteJob,
} from "./plannerJobs.js";
import { plannerDashboardPage } from "./pages/plannerDashboard.js";
import { plannerCalendarPage } from "./pages/plannerCalendar.js";
import { loadDashboard, loadCalendar } from "./plannerViews.js";
import { hashPassword, verifyPassword, hashTempPassword, generateTempPassword } from "./auth.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/" || url.pathname === "/login") {
        const error = url.searchParams.get("error");
        const success = url.searchParams.get("success");
        return html(loginPage(error, success));
      }

      if (url.pathname === "/register") {
        const error = url.searchParams.get("error");
        return html(registerPage(error));
      }

      if (url.pathname === "/forgot") {
        return html(forgotPage());
      }

      // ถ้ากำลังใช้รหัสชั่วคราวจาก admin → บังคับไปตั้งรหัสใหม่ก่อนใช้งานหน้าอื่น
      const passwordGateExempt = new Set([
        "/account/password",
        "/account/password/update",
        "/logout",
        "/api/login",
        "/api/register",
      ]);
      if (!passwordGateExempt.has(url.pathname)) {
        const gateUser = await requireLogin(request, env);
        if (gateUser && gateUser.must_change_password) {
          return redirect(request, "/account/password?required=1");
        }
      }

      if (url.pathname === "/account/password") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        return html(
          accountPasswordPage({
            user,
            error: url.searchParams.get("error"),
            success: url.searchParams.get("success"),
            required: url.searchParams.get("required"),
          })
        );
      }

      if (url.pathname === "/account/password/update") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (request.method !== "POST") return redirect(request, "/account/password");
        return await handleChangePassword(request, env, user);
      }

      if (url.pathname === "/admin/users/reset-password") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");
        if (request.method !== "POST") return redirect(request, "/admin/users");
        return await handleAdminResetPassword(request, env, user);
      }

      if (url.pathname === "/admin/users/role") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");
        if (request.method !== "POST") return redirect(request, "/admin/users");
        return await handleChangeUserRole(request, env, user);
      }

      if (url.pathname === "/api/register") {
        if (request.method !== "POST") return redirect(request, "/register");
        return await handleRegister(request, env);
      }

      if (url.pathname === "/api/login") {
        if (request.method !== "POST") return redirect(request, "/login");
        return await handleLogin(request, env);
      }

      if (url.pathname === "/logout") {
        return await handleLogout(request, env);
      }

      if (url.pathname === "/home") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        return html(homePage(user));
      }

      if (url.pathname === "/admin") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");
        return html(adminPage(user));
      }

      if (url.pathname === "/admin/users") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        const error = url.searchParams.get("error");
        const success = url.searchParams.get("success");

        const users = await env.DB
          .prepare(
            "SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id ASC"
          )
          .all();

        return html(adminUsersPage(user, users.results || [], error, success));
      }

      if (url.pathname === "/admin/users/create") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        if (request.method !== "POST") return redirect(request, "/admin/users");
        return await handleCreateUser(request, env);
      }

      if (url.pathname === "/admin/users/toggle") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        if (request.method !== "POST") return redirect(request, "/admin/users");
        return await handleToggleUser(request, env);
      }

      if (url.pathname === "/config") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");

        const templateId = url.searchParams.get("template_id");
        const data = await loadConfigPageData(env, templateId);

        return html(
          configPage({
            user,
            templates: data.templates,
            selectedTemplate: data.selectedTemplate,
            fields: data.fields,
            output: "",
            error: "",
            inputValues: {},
          })
        );
      }

      if (url.pathname === "/config/generate") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");

        if (request.method !== "POST") return redirect(request, "/config");
        return await handleGenerateConfig(request, env, user);
      }

      if (url.pathname === "/admin/templates") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        const error = url.searchParams.get("error");
        const success = url.searchParams.get("success");

        const templates = await env.DB
          .prepare(
            `
            SELECT 
              config_templates.id,
              config_templates.name,
              config_templates.is_active,
              config_templates.created_at,
              config_templates.updated_at,
              device_types.name AS device_type_name
            FROM config_templates
            LEFT JOIN device_types ON device_types.id = config_templates.device_type_id
            ORDER BY config_templates.id DESC
            `
          )
          .all();

        return html(
          adminTemplatesPage({
            user,
            templates: templates.results || [],
            error,
            success,
          })
        );
      }

      if (url.pathname === "/admin/templates/create") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        return html(
          adminTemplateFormPage({
            user,
            mode: "create",
            template: null,
            fields: [],
            error: "",
          })
        );
      }

      if (url.pathname === "/admin/templates/store") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        if (request.method !== "POST") {
          return redirect(request, "/admin/templates");
        }

        return await handleStoreTemplate(request, env);
      }

      if (url.pathname === "/admin/templates/edit") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        const templateId = url.searchParams.get("id");
        if (!templateId) return redirect(request, "/admin/templates");

        const data = await loadTemplateForEdit(env, templateId);
        if (!data.template) {
          return redirect(request, "/admin/templates?error=notfound");
        }

        return html(
          adminTemplateFormPage({
            user,
            mode: "edit",
            template: data.template,
            fields: data.fields,
            error: "",
          })
        );
      }

      if (url.pathname === "/admin/templates/update") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        if (request.method !== "POST") {
          return redirect(request, "/admin/templates");
        }

        return await handleUpdateTemplate(request, env);
      }

      if (url.pathname === "/admin/templates/clone") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        if (request.method !== "POST") {
          return redirect(request, "/admin/templates");
        }

        return await handleCloneTemplate(request, env);
      }

      if (url.pathname === "/admin/templates/toggle") {
        const user = await requireLogin(request, env);
        if (!user) return redirect(request, "/login");
        if (user.role !== "admin") return redirect(request, "/home");

        if (request.method !== "POST") {
          return redirect(request, "/admin/templates");
        }

        return await handleToggleTemplate(request, env);
      }

      if (url.pathname === "/planner/types") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  await ensurePlannerSeed(env, user.id);
  const [categories, types] = [await getCategories(env), await loadUserTypes(env, user.id)];
  return html(plannerTypesPage({
    user, categories, types,
    error: url.searchParams.get("error"),
    success: url.searchParams.get("success"),
  }));
}

if (url.pathname === "/planner/types/create") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  return html(plannerTypeFormPage({
    user, mode: "create", type: null, steps: [],
    categories: await getCategories(env),
    presetCategoryId: url.searchParams.get("category_id"),
    error: "",
  }));
}

if (url.pathname === "/planner/types/edit") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  const data = await loadTypeForEdit(env, user.id, url.searchParams.get("id"));
  if (!data.type) return redirect(request, "/planner/types?error=notfound");
  return html(plannerTypeFormPage({
    user, mode: "edit", type: data.type, steps: data.steps,
    categories: await getCategories(env), error: "",
  }));
}

if (url.pathname === "/planner/types/store") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner/types");
  return await handleStoreType(request, env, user);
}

if (url.pathname === "/planner/types/update") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner/types");
  return await handleUpdateType(request, env, user);
}

if (url.pathname === "/planner/types/toggle") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner/types");
  return await handleToggleType(request, env, user);
}

if (url.pathname === "/planner/types/clone") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner/types");
  return await handleCloneType(request, env, user);
}

if (url.pathname === "/planner/types/delete") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner/types");
  return await handleDeleteType(request, env, user);
}

if (url.pathname === "/planner") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  const filters = {
    q: url.searchParams.get("q") || "",
    category_id: url.searchParams.get("category_id") || "",
    status: url.searchParams.get("status") || "",
    owner_id: url.searchParams.get("owner_id") || "",
  };
  const jobs = await loadBoard(env, user, filters);
  const senior = user.role === "staff" || user.role === "admin";
  return html(plannerBoardPage({
    user, jobs,
    categories: await getCategories(env),
    owners: senior ? await loadOwners(env) : [],
    filters,
    success: url.searchParams.get("success"),
  }));
}

if (url.pathname === "/planner/jobs/new") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  await ensurePlannerSeed(env, user.id);
  return html(plannerJobFormPage({
    user,
    typeGroups: await loadActiveTypesGrouped(env, user.id),
    error: url.searchParams.get("error"),
  }));
}

if (url.pathname === "/planner/jobs/create") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner/jobs/new");
  return await handleCreateJob(request, env, user);
}

if (url.pathname === "/planner/jobs/view") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  const data = await loadJobDetail(env, user, url.searchParams.get("id"));
  if (!data.job) return redirect(request, "/planner");
  return html(plannerJobViewPage({
    user, job: data.job, steps: data.steps, comments: data.comments,
    canEdit: data.canEdit,
    error: url.searchParams.get("error"),
    success: url.searchParams.get("success"),
  }));
}

if (url.pathname === "/planner/jobs/update") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleUpdateJob(request, env, user);
}

if (url.pathname === "/planner/jobs/step/toggle") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleToggleStep(request, env, user);
}

if (url.pathname === "/planner/jobs/step/add") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleAddStep(request, env, user);
}

if (url.pathname === "/planner/jobs/step/remove") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleRemoveStep(request, env, user);
}

if (url.pathname === "/planner/jobs/step/reorder") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleReorderSteps(request, env, user);
}

if (url.pathname === "/planner/jobs/comment") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleAddComment(request, env, user);
}

if (url.pathname === "/planner/jobs/delete") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  if (request.method !== "POST") return redirect(request, "/planner");
  return await handleDeleteJob(request, env, user);
}

if (url.pathname === "/planner/dashboard") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  const senior = user.role === "staff" || user.role === "admin";
  const filters = { owner_id: url.searchParams.get("owner_id") || "" };
  const data = await loadDashboard(env, user, filters.owner_id);
  return html(plannerDashboardPage({
    user, data,
    owners: senior ? await loadOwners(env) : [],
    filters,
  }));
}

if (url.pathname === "/planner/calendar") {
  const user = await requireLogin(request, env);
  if (!user) return redirect(request, "/login");
  const senior = user.role === "staff" || user.role === "admin";
  const filters = { owner_id: url.searchParams.get("owner_id") || "" };
  const cal = await loadCalendar(env, user, filters.owner_id, url.searchParams.get("ym"));
  return html(plannerCalendarPage({
    user, cal,
    owners: senior ? await loadOwners(env) : [],
    filters,
  }));
}

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response("Worker Error: " + err.message, {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
        },
      });
    }
  },
};

async function handleLogin(request, env) {
  if (!env.DB) throw new Error("D1 binding DB not found.");

  const formData = await request.formData();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!username || !password) {
    return redirect(request, "/login?error=missing");
  }

  const user = await env.DB
    .prepare(
      "SELECT id, username, full_name, role, password, is_active FROM users WHERE username = ? COLLATE NOCASE LIMIT 1"
    )
    .bind(username)
    .first();

  if (!user) {
    return redirect(request, "/login?error=invalid");
  }

  const result = await verifyPassword(password, user.password);
  if (!result.ok) {
    return redirect(request, "/login?error=invalid");
  }

  // บอกสถานะ "รออนุมัติ" เฉพาะเมื่อรหัสถูกต้อง เพื่อไม่เปิดเผยสถานะบัญชีให้คนเดารหัส
  if (user.is_active !== 1) {
    return redirect(request, "/login?error=pending");
  }

  // lazy upgrade: ถ้ารหัสเดิมเป็น plaintext ให้ hash แล้วเขียนทับทันที
  if (result.legacy) {
    const newHash = await hashPassword(password);
    await env.DB
      .prepare("UPDATE users SET password = ? WHERE id = ?")
      .bind(newHash, user.id)
      .run();
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();

  await env.DB
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(sessionId, user.id, expiresAt)
    .run();

  const redirectPath = user.role === "admin" ? "/admin" : "/home";
  const response = redirect(request, redirectPath);

  response.headers.append(
    "Set-Cookie",
    `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 8}`
  );

  return response;
}

async function handleRegister(request, env) {
  if (!env.DB) throw new Error("D1 binding DB not found.");

  const formData = await request.formData();
  const fullName = String(formData.get("full_name") || "").trim();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  // trim ให้ตรงกับ handleLogin ไม่งั้นรหัสที่มี space หัว/ท้ายจะ login ไม่ได้
  const password = String(formData.get("password") || "").trim();
  const passwordConfirm = String(formData.get("password_confirm") || "").trim();

  if (!fullName || !username || !password || !passwordConfirm) {
    return redirect(request, "/register?error=missing");
  }

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return redirect(request, "/register?error=username");
  }

  if (password.length < 8) {
    return redirect(request, "/register?error=password_short");
  }

  if (password !== passwordConfirm) {
    return redirect(request, "/register?error=password_mismatch");
  }

  const existingUser = await env.DB
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE LIMIT 1")
    .bind(username)
    .first();

  if (existingUser) {
    return redirect(request, "/register?error=exists");
  }

  const passwordHash = await hashPassword(password);

  // is_active = 0 → รอ admin กด Enable ในหน้า Manage Users ก่อนถึงจะ login ได้
  await env.DB
    .prepare(
      "INSERT INTO users (username, password, full_name, role, is_active) VALUES (?, ?, ?, 'user', 0)"
    )
    .bind(username, passwordHash, fullName)
    .run();

  return redirect(request, "/login?success=registered");
}

async function handleChangePassword(request, env, user) {
  const formData = await request.formData();
  const currentPassword = String(formData.get("current_password") || "").trim();
  const newPassword = String(formData.get("new_password") || "").trim();
  const newPasswordConfirm = String(formData.get("new_password_confirm") || "").trim();

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return redirect(request, "/account/password?error=missing");
  }

  if (newPassword.length < 8) {
    return redirect(request, "/account/password?error=password_short");
  }

  if (newPassword !== newPasswordConfirm) {
    return redirect(request, "/account/password?error=password_mismatch");
  }

  const row = await env.DB
    .prepare("SELECT password FROM users WHERE id = ? LIMIT 1")
    .bind(user.id)
    .first();

  const result = await verifyPassword(currentPassword, row ? row.password : "");
  if (!result.ok) {
    return redirect(request, "/account/password?error=current");
  }

  const newHash = await hashPassword(newPassword);
  await env.DB
    .prepare("UPDATE users SET password = ? WHERE id = ?")
    .bind(newHash, user.id)
    .run();

  // ตัด session อื่นทั้งหมดของบัญชีนี้ เหลือเครื่องที่กำลังเปลี่ยนรหัสอยู่
  const sessionId = getCookie(request, "session_id");
  await env.DB
    .prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?")
    .bind(user.id, sessionId)
    .run();

  return redirect(request, "/account/password?success=1");
}

async function handleChangeUserRole(request, env, adminUser) {
  const formData = await request.formData();
  const userId = Number(String(formData.get("user_id") || "").trim());
  const role = String(formData.get("role") || "").trim();

  const allowedRoles = ["admin", "staff", "user"];

  if (!userId || !allowedRoles.includes(role)) {
    return redirect(request, "/admin/users?error=role");
  }

  // ห้ามเปลี่ยน role ตัวเอง — กัน admin คนสุดท้ายลดสิทธิ์ตัวเองจนไม่มีใครจัดการระบบได้
  if (userId === Number(adminUser.id)) {
    return redirect(request, "/admin/users?error=self");
  }

  const target = await env.DB
    .prepare("SELECT id FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first();

  if (!target) {
    return redirect(request, "/admin/users?error=role");
  }

  await env.DB
    .prepare("UPDATE users SET role = ? WHERE id = ?")
    .bind(role, userId)
    .run();

  return redirect(request, "/admin/users?success=role");
}

async function handleAdminResetPassword(request, env, adminUser) {
  const formData = await request.formData();
  const userId = Number(String(formData.get("user_id") || "").trim());

  if (!userId) {
    return redirect(request, "/admin/users?error=reset");
  }

  const target = await env.DB
    .prepare("SELECT id, username FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first();

  if (!target) {
    return redirect(request, "/admin/users?error=reset");
  }

  const tempPassword = generateTempPassword();
  const tempHash = await hashTempPassword(tempPassword);

  await env.DB
    .prepare("UPDATE users SET password = ? WHERE id = ?")
    .bind(tempHash, userId)
    .run();

  // ตัดทุก session ของผู้ใช้นั้น — รหัสเดิม/เครื่องเดิมใช้ไม่ได้อีก
  await env.DB
    .prepare("DELETE FROM sessions WHERE user_id = ?")
    .bind(userId)
    .run();

  // render หน้าโดยตรง (ไม่ redirect) เพื่อโชว์รหัสชั่วคราวครั้งเดียว ไม่ให้ค้างใน URL/history
  const users = await env.DB
    .prepare(
      "SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id ASC"
    )
    .all();

  return html(
    adminUsersPage(adminUser, users.results || [], null, null, {
      username: target.username,
      tempPassword,
    })
  );
}

async function handleLogout(request, env) {
  const sessionId = getCookie(request, "session_id");

  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }

  const response = redirect(request, "/login");

  response.headers.append(
    "Set-Cookie",
    "session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  );

  return response;
}

async function handleCreateUser(request, env) {
  const formData = await request.formData();

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "user").trim();

  const allowedRoles = ["admin", "staff", "user"];

  if (!username || !password || !fullName) {
    return redirect(request, "/admin/users?error=missing");
  }

  if (!allowedRoles.includes(role)) {
    return redirect(request, "/admin/users?error=role");
  }

  const existingUser = await env.DB
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE LIMIT 1")
    .bind(username)
    .first();

  if (existingUser) {
    return redirect(request, "/admin/users?error=exists");
  }

const passwordHash = await hashPassword(password);

  await env.DB
    .prepare(
      "INSERT INTO users (username, password, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)"
    )
    .bind(username, passwordHash, fullName, role)
    .run();

  return redirect(request, "/admin/users?success=created");
}

async function handleToggleUser(request, env) {
  const formData = await request.formData();

  const userId = String(formData.get("user_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();

  if (!userId || !["0", "1"].includes(nextStatus)) {
    return redirect(request, "/admin/users?error=toggle");
  }

  await env.DB
    .prepare("UPDATE users SET is_active = ? WHERE id = ?")
    .bind(Number(nextStatus), Number(userId))
    .run();

  return redirect(request, "/admin/users?success=updated");
}

async function handleStoreTemplate(request, env) {
  const formData = await request.formData();

  const deviceTypeName = String(formData.get("device_type_name") || "").trim();
  const templateName = String(formData.get("template_name") || "").trim();
  const templateText = String(formData.get("template_text") || "").trim();
  const fieldsJson = String(formData.get("fields_json") || "").trim();
  const isActive = String(formData.get("is_active") || "1") === "1" ? 1 : 0;

  if (!deviceTypeName || !templateName || !templateText || !fieldsJson) {
    return redirect(request, "/admin/templates?error=missing");
  }

  const fields = parseFieldsJson(fieldsJson);
  if (!fields.length) {
    return redirect(request, "/admin/templates?error=fields");
  }

  const deviceTypeId = await getOrCreateDeviceType(env, deviceTypeName);

  const insertedTemplate = await env.DB
    .prepare(
      `
      INSERT INTO config_templates (
        device_type_id,
        name,
        template_text,
        is_active,
        updated_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
    )
    .bind(deviceTypeId, templateName, templateText, isActive)
    .run();

  const templateId = insertedTemplate.meta.last_row_id;

  await saveTemplateFields(env, templateId, fields);

  return redirect(request, "/admin/templates?success=created");
}

async function handleUpdateTemplate(request, env) {
  const formData = await request.formData();

  const templateId = String(formData.get("template_id") || "").trim();
  const deviceTypeName = String(formData.get("device_type_name") || "").trim();
  const templateName = String(formData.get("template_name") || "").trim();
  const templateText = String(formData.get("template_text") || "").trim();
  const fieldsJson = String(formData.get("fields_json") || "").trim();
  const isActive = String(formData.get("is_active") || "1") === "1" ? 1 : 0;

  if (
    !templateId ||
    !deviceTypeName ||
    !templateName ||
    !templateText ||
    !fieldsJson
  ) {
    return redirect(request, "/admin/templates?error=missing");
  }

  const fields = parseFieldsJson(fieldsJson);
  if (!fields.length) {
    return redirect(request, `/admin/templates/edit?id=${templateId}`);
  }

  const deviceTypeId = await getOrCreateDeviceType(env, deviceTypeName);

  await env.DB
    .prepare(
      `
      UPDATE config_templates
      SET device_type_id = ?,
          name = ?,
          template_text = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .bind(deviceTypeId, templateName, templateText, isActive, Number(templateId))
    .run();

  await env.DB
    .prepare("DELETE FROM template_fields WHERE template_id = ?")
    .bind(Number(templateId))
    .run();

  await saveTemplateFields(env, Number(templateId), fields);

  return redirect(request, "/admin/templates?success=updated");
}

async function handleCloneTemplate(request, env) {
  const formData = await request.formData();
  const templateId = String(formData.get("template_id") || "").trim();

  if (!templateId) {
    return redirect(request, "/admin/templates?error=notfound");
  }

  const sourceTemplate = await env.DB
    .prepare(
      `
      SELECT 
        id,
        device_type_id,
        name,
        template_text,
        is_active
      FROM config_templates
      WHERE id = ?
      LIMIT 1
      `
    )
    .bind(Number(templateId))
    .first();

  if (!sourceTemplate) {
    return redirect(request, "/admin/templates?error=notfound");
  }

  const clonedTemplate = await env.DB
    .prepare(
      `
      INSERT INTO config_templates (
        device_type_id,
        name,
        template_text,
        is_active,
        updated_at
      )
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      `
    )
    .bind(
      sourceTemplate.device_type_id,
      `${sourceTemplate.name} - Copy`,
      sourceTemplate.template_text
    )
    .run();

  const newTemplateId = clonedTemplate.meta.last_row_id;

  const sourceFields = await env.DB
    .prepare(
      `
      SELECT
        field_key,
        source_key,
        label,
        input_type,
        placeholder,
        default_value,
        is_required,
        sort_order,
        transform_type,
        transform_value,
        options_text
      FROM template_fields
      WHERE template_id = ?
      ORDER BY sort_order ASC, id ASC
      `
    )
    .bind(Number(templateId))
    .all();

  for (const field of sourceFields.results || []) {
    await env.DB
      .prepare(
        `
        INSERT INTO template_fields (
          template_id,
          field_key,
          source_key,
          label,
          input_type,
          placeholder,
          default_value,
          is_required,
          sort_order,
          transform_type,
          transform_value,
          options_text
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        newTemplateId,
        field.field_key,
        field.source_key || null,
        field.label,
        field.input_type || "text",
        field.placeholder || "",
        field.default_value || "",
        field.is_required ? 1 : 0,
        Number(field.sort_order || 0),
        field.transform_type || "raw",
        field.transform_value || "",
        field.options_text || ""
      )
      .run();
  }

  return redirect(request, `/admin/templates/edit?id=${newTemplateId}`);
}

async function handleToggleTemplate(request, env) {
  const formData = await request.formData();

  const templateId = String(formData.get("template_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();

  if (!templateId || !["0", "1"].includes(nextStatus)) {
    return redirect(request, "/admin/templates?error=toggle");
  }

  await env.DB
    .prepare(
      "UPDATE config_templates SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(Number(nextStatus), Number(templateId))
    .run();

  return redirect(request, "/admin/templates?success=updated");
}

async function getOrCreateDeviceType(env, deviceTypeName) {
  let deviceType = await env.DB
    .prepare("SELECT id FROM device_types WHERE name = ? LIMIT 1")
    .bind(deviceTypeName)
    .first();

  if (deviceType) return deviceType.id;

  const inserted = await env.DB
    .prepare("INSERT INTO device_types (name, is_active) VALUES (?, 1)")
    .bind(deviceTypeName)
    .run();

  return inserted.meta.last_row_id;
}

function parseFieldsJson(fieldsJson) {
  let fields;

  try {
    fields = JSON.parse(fieldsJson);
  } catch (err) {
    return [];
  }

  if (!Array.isArray(fields)) return [];

  return fields
    .map((field, index) => {
      return {
        field_key: String(field.field_key || "").trim().toUpperCase(),
        label: String(field.label || field.field_key || "").trim(),
        source_key: String(field.source_key || "").trim().toUpperCase(),
        input_type: String(field.input_type || "text").trim(),
        placeholder: String(field.placeholder || "").trim(),
        default_value: String(field.default_value || "").trim(),
        is_required: field.is_required === false ? 0 : 1,
        sort_order: Number(field.sort_order ?? index),
        transform_type: String(field.transform_type || "raw").trim(),
        transform_value: String(field.transform_value || "").trim(),
        options_text: String(field.options_text || "").trim(),
      };
    })
    .filter((field) => field.field_key && field.label);
}

async function saveTemplateFields(env, templateId, fields) {
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];

    await env.DB
      .prepare(
        `
        INSERT INTO template_fields (
          template_id,
          field_key,
          source_key,
          label,
          input_type,
          placeholder,
          default_value,
          is_required,
          sort_order,
          transform_type,
          transform_value,
          options_text
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        templateId,
        field.field_key,
        field.source_key || null,
        field.label,
        field.input_type || "text",
        field.placeholder || "",
        field.default_value || "",
        field.is_required ? 1 : 0,
        Number(field.sort_order ?? index),
        field.transform_type || "raw",
        field.transform_value || "",
        field.options_text || ""
      )
      .run();
  }
}

async function loadTemplateForEdit(env, templateId) {
  const template = await env.DB
    .prepare(
      `
      SELECT 
        config_templates.id,
        config_templates.name,
        config_templates.template_text,
        config_templates.is_active,
        device_types.name AS device_type_name
      FROM config_templates
      LEFT JOIN device_types ON device_types.id = config_templates.device_type_id
      WHERE config_templates.id = ?
      LIMIT 1
      `
    )
    .bind(Number(templateId))
    .first();

  let fields = [];

  if (template) {
    const fieldResult = await env.DB
      .prepare(
        "SELECT * FROM template_fields WHERE template_id = ? ORDER BY sort_order ASC, id ASC"
      )
      .bind(Number(templateId))
      .all();

    fields = fieldResult.results || [];
  }

  return { template, fields };
}

async function loadConfigPageData(env, templateId) {
  const templates = await env.DB
    .prepare(
      `
      SELECT 
        config_templates.id,
        config_templates.name,
        device_types.name AS device_type_name
      FROM config_templates
      LEFT JOIN device_types ON device_types.id = config_templates.device_type_id
      WHERE config_templates.is_active = 1
      ORDER BY device_types.name ASC, config_templates.name ASC
      `
    )
    .all();

  let selectedTemplate = null;
  let fields = [];

  if (templateId) {
    selectedTemplate = await env.DB
      .prepare(
        `
        SELECT 
          config_templates.id,
          config_templates.name,
          config_templates.template_text,
          device_types.name AS device_type_name
        FROM config_templates
        LEFT JOIN device_types ON device_types.id = config_templates.device_type_id
        WHERE config_templates.id = ?
          AND config_templates.is_active = 1
        LIMIT 1
        `
      )
      .bind(Number(templateId))
      .first();

    if (selectedTemplate) {
      const fieldResult = await env.DB
        .prepare(
          "SELECT * FROM template_fields WHERE template_id = ? ORDER BY sort_order ASC, id ASC"
        )
        .bind(Number(templateId))
        .all();

      fields = fieldResult.results || [];
    }
  }

  return {
    templates: templates.results || [],
    selectedTemplate,
    fields,
  };
}

async function handleGenerateConfig(request, env, user) {
  const formData = await request.formData();

  const templateId = String(formData.get("template_id") || "").trim();

  if (!templateId) {
    return redirect(request, "/config?error=missing_template");
  }

  const data = await loadConfigPageData(env, templateId);

  if (!data.selectedTemplate) {
    return redirect(request, "/config");
  }

  const values = {};
  const inputValues = {};

  for (const field of data.fields) {
    if (!field.source_key) {
      const rawValue = String(formData.get(field.field_key) || "").trim();

      inputValues[field.field_key] = rawValue;

      if (field.is_required && !rawValue) {
        return html(
          configPage({
            user,
            templates: data.templates,
            selectedTemplate: data.selectedTemplate,
            fields: data.fields,
            output: "",
            error: `กรุณากรอก ${field.label}`,
            inputValues,
          })
        );
      }

      values[field.field_key] = rawValue || field.default_value || "";
    }
  }

  for (const field of data.fields) {
    const sourceKey = field.source_key || field.field_key;
    const sourceValue = values[sourceKey] ?? "";

    values[field.field_key] = applyTransform(
      sourceValue,
      field.transform_type,
      field.transform_value
    );
  }

  const output = renderTemplate(data.selectedTemplate.template_text, values);

  await env.DB
    .prepare(
      "INSERT INTO config_history (user_id, template_id, input_json, output_config) VALUES (?, ?, ?, ?)"
    )
    .bind(user.id, Number(templateId), JSON.stringify(values), output)
    .run();

  return html(
    configPage({
      user,
      templates: data.templates,
      selectedTemplate: data.selectedTemplate,
      fields: data.fields,
      output,
      error: "",
      inputValues,
    })
  );
}

function renderTemplate(templateText, values) {
  return templateText.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    return values[key] ?? "";
  });
}

function applyTransform(value, transformType, transformValue) {
  if (!transformType || transformType === "raw") {
    return value;
  }

  if (transformType === "number_add") {
    const base = Number(value);
    const add = Number(transformValue || 0);
    if (Number.isNaN(base)) return value;
    return String(base + add);
  }

  if (transformType === "number_subtract") {
    const base = Number(value);
    const subtract = Number(transformValue || 0);
    if (Number.isNaN(base)) return value;
    return String(base - subtract);
  }

  if (transformType === "upper") {
    return String(value).toUpperCase();
  }

  if (transformType === "lower") {
    return String(value).toLowerCase();
  }

  if (transformType === "underscore") {
    return String(value).trim().replace(/\s+/g, "_");
  }

  if (transformType === "replace_space_dash") {
    return String(value).trim().replace(/\s+/g, "-");
  }

  if (transformType === "cidr_ip") {
    return String(value).split("/")[0];
  }

  if (transformType === "cidr_prefix") {
    return String(value).split("/")[1] || "";
  }

  if (transformType === "cidr_mask") {
    const prefix = Number(String(value).split("/")[1]);
    if (Number.isNaN(prefix)) return "";
    return prefixToMask(prefix);
  }

  if (transformType === "cidr_host") {
    const offset = Number(transformValue || 0);
    return cidrHost(value, offset);
  }

  if (transformType === "after_last_underscore") {
    const parts = String(value).split("_");
    return parts[parts.length - 1] || "";
  }

  if (transformType === "before_first_underscore") {
    return String(value).split("_")[0] || "";
  }

  return value;
}

function prefixToMask(prefix) {
  if (prefix < 0 || prefix > 32) return "";

  const mask = [];

  for (let i = 0; i < 4; i++) {
    const bits = Math.max(0, Math.min(8, prefix - i * 8));
    mask.push(bits === 0 ? 0 : 256 - Math.pow(2, 8 - bits));
  }

  return mask.join(".");
}

function ipToNumber(ip) {
  const parts = String(ip).split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.some((part) => part < 0 || part > 255)) {
    return null;
  }

  return parts.reduce((acc, octet) => (acc << 8) + octet, 0) >>> 0;
}

function numberToIp(number) {
  return [
    (number >>> 24) & 255,
    (number >>> 16) & 255,
    (number >>> 8) & 255,
    number & 255,
  ].join(".");
}

function cidrHost(cidr, offset) {
  const ip = String(cidr).split("/")[0];
  const base = ipToNumber(ip);

  if (base === null || Number.isNaN(offset)) return "";

  return numberToIp(base + offset);
}

async function requireLogin(request, env) {
  const sessionId = getCookie(request, "session_id");

  if (!sessionId) {
    return null;
  }

  const user = await env.DB
    .prepare(
      `
      SELECT
        users.id,
        users.username,
        users.full_name,
        users.role,
        users.password
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.id = ?
        AND sessions.expires_at > datetime('now')
        AND users.is_active = 1
      LIMIT 1
      `
    )
    .bind(sessionId)
    .first();

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    // temp$ นำหน้า hash = รหัสชั่วคราวจาก admin ต้องเปลี่ยนก่อนใช้งาน
    must_change_password:
      typeof user.password === "string" && user.password.startsWith("temp$"),
  };
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");

    if (key === name) {
      return value;
    }
  }

  return null;
}

function html(content) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  });
}

function redirect(request, path) {
  const url = new URL(request.url);
  url.pathname = path.split("?")[0];

  const query = path.includes("?") ? path.split("?")[1] : "";
  url.search = query ? "?" + query : "";

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}