import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

type RateLimitBucket = { count: number; resetAt: number };
const RATE_LIMITS = new Map<string, RateLimitBucket>();

function rateLimit(options: { windowMs: number; max: number }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = RATE_LIMITS.get(key);
    if (!current || current.resetAt <= now) {
      RATE_LIMITS.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > options.max) {
      res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Слишком много запросов. Попробуйте позже." });
    }
    return next();
  };
}

function sameOriginOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.NODE_ENV !== "production") return next();
  const origin = req.get("origin");
  const host = req.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return res.status(403).json({ error: "Запрос отклонён проверкой источника" });
  }
  return next();
}

app.use("/api/auth", rateLimit({ windowMs: 60_000, max: 60 }));
app.use("/api/auth", (req, res, next) => req.method === "GET" ? next() : sameOriginOnly(req, res, next));

// Database file persistence
const DB_FILE = path.join(process.cwd(), "nado_auth_db.json");

interface CanonicalUser {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  primaryEmail: string;
  primaryPhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: "active" | "suspended";
  roles: ("client" | "contractor" | "organizer" | "venue_manager" | "administrator")[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

interface AuthIdentity {
  id: string;
  userId: string;
  provider: "email" | "phone" | "telegram" | "max" | "esia";
  providerSubject: string;
  providerUsername?: string;
  providerEmail?: string;
  providerPhone?: string;
  providerClaims?: any;
  verifiedAt: string;
  linkedAt: string;
  lastUsedAt: string;
  status: "active" | "inactive";
}

interface AuthAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

interface DBState {
  users: CanonicalUser[];
  identities: AuthIdentity[];
  auditLog: AuthAuditEntry[];
}

// Initial dummy database state
let db: DBState = {
  users: [],
  identities: [],
  auditLog: []
};

// Load database
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } else {
      saveDB();
    }
  } catch (e) {
    console.error("Failed to load auth database, starting fresh:", e);
  }
}

// Save database
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save auth database:", e);
  }
}

loadDB();

// Active server sessions
const SESSIONS: Record<string, { userId: string; expiresAt: number }> = {};
// Active OTPs: identifier (email or phone) -> otp details
const OTPS: Record<string, { code: string; expiresAt: number; attempts: number; issuedAt: number; type: "email" | "phone" }> = {};

function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
}

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function validateTelegramInitData(initData: string, botToken: string): { valid: boolean; user?: any; error?: string } {
  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get("hash");
    if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) return { valid: false, error: "Подпись Telegram отсутствует" };
    params.delete("hash");
    const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(receivedHash, "hex"), Buffer.from(calculatedHash, "hex"))) {
      return { valid: false, error: "Подпись Telegram недействительна" };
    }
    const authDate = Number(params.get("auth_date") || 0);
    if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 300) return { valid: false, error: "Данные Telegram устарели" };
    const user = JSON.parse(params.get("user") || "null");
    if (!user?.id) return { valid: false, error: "Профиль Telegram отсутствует" };
    return { valid: true, user };
  } catch {
    return { valid: false, error: "Некорректные данные Telegram" };
  }
}

// Log audit entry
function logAudit(userId: string, action: string, req: express.Request, details?: string) {
  const entry: AuthAuditEntry = {
    id: generateId("audit"),
    timestamp: new Date().toISOString(),
    userId,
    action,
    ip: req.ip || req.headers["x-forwarded-for"] as string || "127.0.0.1",
    userAgent: req.headers["user-agent"],
    details
  };
  db.auditLog.push(entry);
  saveDB();
}

