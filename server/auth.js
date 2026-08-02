import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db } from "./db.js";

export const SESSION_COOKIE = "velmont_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(token, userId, expiresAt);
  return { token, expiresAt };
}

export function destroySession(token) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

// Called on password reset so a stolen/leaked old session can't survive it.
export function destroyAllSessions(userId) {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function touchSession(token) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?").run(expiresAt, token);
}

export function getUserFromToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT users.id, users.email, users.name, users.avatar_url as avatarUrl,
              users.is_admin as isAdminRaw, users.security_question as securityQuestion
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`,
    )
    .get(token);
  if (!row) return null;
  const { isAdminRaw, ...user } = row;
  return { ...user, isAdmin: Boolean(isAdminRaw) };
}

// Admin access is granted by email allowlist (ADMIN_EMAILS in .env), synced
// on every signup/signin — no separate admin invite flow needed for a
// single-owner storefront.
function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function syncAdminStatus(userId, email) {
  const isAdmin = getAdminEmails().includes(email.toLowerCase()) ? 1 : 0;
  db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(isAdmin, userId);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.user = user;

  // Sliding expiration: any authenticated request pushes the session's
  // expiry forward, so active users are never logged out mid-use — only
  // sessions that go a full SESSION_TTL_MS without any activity expire.
  touchSession(token);
  setSessionCookie(res, token);

  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required." });
    next();
  });
}

export function attachUser(req, _res, next) {
  req.user = getUserFromToken(req.cookies?.[SESSION_COOKIE]);
  next();
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
