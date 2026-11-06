import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/site/SiteChrome";
import { supabase } from "@/integrations/supabase/client";

type Search = { redirect?: string | undefined; reset?: string | undefined };

/** Only allow same-origin relative paths as a post-login destination. */
export function safeRedirect(r: string | undefined) {
  if (!r) return "/today";
  try {
    const u = new URL(r, "http://x");
    if (u.origin !== "http://x" && typeof window !== "undefined" && u.origin !== window.location.origin) return "/today";
    const path = u.pathname + u.search + u.hash;
    return path.startsWith("/") && !path.startsWith("//") && path !== "/" && !path.startsWith("/login") ? path : "/today";
  } catch {
    return "/today";
  }
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Daily Bloom" },
      { name: "description", content: "Sign in to Daily Bloom to check in on your habits and streaks." },
      { property: "og:title", content: "Sign in · Daily Bloom" },
      { property: "og:description", content: "Sign in to your Daily Bloom habit tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
    reset: typeof s["reset"] === "string" ? s["reset"] : undefined,
  }),
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      setError(m.includes("confirm") ? "Please confirm your email first — check your inbox for the link." : m.includes("invalid") ? "That email and password don't match. Try again or reset your password." : navigator.onLine ? error.message : "You're offline. Reconnect and try again.");
      return;
    }
    navigate({ href: safeRedirect(search.redirect), replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see today's habits."
      footer={<>New here? <Link to="/signup" search={search.redirect ? { redirect: search.redirect } : {}} className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      {search.reset === "1" && (
        <Alert className="mb-4"><AlertDescription>Your password was updated. Sign in with your new password.</AlertDescription></Alert>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthLayout>
  );
}
