import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Verifies the caller's bearer token for raw server routes. Returns a client that acts
 * as that user (RLS applies), or a 401 Response.
 */
export async function authenticateRequest(request: Request): Promise<{ supabase: SupabaseClient<Database>; userId: string } | Response> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return Response.json({ error: "Please sign in to use this feature." }, { status: 401 });
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return Response.json({ error: "Server is not configured." }, { status: 500 });
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  return { supabase, userId: data.user.id };
}
