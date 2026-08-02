import { Router } from "express";
import { db } from "../db.js";
import { getUserFromToken } from "../auth.js";
import { SESSION_COOKIE } from "../auth.js";

export const trackRouter = Router();

trackRouter.post("/", (req, res) => {
  const { sessionId, path: pagePath } = req.body ?? {};
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return res.status(400).json({ error: "sessionId is required." });
  }
  if (!pagePath || typeof pagePath !== "string" || pagePath.length > 300) {
    return res.status(400).json({ error: "path is required." });
  }

  const user = getUserFromToken(req.cookies?.[SESSION_COOKIE]);

  db.prepare(
    "INSERT INTO page_views (session_id, path, user_id) VALUES (?, ?, ?)",
  ).run(sessionId, pagePath, user?.id ?? null);

  res.status(204).end();
});
