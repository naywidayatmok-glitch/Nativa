import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { NATIVA_PATTERNS } from "./src/data/nativaQuestions.ts";
import { calculateAssessmentResult } from "./src/lib/nativaScoring.ts";
import type {
  AssessmentRecord,
  ChildRecord,
  ParentSubmission,
  ReportExtra,
  UserAccount,
  UserRole,
  UserStatus,
} from "./src/types/nativa.ts";

interface StoredUser extends UserAccount {
  passwordHash: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

interface NativaDatabase {
  users: StoredUser[];
  sessions: SessionRecord[];
  children: ChildRecord[];
  assessments: AssessmentRecord[];
  parentSubmissions: ParentSubmission[];
  reports: Record<string, ReportExtra>;
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "nativa-db.json");

function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, usedSalt, 32).toString("hex");
  return `${usedSalt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(password, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(expected, "hex"));
}

function sanitizeUser(user: StoredUser): UserAccount {
  const { passwordHash: _ignored, ...safe } = user;
  return safe;
}

function createEmptyDatabase(): NativaDatabase {
  return {
    users: [],
    sessions: [],
    children: [],
    assessments: [],
    parentSubmissions: [],
    reports: {},
    lastUpdated: new Date().toISOString(),
  };
}

function loadDb(): NativaDatabase {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const empty = createEmptyDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<NativaDatabase>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      children: Array.isArray(parsed.children) ? parsed.children : [],
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      parentSubmissions: Array.isArray(parsed.parentSubmissions) ? parsed.parentSubmissions : [],
      reports: parsed.reports && typeof parsed.reports === "object" ? parsed.reports : {},
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    const empty = createEmptyDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

function saveDb(db: NativaDatabase): void {
  db.lastUpdated = new Date().toISOString();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tempPath, DB_PATH);
}

let db = loadDb();

function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
  return token;
}

function extractBearerToken(req: express.Request): string {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

function getAuthenticatedUser(req: express.Request): StoredUser | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId && u.status === "ACTIVE");
  return user || null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // Auth status (checks whether initial Admin setup is complete)
  app.get("/api/auth/status", (_req, res) => {
    const hasAdmin = db.users.some((u) => u.role === "ADMIN");
    return res.json({ hasAdmin, userCount: db.users.length });
  });

  // First-time Admin activation (only permitted once when no Admin exists)
  app.post("/api/auth/bootstrap-admin", (req, res) => {
    if (db.users.some((u) => u.role === "ADMIN")) {
      return res.status(409).json({
        error: "Akun Admin utama sudah diaktifkan. Silakan masuk menggunakan email dan password.",
      });
    }
    const { name, email, password } = req.body ?? {};
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ error: "Nama dan email Admin wajib diisi." });
    }
    if (cleanPassword.length < 10) {
      return res.status(400).json({ error: "Password Admin minimal 10 karakter." });
    }

    const adminUser: StoredUser = {
      id: "USR-001",
      name: cleanName,
      email: cleanEmail,
      role: "ADMIN",
      status: "ACTIVE",
      childIds: [],
      passwordHash: hashPassword(cleanPassword),
      createdAt: new Date().toISOString(),
    };

    db.users.push(adminUser);
    saveDb(db);
    const token = createSession(adminUser.id);
    return res.status(201).json({ user: sanitizeUser(adminUser), token });
  });

  // Restore session
  app.get("/api/auth/me", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
    }
    return res.json({ user: sanitizeUser(user) });
  });

  // Standard email + password login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const normalized = String(email || "").trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
      return res.status(401).json({ error: "Email atau password tidak valid." });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Akun ini sedang dinonaktifkan oleh Admin." });
    }
    const token = createSession(user.id);
    return res.json({ user: sanitizeUser(user), token });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    const token = extractBearerToken(req);
    if (token) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    return res.json({ ok: true });
  });

  // Change own password
  app.post("/api/auth/change-password", (req, res) => {
    const { email, oldPassword, newPassword } = req.body ?? {};
    const normalized = String(email || "").trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan." });
    if (!verifyPassword(String(oldPassword || ""), user.passwordHash)) {
      return res.status(400).json({ error: "Password lama tidak sesuai." });
    }
    if (String(newPassword || "").length < 10) {
      return res.status(400).json({ error: "Password baru minimal 10 karakter." });
    }
    user.passwordHash = hashPassword(String(newPassword));
    user.mustChangePassword = false;
    saveDb(db);
    return res.json({ ok: true });
  });

  // Main bootstrap payload
  app.get("/api/app-data", (_req, res) => {
    return res.json({
      children: db.children,
      assessments: db.assessments,
      parentSubmissions: db.parentSubmissions,
      patterns: NATIVA_PATTERNS,
    });
  });

  // Children CRUD
  app.post("/api/children", (req, res) => {
    const { name, dob, gender, parent, contact, joinedDate, notes } = req.body ?? {};
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      return res.status(400).json({ error: "Nama anak wajib diisi." });
    }
    const yearPrefix = new Date().getFullYear().toString().slice(-2);
    const nextNum = String(db.children.length + 1).padStart(3, "0");
    let candidateId = `FTH-${yearPrefix}${nextNum}`;
    while (db.children.some((c) => c.id === candidateId)) {
      candidateId = `FTH-${yearPrefix}${Math.floor(100 + Math.random() * 900)}`;
    }
    const record: ChildRecord = {
      id: candidateId,
      name: cleanName,
      dob: String(dob || ""),
      gender: gender === "Laki-laki" || gender === "Perempuan" ? gender : "",
      parent: String(parent || "").trim(),
      contact: String(contact || "").trim(),
      joinedDate: String(joinedDate || new Date().toISOString().slice(0, 10)),
      notes: String(notes || "").trim(),
      createdAt: new Date().toISOString(),
    };
    db.children.push(record);
    saveDb(db);
    return res.status(201).json(record);
  });

  app.put("/api/children/:id", (req, res) => {
    const child = db.children.find((c) => c.id === req.params.id);
    if (!child) return res.status(404).json({ error: "Data anak tidak ditemukan." });
    const { name, dob, gender, parent, contact, joinedDate, notes } = req.body ?? {};
    if (name !== undefined && String(name).trim()) child.name = String(name).trim();
    if (dob !== undefined) child.dob = String(dob);
    if (gender !== undefined) child.gender = gender;
    if (parent !== undefined) child.parent = String(parent).trim();
    if (contact !== undefined) child.contact = String(contact).trim();
    if (joinedDate !== undefined) child.joinedDate = String(joinedDate);
    if (notes !== undefined) child.notes = String(notes).trim();
    saveDb(db);
    return res.json(child);
  });

  // Assessments
  app.post("/api/assessments", (req, res) => {
    const {
      childId,
      date,
      age,
      assessor,
      assessmentId,
      notes,
      parent = {},
      observation = {},
      activities = {},
      itemNotes = { parent: {}, observation: {}, activities: {} },
    } = req.body ?? {};

    const child = db.children.find((c) => c.id === childId);
    if (!child) return res.status(400).json({ error: "Pilih anak yang terdaftar terlebih dahulu." });
    if (!date) return res.status(400).json({ error: "Tanggal asesmen wajib diisi." });
    if (!String(assessor || "").trim()) {
      return res.status(400).json({ error: "Nama asesor wajib diisi." });
    }

    const calc = calculateAssessmentResult(parent, observation, activities);
    const hasAnyScore = calc.scores.some((s) => s > 0);
    if (!hasAnyScore) {
      return res.status(400).json({
        error: "Minimal satu item penilaian harus diisi sebelum menghitung hasil NATIVA.",
      });
    }

    const yyyymm = String(date).replace(/-/g, "").slice(0, 6);
    const seq = String(db.assessments.length + 1).padStart(3, "0");
    let finalId = String(assessmentId || "").trim() || `NTV-${yyyymm}-${seq}`;
    if (db.assessments.some((a) => a.id === finalId)) {
      finalId = `NTV-${yyyymm}-${Date.now().toString().slice(-4)}`;
    }

    const record: AssessmentRecord = {
      id: finalId,
      childId: child.id,
      name: child.name,
      date: String(date),
      age: String(age || "").trim(),
      assessor: String(assessor).trim(),
      notes: String(notes || "").trim(),
      scores: calc.scores,
      levels: calc.levels,
      primary: calc.primary,
      secondary: calc.secondary,
      supporting: calc.supporting,
      consistency: calc.consistency,
      parent,
      observation,
      activities,
      itemNotes: {
        parent: itemNotes.parent || {},
        observation: itemNotes.observation || {},
        activities: itemNotes.activities || {},
      },
      createdAt: new Date().toISOString(),
    };

    db.assessments.push(record);
    saveDb(db);
    return res.status(201).json({ assessment: record, result: calc });
  });

  app.get("/api/assessments/:id", (req, res) => {
    const assessment = db.assessments.find((a) => a.id === req.params.id);
    if (!assessment) return res.status(404).json({ error: "Data asesmen tidak ditemukan." });
    const reportExtra = db.reports[assessment.id] || null;
    return res.json({ assessment, reportExtra });
  });

  // Report Builder
  app.get("/api/reports/:assessmentId", (req, res) => {
    return res.json(db.reports[req.params.assessmentId] || null);
  });

  app.put("/api/reports/:assessmentId", (req, res) => {
    const assessmentId = req.params.assessmentId;
    if (!db.assessments.some((a) => a.id === assessmentId)) {
      return res.status(404).json({ error: "Asesmen tidak ditemukan." });
    }
    const payload = req.body ?? {};
    const report: ReportExtra = {
      assessmentId,
      observationFindings: String(payload.observationFindings || ""),
      helpfulSituations: String(payload.helpfulSituations || ""),
      uncomfortableSituations: String(payload.uncomfortableSituations || ""),
      parentVoice: String(payload.parentVoice || ""),
      actionPlan: Array.isArray(payload.actionPlan) ? payload.actionPlan : [],
      followupDate: String(payload.followupDate || ""),
      changes: String(payload.changes || ""),
      effectiveStrategies: String(payload.effectiveStrategies || ""),
      adjustments: String(payload.adjustments || ""),
      nextPlan: String(payload.nextPlan || ""),
      updatedAt: new Date().toISOString(),
    };
    db.reports[assessmentId] = report;
    saveDb(db);
    return res.json(report);
  });

  // Parent Portal & Parent Insight submissions
  app.get("/api/parent-portal", (req, res) => {
    const email = String(req.query.email || "").trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    const linkedIds =
      user && user.role === "ORANG_TUA"
        ? user.childIds
        : db.children.map((c) => c.id);

    const linkedChildren = db.children
      .filter((c) => linkedIds.includes(c.id))
      .map((child) => {
        const subs = db.parentSubmissions
          .filter((s) => s.childId === child.id)
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        return {
          ...child,
          latestSubmission: subs[0] || null,
        };
      });

    const submissions = db.parentSubmissions
      .filter((s) => linkedIds.includes(s.childId))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return res.json({
      children: linkedChildren,
      submissions,
    });
  });

  app.get("/api/parent-insights/latest/:childId", (req, res) => {
    const subs = db.parentSubmissions
      .filter((s) => s.childId === req.params.childId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    if (!subs.length) {
      return res.status(404).json({ error: "Belum ada kiriman Parent Insight untuk anak ini." });
    }
    return res.json(subs[0]);
  });

  app.post("/api/parent-insights", (req, res) => {
    const { childId, answers = {}, notes = "", submittedByEmail = "", submittedByName = "" } =
      req.body ?? {};
    const child = db.children.find((c) => c.id === childId);
    if (!child) return res.status(400).json({ error: "Anak tidak ditemukan." });

    const validAnswers: Record<string, number> = {};
    for (const [k, v] of Object.entries(answers)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= 5) {
        validAnswers[k] = n;
      }
    }

    const answerCount = Object.keys(validAnswers).length;
    if (answerCount < 10) {
      return res.status(400).json({
        error: `Mohon isi lebih banyak pernyataan sebelum mengirim (saat ini ${answerCount} dari 50 item).`,
      });
    }

    const submission: ParentSubmission = {
      id: `PI-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
        db.parentSubmissions.length + 1
      ).padStart(2, "0")}`,
      childId: child.id,
      childName: child.name,
      submittedByEmail: String(submittedByEmail || ""),
      submittedByName: String(submittedByName || child.parent || "Orang Tua"),
      submittedAt: new Date().toISOString(),
      answers: validAnswers,
      answerCount,
      notes: String(notes || "").trim(),
    };

    db.parentSubmissions.push(submission);
    saveDb(db);
    return res.status(201).json(submission);
  });

  // User account management (Admin)
  app.get("/api/users", (_req, res) => {
    return res.json(db.users.map(sanitizeUser));
  });

  app.post("/api/users", (req, res) => {
    const { name, email, role, password, childIds } = req.body ?? {};
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanRole: UserRole =
      role === "ADMIN" || role === "ORANG_TUA" || role === "ASESOR" ? role : "ASESOR";

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ error: "Nama lengkap dan email wajib diisi." });
    }
    if (cleanPassword.length < 10) {
      return res.status(400).json({ error: "Password awal minimal 10 karakter." });
    }
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: "Email tersebut sudah terdaftar." });
    }

    const parsedChildIds = Array.isArray(childIds)
      ? childIds.map((s) => String(s).trim()).filter(Boolean)
      : String(childIds || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const newUser: StoredUser = {
      id: `USR-${String(db.users.length + 1).padStart(3, "0")}`,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      status: "ACTIVE",
      childIds: cleanRole === "ORANG_TUA" ? parsedChildIds : [],
      passwordHash: hashPassword(cleanPassword),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);
    return res.status(201).json(sanitizeUser(newUser));
  });

  app.patch("/api/users/:email/status", (req, res) => {
    const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
    const status: UserStatus = req.body?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const user = db.users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!user) return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    user.status = status;
    if (status === "INACTIVE") {
      db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    }
    saveDb(db);
    return res.json(sanitizeUser(user));
  });

  app.post("/api/users/:email/reset-password", (req, res) => {
    const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
    const password = String(req.body?.password || "");
    if (password.length < 10) {
      return res.status(400).json({ error: "Password sementara minimal 10 karakter." });
    }
    const user = db.users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!user) return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    user.passwordHash = hashPassword(password);
    user.mustChangePassword = true;
    saveDb(db);
    return res.json({ ok: true });
  });

  // Diagnostics
  app.get("/api/diagnostics", (_req, res) => {
    return res.json({
      databaseEngine: "NATIVA Production Store (JSON Atomic Persistence)",
      storagePath: "data/nativa-db.json",
      counts: {
        children: db.children.length,
        assessments: db.assessments.length,
        users: db.users.length,
        parentSubmissions: db.parentSubmissions.length,
        reports: Object.keys(db.reports).length,
      },
      collections: [
        "DATABASE ANAK",
        "DATABASE ASESMEN",
        "PARENT INSIGHT",
        "REPORT BUILDER",
        "USERS NATIVA",
      ],
      lastUpdated: db.lastUpdated,
    });
  });

  // Mount Vite middleware in dev or serve static dist in production
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`NATIVA server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
