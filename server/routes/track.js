import { Router } from "express";
import { getUserFromRequest } from "../auth.js";
import { supabaseAdmin } from "../supabase.js";

export const trackRouter = Router();

trackRouter.post("/", async (req, res) => {
  const { sessionId, path: pagePath } = req.body ?? {};
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return res.status(400).json({ error: "sessionId is required." });
  }
  if (!pagePath || typeof pagePath !== "string" || pagePath.length > 300) {
    return res.status(400).json({ error: "path is required." });
  }

  const user = await getUserFromRequest(req);

  await supabaseAdmin
    .from("page_views")
    .insert({ session_id: sessionId, path: pagePath, user_id: user?.id ?? null });

  res.status(204).end();
});