// Create a new session for a user and set the cookie
function createSession(userId: string, res: express.Response) {
  const sessionId = generateId("sess");
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  SESSIONS[sessionId] = { userId, expiresAt };

  res.cookie("nado_prazdnik_sess", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  return sessionId;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET /api/auth/session -> Retrieve active session & user profile
app.get("/api/auth/session", (req, res) => {
  const sessionId = req.cookies.nado_prazdnik_sess;
  if (!sessionId || !SESSIONS[sessionId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sess = SESSIONS[sessionId];
  if (Date.now() > sess.expiresAt) {
    delete SESSIONS[sessionId];
    res.clearCookie("nado_prazdnik_sess");
    return res.status(401).json({ error: "Session expired" });
  }

  const user = db.users.find(u => u.id === sess.userId);
  if (!user) {
    delete SESSIONS[sessionId];
    res.clearCookie("nado_prazdnik_sess");
    return res.status(401).json({ error: "User not found" });
  }
  if (user.status !== "active") {
    delete SESSIONS[sessionId];
    res.clearCookie("nado_prazdnik_sess");
    return res.status(403).json({ error: "Account suspended" });
  }

  // Get linked identities
  const linkedIdentities = db.identities.filter(i => i.userId === user.id);

  res.json({
    user,
    identities: linkedIdentities.map(i => ({
      provider: i.provider,
      providerSubject: i.providerSubject,
      providerUsername: i.providerUsername,
      linkedAt: i.linkedAt,
      verifiedAt: i.verifiedAt
    }))
  });
});

// POST /api/auth/logout -> Log out
app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.cookies.nado_prazdnik_sess;
  if (sessionId) {
    const sess = SESSIONS[sessionId];
    if (sess) {
      logAudit(sess.userId, "logout", req);
      delete SESSIONS[sessionId];
    }
  }
  res.clearCookie("nado_prazdnik_sess");
  res.json({ success: true });
});

// POST /api/auth/email/start -> Start email verification (Generate OTP code)
app.post("/api/auth/email/start", (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const previousOtp = OTPS[normalizedEmail];
  if (previousOtp && Date.now() - previousOtp.issuedAt < 60_000) {
    return res.status(429).json({ error: "Новый код можно запросить через минуту" });
  }
  // Generate random 6-digit code
  const code = generateOtp();
  const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes

  OTPS[normalizedEmail] = {
    code,
    expiresAt,
    attempts: 0,
    issuedAt: Date.now(),
    type: "email"
  };

  if (process.env.NODE_ENV !== "production") console.log(`[DEV OTP EMAIL] ${normalizedEmail}: ${code}`);

  res.json({
    success: true,
    message: "OTP sent successfully",
    expiresInSeconds: 300
  });
});

// POST /api/auth/email/verify -> Verify email OTP and log in / link
app.post("/api/auth/email/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const otp = OTPS[normalizedEmail];

  if (!otp || otp.type !== "email") {
    return res.status(400).json({ error: "OTP request not found or expired" });
  }

  if (Date.now() > otp.expiresAt) {
    delete OTPS[normalizedEmail];
    return res.status(400).json({ error: "OTP expired" });
  }

  if (otp.attempts >= 5) {
    delete OTPS[normalizedEmail];
    return res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
  }

  if (otp.code !== code.trim()) {
    otp.attempts++;
    return res.status(400).json({ error: "Incorrect verification code" });
  }

  // OTP verified successfully!
  delete OTPS[normalizedEmail];

  // Check if we are linking to an existing logged-in session
  const currentSessionId = req.cookies.nado_prazdnik_sess;
  const loggedInSession = currentSessionId ? SESSIONS[currentSessionId] : null;

  // Let's check if an AuthIdentity already exists for this email
  let identity = db.identities.find(i => i.provider === "email" && i.providerSubject === normalizedEmail);

  if (loggedInSession) {
    const currentUserId = loggedInSession.userId;
    // We want to LINK this email to the current logged-in account
    if (identity) {
      if (identity.userId !== currentUserId) {
        // Conflict! This email is already linked to ANOTHER user account
        return res.status(409).json({
          error: "conflict",
          message: "Этот адрес электронной почты уже привязан к другому аккаунту.",
          conflictIdentity: {
            provider: "email",
            subject: normalizedEmail
          }
        });
      } else {
        // Already linked to this user, just return success
        return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
      }
    }

    // Create identity for current user
    const newIdentity: AuthIdentity = {
      id: generateId("ident"),
      userId: currentUserId,
      provider: "email",
      providerSubject: normalizedEmail,
      providerEmail: normalizedEmail,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };

    db.identities.push(newIdentity);
    
    // Update user's primary details if not set
    const userObj = db.users.find(u => u.id === currentUserId);
    if (userObj) {
      userObj.primaryEmail = normalizedEmail;
      userObj.emailVerified = true;
      userObj.updatedAt = new Date().toISOString();
    }
    
    logAudit(currentUserId, "link_email", req, `Linked email: ${normalizedEmail}`);
    saveDB();
    return res.json({ success: true, user: userObj });
  }

  // Normal login/signup flow
  let user: CanonicalUser | undefined;
  if (identity) {
    user = db.users.find(u => u.id === identity!.userId);
  } else {
    // Check if user has another identity but has the same primary email, to suggest merging/conflict resolution
    const duplicateEmailUser = db.users.find(u => u.primaryEmail === normalizedEmail);
    if (duplicateEmailUser) {
      return res.status(409).json({
        error: "conflict",
        message: "Пользователь с такой почтой уже существует. Войдите с помощью привязанного ранее способа, чтобы объединить аккаунты.",
        conflictUserId: duplicateEmailUser.id
      });
    }

    // Create a brand new CanonicalUser
    const newUserId = generateId("usr");
    user = {
      id: newUserId,
      displayName: normalizedEmail.split("@")[0],
      firstName: "",
      lastName: "",
      avatarUrl: "",
      primaryEmail: normalizedEmail,
      primaryPhone: "",
      emailVerified: true,
      phoneVerified: false,
      status: "active",
      roles: ["client"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    db.users.push(user);

    identity = {
      id: generateId("ident"),
      userId: newUserId,
      provider: "email",
      providerSubject: normalizedEmail,
      providerEmail: normalizedEmail,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(identity);

    logAudit(newUserId, "signup_email", req, `Signed up with email: ${normalizedEmail}`);
  }

  user!.lastLoginAt = new Date().toISOString();
  identity.lastUsedAt = new Date().toISOString();
  logAudit(user!.id, "login_email", req);
  saveDB();

  createSession(user!.id, res);
  res.json({ success: true, user });
});

// POST /api/auth/phone/start -> Start phone verification (Generate SMS OTP)
app.post("/api/auth/phone/start", (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  // Normalize phone number (digits only, leading with +)
  let normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.startsWith("8")) {
    normalizedPhone = "7" + normalizedPhone.substring(1);
  }
  if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = "+" + normalizedPhone;
  }

  if (normalizedPhone.length < 10) {
    return res.status(400).json({ error: "Invalid phone number structure" });
  }

  const previousOtp = OTPS[normalizedPhone];
  if (previousOtp && Date.now() - previousOtp.issuedAt < 60_000) {
    return res.status(429).json({ error: "Новый код можно запросить через минуту" });
  }

  // Generate cryptographically secure 6-digit code
  const code = generateOtp();
  const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes

  OTPS[normalizedPhone] = {
    code,
    expiresAt,
    attempts: 0,
    issuedAt: Date.now(),
    type: "phone"
  };

  if (process.env.NODE_ENV !== "production") console.log(`[DEV OTP PHONE] ${normalizedPhone}: ${code}`);

  res.json({
    success: true,
    message: "OTP sent successfully",
    expiresInSeconds: 300
  });
});

// POST /api/auth/phone/verify -> Verify phone OTP
app.post("/api/auth/phone/verify", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Phone and code are required" });
  }

  let normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.startsWith("8")) {
    normalizedPhone = "7" + normalizedPhone.substring(1);
  }
  if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = "+" + normalizedPhone;
  }

  const otp = OTPS[normalizedPhone];

  if (!otp || otp.type !== "phone") {
    return res.status(400).json({ error: "OTP request not found or expired" });
  }

  if (Date.now() > otp.expiresAt) {
    delete OTPS[normalizedPhone];
    return res.status(400).json({ error: "OTP expired" });
  }

  if (otp.attempts >= 5) {
    delete OTPS[normalizedPhone];
    return res.status(429).json({ error: "Too many failed attempts" });
  }

  if (otp.code !== code.trim()) {
    otp.attempts++;
    return res.status(400).json({ error: "Incorrect verification code" });
  }

  delete OTPS[normalizedPhone];

  // Check linking to current session
  const currentSessionId = req.cookies.nado_prazdnik_sess;
  const loggedInSession = currentSessionId ? SESSIONS[currentSessionId] : null;

  let identity = db.identities.find(i => i.provider === "phone" && i.providerSubject === normalizedPhone);

  if (loggedInSession) {
    const currentUserId = loggedInSession.userId;
    if (identity) {
      if (identity.userId !== currentUserId) {
        return res.status(409).json({
          error: "conflict",
          message: "Этот номер телефона уже привязан к другому аккаунту.",
          conflictIdentity: {
            provider: "phone",
            subject: normalizedPhone
          }
        });
      } else {
        return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
      }
    }

    // Link
    const newIdentity: AuthIdentity = {
      id: generateId("ident"),
      userId: currentUserId,
      provider: "phone",
      providerSubject: normalizedPhone,
      providerPhone: normalizedPhone,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(newIdentity);

    const userObj = db.users.find(u => u.id === currentUserId);
    if (userObj) {
      userObj.primaryPhone = normalizedPhone;
      userObj.phoneVerified = true;
      userObj.updatedAt = new Date().toISOString();
    }

    logAudit(currentUserId, "link_phone", req, `Linked phone: ${normalizedPhone}`);
    saveDB();
    return res.json({ success: true, user: userObj });
  }

  // Normal login/signup
  let user: CanonicalUser | undefined;
  if (identity) {
    user = db.users.find(u => u.id === identity.userId);
  } else {
    // Check duplication
    const duplicatePhoneUser = db.users.find(u => u.primaryPhone === normalizedPhone);
    if (duplicatePhoneUser) {
      return res.status(409).json({
        error: "conflict",
        message: "Пользователь с таким телефоном уже существует. Войдите с помощью привязанного ранее способа.",
        conflictUserId: duplicatePhoneUser.id
      });
    }

    // Signup
    const newUserId = generateId("usr");
    user = {
      id: newUserId,
      displayName: `Пользователь ${normalizedPhone.substring(normalizedPhone.length - 4)}`,
      firstName: "",
      lastName: "",
      avatarUrl: "",
      primaryEmail: "",
      primaryPhone: normalizedPhone,
      emailVerified: false,
      phoneVerified: true,
      status: "active",
      roles: ["client"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    db.users.push(user);

    identity = {
      id: generateId("ident"),
      userId: newUserId,
      provider: "phone",
      providerSubject: normalizedPhone,
      providerPhone: normalizedPhone,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(identity);

    logAudit(newUserId, "signup_phone", req, `Signed up with phone: ${normalizedPhone}`);
  }

  user!.lastLoginAt = new Date().toISOString();
  identity.lastUsedAt = new Date().toISOString();
  logAudit(user!.id, "login_phone", req);
  saveDB();

  createSession(user!.id, res);
  res.json({ success: true, user });
});

// POST /api/auth/telegram/validate -> Validate Telegram signin/signup (OIDC simulation or initData verified)
app.post("/api/auth/telegram/validate", (req, res) => {
  const { initData, userDetails } = req.body;
  if (!initData && !userDetails) {
    return res.status(400).json({ error: "Missing telegram authentication payload" });
  }

  let verifiedUserDetails = userDetails;
  if (process.env.NODE_ENV === "production") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(501).json({ error: "provider_not_configured", message: "Вход через Telegram ещё не подключён" });
    }
    if (!initData || typeof initData !== "string") {
      return res.status(401).json({ error: "Требуются подписанные данные Telegram Mini App" });
    }
    const validation = validateTelegramInitData(initData, botToken);
    if (!validation.valid) return res.status(401).json({ error: validation.error });
    verifiedUserDetails = validation.user;
  }

  const tgUserId = verifiedUserDetails?.id || `tg-${crypto.randomInt(1_000_000, 10_000_000)}`;
  const tgUsername = verifiedUserDetails?.username || "telegram_user";
  const displayName = verifiedUserDetails?.first_name || "Пользователь Telegram";

  const currentSessionId = req.cookies.nado_prazdnik_sess;
  const loggedInSession = currentSessionId ? SESSIONS[currentSessionId] : null;

  let identity = db.identities.find(i => i.provider === "telegram" && i.providerSubject === String(tgUserId));

  if (loggedInSession) {
    const currentUserId = loggedInSession.userId;
    if (identity) {
      if (identity.userId !== currentUserId) {
        return res.status(409).json({
          error: "conflict",
          message: "Этот аккаунт Telegram уже привязан к другому пользователю.",
          conflictIdentity: { provider: "telegram", subject: String(tgUserId) }
        });
      }
      return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
    }

    const newIdentity: AuthIdentity = {
      id: generateId("ident"),
      userId: currentUserId,
      provider: "telegram",
      providerSubject: String(tgUserId),
      providerUsername: tgUsername,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(newIdentity);
    logAudit(currentUserId, "link_telegram", req, `Linked Telegram: ${tgUsername}`);
    saveDB();
    return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
  }

  let user: CanonicalUser | undefined;
  if (identity) {
    user = db.users.find(u => u.id === identity.userId);
  } else {
    const newUserId = generateId("usr");
    user = {
      id: newUserId,
      displayName,
      firstName: verifiedUserDetails?.first_name || "",
      lastName: verifiedUserDetails?.last_name || "",
      avatarUrl: verifiedUserDetails?.photo_url || "",
      primaryEmail: "",
      primaryPhone: "",
      emailVerified: false,
      phoneVerified: false,
      status: "active",
      roles: ["client"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    db.users.push(user);

    identity = {
      id: generateId("ident"),
      userId: newUserId,
      provider: "telegram",
      providerSubject: String(tgUserId),
      providerUsername: tgUsername,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(identity);
    logAudit(newUserId, "signup_telegram", req, `Signed up with Telegram user: ${tgUsername}`);
  }

  user!.lastLoginAt = new Date().toISOString();
  identity.lastUsedAt = new Date().toISOString();
  logAudit(user!.id, "login_telegram", req);
  saveDB();

  createSession(user!.id, res);
  res.json({ success: true, user });
});

// POST /api/auth/max/validate -> Validate MAX signin/signup
app.post("/api/auth/max/validate", (req, res) => {
  const { initData, userDetails, simulateNotConfigured } = req.body;
  if (process.env.NODE_ENV === "production") {
    return res.status(501).json({ error: "provider_not_configured", message: "Вход через MAX будет доступен после подключения реального OAuth провайдера" });
  }
  if (simulateNotConfigured) {
    return res.status(501).json({ error: "provider_not_configured", message: "Вход через MAX временно недоступен" });
  }

  const maxUserId = userDetails?.id || `max-${crypto.randomInt(100000, 1000000)}`;
  const maxUsername = userDetails?.username || "max_user";
  const displayName = userDetails?.name || "Пользователь MAX";

  const currentSessionId = req.cookies.nado_prazdnik_sess;
  const loggedInSession = currentSessionId ? SESSIONS[currentSessionId] : null;

  let identity = db.identities.find(i => i.provider === "max" && i.providerSubject === String(maxUserId));

  if (loggedInSession) {
    const currentUserId = loggedInSession.userId;
    if (identity) {
      if (identity.userId !== currentUserId) {
        return res.status(409).json({
          error: "conflict",
          message: "Этот аккаунт MAX уже привязан к другому пользователю.",
          conflictIdentity: { provider: "max", subject: String(maxUserId) }
        });
      }
      return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
    }

    const newIdentity: AuthIdentity = {
      id: generateId("ident"),
      userId: currentUserId,
      provider: "max",
      providerSubject: String(maxUserId),
      providerUsername: maxUsername,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(newIdentity);
    logAudit(currentUserId, "link_max", req, `Linked MAX: ${maxUsername}`);
    saveDB();
    return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
  }

  let user: CanonicalUser | undefined;
  if (identity) {
    user = db.users.find(u => u.id === identity.userId);
  } else {
    const newUserId = generateId("usr");
    user = {
      id: newUserId,
      displayName,
      firstName: userDetails?.name || "",
      lastName: "",
      avatarUrl: "",
      primaryEmail: "",
      primaryPhone: "",
      emailVerified: false,
      phoneVerified: false,
      status: "active",
      roles: ["client"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    db.users.push(user);

    identity = {
      id: generateId("ident"),
      userId: newUserId,
      provider: "max",
      providerSubject: String(maxUserId),
      providerUsername: maxUsername,
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(identity);
    logAudit(newUserId, "signup_max", req, `Signed up with MAX user: ${maxUsername}`);
  }

  user!.lastLoginAt = new Date().toISOString();
  identity.lastUsedAt = new Date().toISOString();
  logAudit(user!.id, "login_max", req);
  saveDB();

  createSession(user!.id, res);
  res.json({ success: true, user });
});

// POST /api/auth/esia/validate -> Validate ЕСИА (Госуслуги) signin/signup
app.post("/api/auth/esia/validate", (req, res) => {
  const { userDetails, simulateNotConfigured } = req.body;
  if (process.env.NODE_ENV === "production") {
    return res.status(501).json({ error: "provider_not_configured", message: "Вход через Госуслуги будет доступен после подключения реального ЕСИА OAuth" });
  }
  if (simulateNotConfigured) {
    return res.status(501).json({ error: "provider_not_configured", message: "Вход через Госуслуги временно недоступен" });
  }

  const esiaId = userDetails?.id || `esia-${crypto.randomInt(100000, 1000000)}`;
  const displayName = userDetails?.name || "Пользователь Госуслуг";

  const currentSessionId = req.cookies.nado_prazdnik_sess;
  const loggedInSession = currentSessionId ? SESSIONS[currentSessionId] : null;

  let identity = db.identities.find(i => i.provider === "esia" && i.providerSubject === String(esiaId));

  if (loggedInSession) {
    const currentUserId = loggedInSession.userId;
    if (identity) {
      if (identity.userId !== currentUserId) {
        return res.status(409).json({
          error: "conflict",
          message: "Этот аккаунт Госуслуг уже привязан к другому пользователю.",
          conflictIdentity: { provider: "esia", subject: String(esiaId) }
        });
      }
      return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
    }

    const newIdentity: AuthIdentity = {
      id: generateId("ident"),
      userId: currentUserId,
      provider: "esia",
      providerSubject: String(esiaId),
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(newIdentity);
    logAudit(currentUserId, "link_esia", req, `Linked Госуслуги`);
    saveDB();
    return res.json({ success: true, user: db.users.find(u => u.id === currentUserId) });
  }

  let user: CanonicalUser | undefined;
  if (identity) {
    user = db.users.find(u => u.id === identity.userId);
  } else {
    const newUserId = generateId("usr");
    user = {
      id: newUserId,
      displayName,
      firstName: userDetails?.firstName || "",
      lastName: userDetails?.lastName || "",
      avatarUrl: "",
      primaryEmail: "",
      primaryPhone: "",
      emailVerified: false,
      phoneVerified: false,
      status: "active",
      roles: ["client"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    db.users.push(user);

    identity = {
      id: generateId("ident"),
      userId: newUserId,
      provider: "esia",
      providerSubject: String(esiaId),
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    };
    db.identities.push(identity);
    logAudit(newUserId, "signup_esia", req, `Signed up with Госуслуги user`);
  }

  user!.lastLoginAt = new Date().toISOString();
  identity.lastUsedAt = new Date().toISOString();
  logAudit(user!.id, "login_esia", req);
  saveDB();

  createSession(user!.id, res);
  res.json({ success: true, user });
});

// GET /api/auth/audit -> Retrieve security audit logs for the current user
app.get("/api/auth/audit", (req, res) => {
  const sessionId = req.cookies.nado_prazdnik_sess;
  if (!sessionId || !SESSIONS[sessionId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sess = SESSIONS[sessionId];
  if (Date.now() > sess.expiresAt) {
    delete SESSIONS[sessionId];
    res.clearCookie("nado_prazdnik_sess");
    return res.status(401).json({ error: "Session expired" });
  }

  const logs = db.auditLog
    .filter(entry => entry.userId === sess.userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ logs });
});

// POST /api/auth/unlink -> Unlink an AuthIdentity
app.post("/api/auth/unlink", (req, res) => {
  const sessionId = req.cookies.nado_prazdnik_sess;
  if (!sessionId || !SESSIONS[sessionId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = SESSIONS[sessionId].userId;
  const { provider } = req.body;

  // Find linked identities
  const userIdentities = db.identities.filter(i => i.userId === userId);
  if (userIdentities.length <= 1) {
    return res.status(400).json({ error: "Cannot disconnect the last login method." });
  }

  const idx = db.identities.findIndex(i => i.userId === userId && i.provider === provider);
  if (idx < 0) {
    return res.status(404).json({ error: "Identity not found" });
  }

  const removedIdentity = db.identities[idx];
  db.identities.splice(idx, 1);

  // If primary email or phone was linked to this, clean it from user
  const userObj = db.users.find(u => u.id === userId);
  if (userObj) {
    if (provider === "email" && userObj.primaryEmail === removedIdentity.providerSubject) {
      userObj.primaryEmail = "";
      userObj.emailVerified = false;
    }
    if (provider === "phone" && userObj.primaryPhone === removedIdentity.providerSubject) {
      userObj.primaryPhone = "";
      userObj.phoneVerified = false;
    }
    userObj.updatedAt = new Date().toISOString();
  }

  logAudit(userId, "unlink_provider", req, `Unlinked provider: ${provider}`);
  saveDB();

  res.json({ success: true });
});

// POST /api/auth/merge/confirm -> Confirm merging two user accounts (e.g., current account merges conflicts)
app.post("/api/auth/merge/confirm", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(501).json({ error: "secure_merge_required", message: "Объединение аккаунтов доступно только после повторной проверки обоих способов входа" });
  }
  const sessionId = req.cookies.nado_prazdnik_sess;
  if (!sessionId || !SESSIONS[sessionId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const primaryUserId = SESSIONS[sessionId].userId;
  const { conflictUserId } = req.body;

  if (!conflictUserId || primaryUserId === conflictUserId) {
    return res.status(400).json({ error: "Invalid conflict user ID" });
  }

  const primaryUser = db.users.find(u => u.id === primaryUserId);
  const conflictUser = db.users.find(u => u.id === conflictUserId);

  if (!primaryUser || !conflictUser) {
    return res.status(404).json({ error: "One of the users was not found" });
  }

  // 1. Move all AuthIdentities of conflictUser to primaryUserId
  db.identities.forEach(i => {
    if (i.userId === conflictUser.id) {
      i.userId = primaryUser.id;
      i.linkedAt = new Date().toISOString();
    }
  });

  // 2. Synchronize user profile contact info
  if (!primaryUser.primaryEmail && conflictUser.primaryEmail) {
    primaryUser.primaryEmail = conflictUser.primaryEmail;
    primaryUser.emailVerified = conflictUser.emailVerified;
  }
  if (!primaryUser.primaryPhone && conflictUser.primaryPhone) {
    primaryUser.primaryPhone = conflictUser.primaryPhone;
    primaryUser.phoneVerified = conflictUser.phoneVerified;
  }
  primaryUser.updatedAt = new Date().toISOString();

  // 3. Keep a log of this merge
  logAudit(primaryUser.id, "merge_accounts", req, `Merged user account: ${conflictUser.id} into primary: ${primaryUser.id}`);

  // Delete the duplicate user
  db.users = db.users.filter(u => u.id !== conflictUser.id);
  saveDB();

  res.json({ success: true, user: primaryUser });
});

// POST /api/auth/dev-login -> Development bypass button route
app.post("/api/auth/dev-login", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Bypass disabled in production" });
  }

  const testUserId = "usr-test-developer";
  let user = db.users.find(u => u.id === testUserId);

  if (!user) {
    user = {
      id: testUserId,
      displayName: "Тестовый Организатор",
      firstName: "Иван",
      lastName: "Иванов",
      avatarUrl: "",
      primaryEmail: "test@nado.ru",
      primaryPhone: "+79998887766",
      emailVerified: true,
      phoneVerified: true,
      status: "active",
      roles: ["client", "organizer"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    db.users.push(user);

    // Add standard email and phone identity for test user
    db.identities.push({
      id: generateId("ident"),
      userId: testUserId,
      provider: "email",
      providerSubject: "test@nado.ru",
      providerEmail: "test@nado.ru",
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    });

    db.identities.push({
      id: generateId("ident"),
      userId: testUserId,
      provider: "phone",
      providerSubject: "+79998887766",
      providerPhone: "+79998887766",
      verifiedAt: new Date().toISOString(),
      linkedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      status: "active"
    });
  }

  user.lastLoginAt = new Date().toISOString();
  logAudit(user.id, "dev_login", req);
  saveDB();

  createSession(user.id, res);
  res.json({ success: true, user });
});

// Serve assets & SPA fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
