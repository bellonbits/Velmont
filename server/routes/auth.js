import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  destroyAllSessions,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  syncAdminStatus,
  getUserFromToken,
  SESSION_COOKIE,
} from "../auth.js";

export const authRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed."));
    }
    cb(null, true);
  },
});

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

authRouter.post("/signup", async (req, res) => {
  const { name, email, password, securityQuestion, securityAnswer } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
    return res.status(400).json({ error: "Choose a security question." });
  }
  if (typeof securityAnswer !== "string" || securityAnswer.trim().length < 2) {
    return res.status(400).json({ error: "Security answer must be at least 2 characters." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await hashPassword(password);
  const answerHash = await hashPassword(normalizeAnswer(securityAnswer));
  const info = db
    .prepare(
      "INSERT INTO users (email, password_hash, name, security_question, security_answer_hash) VALUES (?, ?, ?, ?, ?)",
    )
    .run(email, passwordHash, name.trim(), securityQuestion, answerHash);

  syncAdminStatus(Number(info.lastInsertRowid), email);
  const { token } = createSession(Number(info.lastInsertRowid));
  setSessionCookie(res, token);
  res.status(201).json({ user: getUserFromToken(token) });
});

authRouter.post("/security-question", (req, res) => {
  const { email } = req.body ?? {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const user = db
    .prepare("SELECT security_question as securityQuestion FROM users WHERE email = ?")
    .get(email);
  if (!user || !user.securityQuestion) {
    return res.status(404).json({ error: "No account with a security question found for that email." });
  }

  res.json({ question: user.securityQuestion });
});

authRouter.post("/reset-password", async (req, res) => {
  const { email, answer, newPassword } = req.body ?? {};
  if (!isValidEmail(email) || typeof answer !== "string") {
    return res.status(400).json({ error: "Enter a valid email and answer." });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const user = db
    .prepare("SELECT id, security_answer_hash as answerHash FROM users WHERE email = ?")
    .get(email);
  const valid = user?.answerHash && (await verifyPassword(normalizeAnswer(answer), user.answerHash));
  if (!valid) {
    return res.status(401).json({ error: "That answer doesn't match our records." });
  }

  const passwordHash = await hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, user.id);
  destroyAllSessions(user.id);
  res.status(204).end();
});

authRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isValidEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }

  const user = db
    .prepare("SELECT id, email, name, password_hash, avatar_url as avatarUrl FROM users WHERE email = ?")
    .get(email);

  const valid = user && (await verifyPassword(password, user.password_hash));
  if (!valid) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  syncAdminStatus(user.id, user.email);
  const { token } = createSession(user.id);
  setSessionCookie(res, token);
  res.json({ user: getUserFromToken(token) });
});

authRouter.post("/signout", (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) destroySession(token);
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.put("/profile", requireAuth, (req, res) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }

  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), req.user.id);
  res.json({ user: { ...req.user, name: name.trim() } });
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
  db.prepare("UPDATE users SET security_question = ?, security_answer_hash = ? WHERE id = ?").run(
    securityQuestion,
    answerHash,
    req.user.id,
  );

  res.json({ user: { ...req.user, securityQuestion } });
});

authRouter.post("/avatar", requireAuth, (req, res) => {
  upload.single("avatar")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const oldAvatar = db
      .prepare("SELECT avatar_url FROM users WHERE id = ?")
      .get(req.user.id)?.avatar_url;

    const avatarUrl = `/uploads/${req.file.filename}`;
    db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, req.user.id);

    if (oldAvatar) {
      const oldPath = path.join(uploadsDir, path.basename(oldAvatar));
      fs.unlink(oldPath, () => {});
    }

    res.json({ user: { ...req.user, avatarUrl } });
  });
});
