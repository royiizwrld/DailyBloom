import { supabase } from "@/integrations/supabase/client";

/** Headers carrying the signed-in user's access token for our /api routes. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}
