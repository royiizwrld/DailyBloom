import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import {
  Bot, CalendarDays, Check, CheckCircle2, ClipboardPaste, Flame, Layers, Moon, PartyPopper, RefreshCw, Repeat, ShieldCheck, Sunrise,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heatmap } from "@/components/Heatmap";
import { ProgressRing, habitStyle } from "@/components/habit-ui";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { useAuth } from "@/context/AuthContext";
import { detectStandalone } from "@/components/pwa/InstallContext";
import { cn } from "@/lib/utils";
import type { HabitColor } from "@/types/habit";

const TITLE = "Daily Bloom — Build habits and keep your streaks";
const DESC = "A simple daily habit tracker: check off habits, keep streaks across daily, weekday and weekly goals, see your calendar heatmap and get gentle AI coaching. Free to use.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (user) navigate({ to: "/today", replace: true });
    else if (detectStandalone()) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

const SAMPLE: { name: string; icon: string; color: HabitColor; meta: string }[] = [
  { name: "Drink a glass of water", icon: "💧", color: "sky", meta: "Every day · 🔥 12 days" },
  { name: "Stretch 10 min", icon: "🧘", color: "teal", meta: "Every day · 🔥 5 days" },
  { name: "Gym session", icon: "🏋️", color: "coral", meta: "Mon, Wed, Fri" },
  { name: "Read 10 pages", icon: "📚", color: "amber", meta: "3× per week · 2/3 this week" },
];

