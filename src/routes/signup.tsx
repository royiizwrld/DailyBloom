import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/site/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { TERMS_VERSION } from "@/lib/legal";
import { validateSignup, type SignupFields } from "@/lib/auth-validation";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account · Daily Bloom" },
      { name: "description", content: "Create a free Daily Bloom account to track habits and streaks on all your devices." },
      { property: "og:title", content: "Create your account · Daily Bloom" },
      { property: "og:description", content: "Start tracking your habits for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  component: Signup,
});

function Signup() {
  const [f, setF] = useState<SignupFields>({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const errors = validateSignup(f);
  const show = (k: keyof SignupFields) => (touched ? errors[k] : undefined);
  const set = (k: keyof SignupFields) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.keys(errors).length || !agree) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/today`,
        data: {
          first_name: f.firstName.trim(),
          last_name: f.lastName.trim() || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        },
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message.toLowerCase().includes("registered") ? "An account with this email already exists. Try signing in." : navigator.onLine ? error.message : "You're offline. Reconnect and try again.");
      return;
    }
    setSentTo(f.email.trim());
  };

  if (sentTo) return <CheckEmail email={sentTo} />;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free, and takes under a minute."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" value={f.firstName} onChange={set("firstName")} error={show("firstName")} autoComplete="given-name" />
          <Field id="lastName" label="Last name (optional)" value={f.lastName} onChange={set("lastName")} autoComplete="family-name" />
        </div>
        <Field id="email" label="Email" type="email" value={f.email} onChange={set("email")} error={show("email")} autoComplete="email" />
        <Field id="password" label="Password" type="password" value={f.password} onChange={set("password")} error={show("password")} autoComplete="new-password" hint="At least 8 characters." />
        <Field id="confirm" label="Confirm password" type="password" value={f.confirm} onChange={set("confirm")} error={show("confirm")} autoComplete="new-password" />
        <div className="flex items-start gap-3">
          <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" aria-required="true" />
          <Label htmlFor="agree" className="text-sm font-normal leading-snug">
            I agree to the <Link to="/terms" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">Terms and Conditions</Link> and <Link to="/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">Privacy Policy</Link>
          </Label>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={!agree || busy}>{busy ? "Creating account…" : "Create Account"}</Button>
      </form>
    </AuthLayout>
  );
}

function Field({ id, label, error, hint, ...rest }: { id: string; label: string; error?: string | undefined; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...rest} />
      {error ? <p id={`${id}-err`} className="text-sm text-destructive">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function CheckEmail({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const resend = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/today` } });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Email sent again.");
  };
  return (
    <AuthLayout title="Check your email" footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}>
      <div className="flex flex-col items-center text-center">
        <MailCheck className="size-12 text-primary" aria-hidden />
        <p className="mt-4">We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account.</p>
        <p className="mt-2 text-sm text-muted-foreground">Can't find it? Check your spam folder.</p>
        <Button variant="outline" className="mt-6" onClick={resend} disabled={busy}>{busy ? "Sending…" : "Resend email"}</Button>
      </div>
    </AuthLayout>
  );
}
