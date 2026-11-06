import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/site/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { isEmail } from "@/lib/auth-validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password · Daily Bloom" },
      { name: "description", content: "Get a link to reset your Daily Bloom password." },
      { property: "og:title", content: "Reset your password · Daily Bloom" },
      { property: "og:description", content: "Get a link to reset your Daily Bloom password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) return setError("Enter a valid email address.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return setError(navigator.onLine ? error.message : "You're offline. Reconnect and try again.");
    setSent(true);
  };
  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll email you a link to set a new one." footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}>
      {sent ? (
        <div className="flex flex-col items-center text-center" role="status">
          <MailCheck className="size-12 text-primary" aria-hidden />
          <p className="mt-4">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
          <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Send again</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