function Hero() {
  const [done, setDone] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date());
  const count = Object.values(done).filter(Boolean).length;
  // Deterministic sample values for the preview heatmap.
  const valueFor = (d: Date) => (d > today ? null : [1, 0.75, 0.5, 1, 0.25, 1, 0.75, 0][(d.getDate() * 7 + d.getMonth()) % 8]!);
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:px-6 md:py-20">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground"><Flame className="size-4" aria-hidden /> Small steps, every day</p>
        <h1 id="hero-title" className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">Build habits that stick and keep your streaks growing.</h1>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">Check off your day in seconds, see your progress on a calendar, and get friendly suggestions when a habit gets hard.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild><Link to="/signup">Get started free</Link></Button>
          <Button size="lg" variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
        </div>
      </div>
      <div className="relative" aria-label="Preview of the daily checklist and calendar using sample data" role="region">
        <span className="absolute -top-3 right-4 z-10 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-card">Sample data</span>
        <div className="space-y-4 rounded-3xl border bg-sidebar p-4 shadow-card md:p-5">
          <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card">
            <ProgressRing value={count / SAMPLE.length}><span className="font-display text-lg font-bold">{count}/{SAMPLE.length}</span></ProgressRing>
            <div>
              <p className="font-display font-semibold">Today</p>
              <p className="text-sm text-muted-foreground">{format(today, "EEEE, d MMMM")}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {SAMPLE.map((h, i) => (
              <li key={h.name} style={habitStyle(h.color)} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card", done[i] && "habit-tint")}>
                <button
                  type="button"
                  aria-pressed={!!done[i]}
                  aria-label={done[i] ? `Undo ${h.name} (sample)` : `Mark ${h.name} done (sample)`}
                  onClick={() => setDone((s) => ({ ...s, [i]: !s[i] }))}
                  className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl transition-transform active:scale-95 motion-reduce:transition-none", done[i] ? "habit-solid text-primary-foreground" : "habit-tint")}
                >
                  {done[i] ? <Check className="size-6" strokeWidth={3} /> : <span aria-hidden>{h.icon}</span>}
                </button>
                <div className="min-w-0">
                  <p className={cn("truncate font-medium", done[i] && "text-muted-foreground line-through")}>{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.meta}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block">
            <Heatmap month={month} onMonthChange={setMonth} today={today} valueFor={valueFor} />
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Layers, title: "Custom habits", body: "Pick an icon, color and category. Choose every day, certain weekdays, or a number of times per week." },
  { icon: CheckCircle2, title: "Daily checklist", body: "Today's due habits in one list. One tap to check off, one tap to undo, and you can go back to earlier days." },
  { icon: CalendarDays, title: "Monthly heatmap", body: "A calendar that shades each day by how much you got done, overall and for each habit." },
  { icon: Flame, title: "Streak tracking", body: "Current and longest streaks that respect each habit's schedule, so rest days never break a streak." },
  { icon: Sunrise, title: "Routines", body: "Group habits into Morning, Afternoon and Evening, and view your day by routine or by category." },
  { icon: Bot, title: "AI habit coach", body: "Ask how your week went or which habit to focus on. It looks at your check-in history and suggests small changes." },
  { icon: ClipboardPaste, title: "Smart bulk add", body: "Paste a description of your routine and get a list of habits to review and edit before anything is saved." },
  { icon: PartyPopper, title: "Confetti celebrations", body: "A little celebration when you finish everything due today. Turns off if your device prefers reduced motion." },
  { icon: Moon, title: "Light and dark mode", body: "Follows your device by default, plus a choice of color themes." },
  { icon: RefreshCw, title: "Sync across devices", body: "Your habits are saved to your account, so they appear on any device you sign in on." },
];

function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-t bg-sidebar/50">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 id="features-title" className="font-display text-3xl font-bold">Everything you need, nothing you don't</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">Built for checking in quickly on your phone and reflecting later.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-3xl border bg-card p-5 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Icon className="size-5" aria-hidden /></span>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { t: "Create your account", b: "Sign up with your email. It takes under a minute." },
    { t: "Add your habits or paste your routine", b: "Add habits one by one, or paste your routine and let bulk add suggest them." },
    { t: "Check in daily and watch your streaks grow", b: "Tick off what you did. Your streaks, calendar and stats update as you go." },
  ];
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 md:px-6">
      <h2 id="how-title" className="font-display text-3xl font-bold">How it works</h2>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.t} className="rounded-3xl border bg-card p-6 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground" aria-hidden>{i + 1}</span>
            <h3 className="mt-4 font-display text-lg font-semibold"><span className="sr-only">Step {i + 1}: </span>{s.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Privacy() {
  return (
    <section aria-labelledby="privacy-title" className="border-t bg-sidebar/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 md:flex-row md:items-start md:px-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><ShieldCheck className="size-6" aria-hidden /></span>
        <div>
          <h2 id="privacy-title" className="font-display text-3xl font-bold">Your habits are yours</h2>
          <ul className="mt-4 max-w-prose space-y-2 text-muted-foreground">
            <li>Your habits, check-ins and notes are linked to your account, and other users can't see them.</li>
            <li>When you use the AI coach or bulk add, the relevant data is sent to an AI model to produce the answer.</li>
            <li>We don't sell your personal data.</li>
            <li>You can delete your account and all its data at any time from Settings.</li>
          </ul>
          <Link to="/privacy" className="mt-4 inline-block font-medium text-primary underline-offset-4 hover:underline">Read the privacy policy</Link>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  { q: "Is it free?", a: "Yes. Creating an account and using the app is free." },
  { q: "What counts toward a streak?", a: "For daily and weekday habits, a streak is the number of scheduled days in a row you checked off. Days a habit isn't scheduled don't break it, and today doesn't count against you until it's over. For 'X times per week' habits, the streak counts consecutive weeks where you hit the target." },
  { q: "Can I use it on my phone?", a: "Yes. It works in your phone's browser, and you can install it to your home screen so it opens like an app." },
  { q: "Does my data sync between devices?", a: "Yes. Everything is saved to your account. Sign in on another device and your habits appear there; changes show up when you refresh or reopen the app." },
  { q: "How does the AI coach use my data?", a: "When you send the coach a message, a summary of your habits, streaks, completion rates, recent notes and goals is sent with it so it can answer. It only uses your own data and gives general habit tips, not medical advice." },
  { q: "Can I delete my account?", a: "Yes. In Settings, choose 'Delete account and all data' and type DELETE to confirm. Your account, habits and history are removed." },
];

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h2 id="faq-title" className="font-display text-3xl font-bold">Questions</h2>
      <Accordion type="single" collapsible className="mt-6">
        {FAQ.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-16 md:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-card">
        <Repeat className="mx-auto size-8" aria-hidden />
        <h2 id="cta-title" className="mt-3 font-display text-3xl font-bold">Start your first streak today</h2>
        <p className="mx-auto mt-2 max-w-prose opacity-90">Set up a few habits in a couple of minutes.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="secondary" asChild><Link to="/signup">Get started free</Link></Button>
          <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild><Link to="/login">Sign in</Link></Button>
        </div>
      </div>
    </section>
  );
}

// keep addDays import used for tree-shaking safety in sample generation
void addDays;
