import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Deletes every row the caller owns, then the auth user itself. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { confirm: string }) => {
    if (input?.confirm !== "DELETE") throw new Error("Type DELETE to confirm.");
    return input;
  })
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    for (const t of ["completions", "goals", "celebrations", "habits", "routines", "categories"] as const) {
      const { error } = await supabase.from(t).delete().eq("user_id", userId);
      if (error) throw new Error(`Couldn't delete your ${t}: ${error.message}`);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
