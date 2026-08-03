import { Router } from "express";
import multer from "multer";
import {
  hashPassword,
  verifyPassword,
  isAdminEmail,
  requireAuth,
  requireSupabaseAuth,
} from "../auth.js";
import { supabaseAdmin, AVATARS_BUCKET } from "../supabase.js";

export const authRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed."));
    }
    cb(null, true);
  },
});

export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is your mother's maiden name?",
  "What was the make of your first car?",
];

// Case/whitespace shouldn't matter for a security-answer match.
function normalizeAnswer(answer) {
  return answer.trim().toLowerCase();
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// Called right after a successful client-side supabase.auth.signUp() to
// create the matching profiles row (name, security question, admin status).
authRouter.post("/profile", requireSupabaseAuth, async (req, res) => {
  const { name, securityQuestion, securityAnswer } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }
  if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
    return res.status(400).json({ error: "Choose a security question." });
  }
  if (typeof securityAnswer !== "string" || securityAnswer.trim().length < 2) {
    return res.status(400).json({ error: "Security answer must be at least 2 characters." });
  }

  const answerHash = await hashPassword(normalizeAnswer(securityAnswer));

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: req.authUser.id,
      email: req.authUser.email,
      name: name.trim(),
      security_question: securityQuestion,
      security_answer_hash: answerHash,
      is_admin: isAdminEmail(req.authUser.email),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ user: serializeProfile(profile) });
});

// Re-checks the ADMIN_EMAILS allowlist — called right after sign-in so admin
// status stays in sync even if the allowlist changed since the account was created.
authRouter.post("/sync-admin", requireSupabaseAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({ is_admin: isAdminEmail(req.authUser.email) })
    .eq("id", req.authUser.id)
    .select()
    .single();

  if (error) return res.status(404).json({ error: "Profile not found." });
  res.json({ user: serializeProfile(profile) });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.put("/profile", requireAuth, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({ name: name.trim() })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: serializeProfile(profile) });
});

authRouter.put("/security-question", requireAuth, async (req, res) => {
  const { securityQuestion, securityAnswer } = req.body ?? {};
  if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
    return res.status(400).json({ error: "Choose a security question." });
  }
  if (typeof securityAnswer !== "string" || securityAnswer.trim().length < 2) {
    return res.status(400).json({ error: "Security answer must be at least 2 characters." });
  }

  const answerHash = await hashPassword(normalizeAnswer(securityAnswer));
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({ security_question: securityQuestion, security_answer_hash: answerHash })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: serializeProfile(profile) });
});

authRouter.post("/avatar", requireAuth, (req, res) => {
  upload.single("avatar")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", req.user.id)
      .single();

    const ext = (req.file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".jpg").toLowerCase();
    const path = `${req.user.id}-${Date.now()}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: publicUrl } = supabaseAdmin.storage.from(AVATARS_BUCKET).getPublicUrl(path);

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", req.user.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    if (existing?.avatar_url) {
      const oldPath = existing.avatar_url.split(`${AVATARS_BUCKET}/`).pop();
      if (oldPath) supabaseAdmin.storage.from(AVATARS_BUCKET).remove([oldPath]).catch(() => {});
    }

    res.json({ user: serializeProfile(profile) });
  });
});

authRouter.post("/security-question", async (req, res) => {
  const { email } = req.body ?? {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("security_question")
    .eq("email", email)
    .single();

  if (!profile?.security_question) {
    return res.status(404).json({ error: "No account with a security question found for that email." });
  }

  res.json({ question: profile.security_question });
});

authRouter.post("/reset-password", async (req, res) => {
  const { email, answer, newPassword } = req.body ?? {};
  if (!isValidEmail(email) || typeof answer !== "string") {
    return res.status(400).json({ error: "Enter a valid email and answer." });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, security_answer_hash")
    .eq("email", email)
    .single();

  const valid =
    profile?.security_answer_hash &&
    (await verifyPassword(normalizeAnswer(answer), profile.security_answer_hash));
  if (!valid) {
    return res.status(401).json({ error: "That answer doesn't match our records." });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });
  if (error) return res.status(400).json({ error: error.message });

  res.status(204).end();
});
