import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthCtx {
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, "id">>) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function applyThemeFromProfile(p: Pick<Profile, "theme_preference" | "palette">) {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", p.theme_preference);
  localStorage.setItem("palette", p.palette);
  const dark = p.theme_preference === "system" ? matchMedia("(prefers-color-scheme: dark)").matches : p.theme_preference === "dark";
  document.documentElement.classList.toggle("dark", dark);
  if (p.palette === "sunrise") delete document.documentElement.dataset["palette"];
  else document.documentElement.dataset["palette"] = p.palette;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) return setProfile(null);
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data ?? null);
    if (data) {
      applyThemeFromProfile(data);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && data.timezone === "UTC" && tz !== "UTC") {
        await supabase.from("profiles").update({ timezone: tz }).eq("id", uid);
        setProfile({ ...data, timezone: tz });
      }
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "SIGNED_OUT") {
        setTimeout(() => void loadProfile(s?.user.id), 0);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthCtx = {
    ready,
    session,
    user: session?.user ?? null,
    profile,
    refreshProfile: () => loadProfile(session?.user.id),
    updateProfile: async (patch) => {
      if (!session) return;
      const { data, error } = await supabase.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", session.user.id).select().maybeSingle();
      if (error) throw new Error(error.message);
      if (data) setProfile(data);
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export function displayName(p: Profile | null) {
  if (!p) return "";
  return [p.first_name, p.last_name].filter(Boolean).join(" ");
}
