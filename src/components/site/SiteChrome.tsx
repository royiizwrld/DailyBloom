import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CONTACT_EMAIL } from "@/lib/legal";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 rounded-lg font-display text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`} aria-label="Daily Bloom home">
      <span aria-hidden className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">B</span>
      <span>Daily <span className="text-primary">Bloom</span></span>
    </Link>
  );
}

const ANCHORS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader({ anchors = true }: { anchors?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur [padding-top:env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />
        {anchors && (
          <nav aria-label="Page sections" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            {ANCHORS.map((a) => <a key={a.href} href={a.href} className="rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{a.label}</a>)}
          </nav>
        )}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
            <nav aria-label="Mobile" className="mt-2 flex flex-col gap-1 px-4">
              {anchors && ANCHORS.map((a) => <a key={a.href} href={a.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium hover:bg-accent">{a.label}</a>)}
              <Button variant="outline" className="mt-3" asChild><Link to="/login">Sign in</Link></Button>
              <Button className="mt-2" asChild><Link to="/signup">Get started</Link></Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} Daily Bloom</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
        </nav>
      </div>
    </footer>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-6 [padding-top:max(1.5rem,env(safe-area-inset-top))]">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      </div>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </main>
    </div>
  );
}
