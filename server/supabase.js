import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side use only. Bypasses RLS, so this must
// never be imported into frontend code or have its key exposed to the browser.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export const AVATARS_BUCKET = "avatars";
export const PRODUCTS_BUCKET = "products";
