import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, LogOut, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/habit-ui";
import { ModePicker, PalettePicker } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { displayName, useAuth } from "@/context/AuthContext";
import { useInstall } from "@/components/pwa/InstallContext";
import { IosInstallDialog } from "@/components/pwa/IosInstallDialog";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/auth-validation";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Daily Bloom" },
      { name: "description", content: "Manage your profile, appearance, password, install and account." },
      { property: "og:title", content: "Settings · Daily Bloom" },
      { property: "og:description", content: "Manage your Daily Bloom profile and account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const card = "rounded-3xl border bg-card p-5 shadow-card";

function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Make Daily Bloom feel like yours." />
      <section className={card} aria-label="Your account">
        <p className="font-display text-xl font-semibold">{displayName(profile) || "Your account"}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </section>
      <NameForm />
      <section className={card}>
        <h2 className="mb-1 font-display text-lg font-semibold">Appearance</h2>
        <p className="mb-4 text-sm text-muted-foreground">System follows your device setting. Saved to your account.</p>
        <div onClickCapture={() => setTimeout(() => {
          const t = localStorage.getItem("theme");
          const v = t === "light" || t === "dark" ? t : "system";
          if (profile && v !== profile.theme_preference) void updateProfile({ theme_preference: v }).catch(() => toast.error("Couldn't save your theme to your account."));
        }, 0)}>
          <ModePicker />
        </div>
      </section>
      <section className={card}>
        <h2 className="mb-4 font-display text-lg font-semibold">Theme</h2>
        <div onClickCapture={() => setTimeout(() => {
          const p = localStorage.getItem("palette") || "sunrise";
          if (profile && p !== profile.palette) void updateProfile({ palette: p }).catch(() => undefined);
        }, 0)}>
          <PalettePicker />
        </div>
      </section>
      <InstallSection />
      <PasswordForm />
      <section className={card}>
        <h2 className="mb-3 font-display text-lg font-semibold">Legal</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </div>
      </section>
      <section className={card}>
        <Button variant="outline" onClick={logout}><LogOut /> Log out</Button>
      </section>
      <DeleteAccount />
    </div>
  );
}

function NameForm() {
  const { profile, updateProfile } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setFirst(profile?.first_name ?? ""); setLast(profile?.last_name ?? ""); }, [profile?.first_name, profile?.last_name]);
  const err = !first.trim() ? "First name is required." : null;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (err) return;
    setBusy(true);
    try {
      await updateProfile({ first_name: first.trim(), last_name: last.trim() || null });
      toast.success("Name updated");
    } catch (e) {
      toast.error("Couldn't save your name.", { description: (e as Error).message });
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className={card} noValidate>
      <h2 className="mb-4 font-display text-lg font-semibold">Your name</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fn">First name</Label>
          <Input id="fn" value={first} onChange={(e) => setFirst(e.target.value)} aria-invalid={!!err} />
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ln">Last name (optional)</Label>
          <Input id="ln" value={last} onChange={(e) => setLast(e.target.value)} />
        </div>
      </div>
      <Button type="submit" className="mt-4" disabled={busy || !!err}>{busy ? "Saving…" : "Save name"}</Button>
    </form>
  );
}

function PasswordForm() {
  const { user } = useAuth();
  const [cur, setCur] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const errs = validatePassword(p, c);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!cur || Object.keys(errs).length || !user?.email) return;
    setBusy(true);
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: cur });
    if (check.error) { setBusy(false); return toast.error("Your current password is incorrect."); }
    const { error } = await supabase.auth.updateUser({ password: p, current_password: cur } as { password: string });
    setBusy(false);
    if (error) return toast.error("Couldn't change your password.", { description: error.message });
    setCur(""); setP(""); setC(""); setTouched(false);
    toast.success("Password changed");
  };
  return (
    <form onSubmit={save} className={card} noValidate>
      <h2 className="mb-4 font-display text-lg font-semibold">Change password</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cur">Current password</Label>
          <Input id="cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} aria-invalid={touched && !cur} />
          {touched && !cur && <p className="text-sm text-destructive">Enter your current password.</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="np">New password</Label>
            <Input id="np" type="password" autoComplete="new-password" value={p} onChange={(e) => setP(e.target.value)} aria-invalid={touched && !!errs.password} />
            {touched && errs.password && <p className="text-sm text-destructive">{errs.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="np2">Confirm new password</Label>
            <Input id="np2" type="password" autoComplete="new-password" value={c} onChange={(e) => setC(e.target.value)} aria-invalid={touched && !!errs.confirm} />
            {touched && errs.confirm && <p className="text-sm text-destructive">{errs.confirm}</p>}
          </div>
        </div>
      </div>
      <Button type="submit" className="mt-4" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
    </form>
  );
}

function InstallSection() {
  const { canPrompt, isIos, isStandalone, installed, promptInstall } = useInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const [help, setHelp] = useState(false);
  return (
    <section className={card}>
      <h2 className="mb-1 font-display text-lg font-semibold">Install app</h2>
      {isStandalone ? (
        <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" /> App installed</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Add Habit Tracker to your home screen for one-tap access.{installed ? " It looks like it's already installed on this device." : ""}</p>
          <Button onClick={async () => {
            if (canPrompt) await promptInstall();
            else if (isIos) setIosOpen(true);
            else setHelp(true);
          }}><Download /> Install app</Button>
          {help && <p role="status" className="mt-3 text-sm text-muted-foreground">Your browser hasn't offered installation yet. Open your browser menu and choose "Install app" or "Add to Home screen". On a computer, look for the install icon in the address bar.</p>}
        </>
      )}
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </section>
  );
}

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const del = useServerFn(deleteMyAccount);
  const navigate = useNavigate();
  const go = async () => {
    setBusy(true);
    try {
      await del({ data: { confirm: text } });
      await supabase.auth.signOut();
      ["habit-tracker:coach-chat", "habit-tracker:coach-threads"].forEach((k) => localStorage.removeItem(k));
      toast.success("Your account and data were deleted.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error("Couldn't delete your account.", { description: (e as Error).message });
      setBusy(false);
    }
  };
  return (
    <section className={`${card} border-destructive/40`}>
      <h2 className="mb-1 font-display text-lg font-semibold text-destructive">Danger zone</h2>
      <p className="mb-4 text-sm text-muted-foreground">Permanently delete your account, habits, check-ins, notes and goals. This can't be undone.</p>
      <Button variant="destructive" onClick={() => setOpen(true)}><Trash2 /> Delete account and all data</Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>Everything will be removed permanently. Type <strong>DELETE</strong> to confirm.</DialogDescription>
          </DialogHeader>
          <Label htmlFor="del" className="sr-only">Type DELETE to confirm</Label>
          <Input id="del" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" placeholder="DELETE" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={text !== "DELETE" || busy} onClick={go}>{busy ? "Deleting…" : "Delete forever"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
