import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/site/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/auth-validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password · Daily Bloom" },
      { name: "description", content: "Choose a new password for your Daily Bloom account." },
      { property: "og:title", content: "Set a new password · Daily Bloom" },
      { property: "og:description", content: "Choose a new password for your Daily Bloom account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"wait" | "ok" | "bad">("wait");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errs = validatePassword(p, c);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") setReady("ok"); });
    const isRecovery = window.location.hash.includes("type=recovery") || new URLSearchParams(window.location.search).has("code");
    const t = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setReady((r) => (r === "ok" ? r : s.session && isRecovery ? "ok" : s.session ? "ok" : "bad"));
    }, 800);
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p });
    if (error) { setBusy(false); return setError(error.message); }
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { reset: "1" }, replace: true });
  };

  return (
    <AuthLayout title="Set a new password" footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}>
      {ready === "wait" && <p role="status" className="text-muted-foreground">Checking your reset link…</p>}
      {ready === "bad" && (
        <div role="alert">
          <p>This reset link is invalid or has expired.</p>
          <Button className="mt-4" asChild><Link to="/forgot-password">Request a new link</Link></Button>
        </div>
      )}
      {ready === "ok" && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" autoComplete="new-password" value={p} onChange={(e) => setP(e.target.value)} aria-invalid={touched && !!errs.password} />
            {touched && errs.password && <p className="text-sm text-destructive">{errs.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">Confirm new password</Label>
            <Input id="pw2" type="password" autoComplete="new-password" value={c} onChange={(e) => setC(e.target.value)} aria-invalid={touched && !!errs.confirm} />
            {touched && errs.confirm && <p className="text-sm text-destructive">{errs.confirm}</p>}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
