import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase.js";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Admin access is granted by email allowlist (ADMIN_EMAILS in .env), synced
// into profiles.is_admin right after signup/signin — no separate admin invite
// flow needed for a single-owner storefront.
export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  return getAdminEmails().includes(email.toLowerCase());
}

function serializeProfile(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    isAdmin: profile.is_admin,
    securityQuestion: profile.security_question,
  };
}

function bearerToken(req) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Verifies the bearer token against Supabase Auth without requiring a
// profiles row to already exist — used only by the endpoint that creates
// that row right after signup.
export async function getAuthUserFromRequest(req) {
  const token = bearerToken(req);
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

// Verifies the bearer token and loads the matching profiles row. Returns
// null (never throws) so callers can decide how to respond to a missing/
// invalid token or a not-yet-created profile.
export async function getUserFromRequest(req) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();
  if (!profile) return null;

  return serializeProfile(profile);
}

export async function requireAuth(req, res, next) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.user = user;
  next();
}

// For the one endpoint that runs before a profile row exists (completing
// signup) — verifies identity via Supabase Auth only.
export async function requireSupabaseAuth(req, res, next) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  req.authUser = authUser;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required." });
    next();
  });
}

// Best-effort auth for routes that work with or without a signed-in user
// (e.g. page-view tracking).
export async function attachUser(req, _res, next) {
  req.user = await getUserFromRequest(req);
  next();
}
