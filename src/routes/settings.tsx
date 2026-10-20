import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/habit-ui";
import { ModePicker, PalettePicker } from "@/components/ThemeToggle";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Daily Bloom" },
      { name: "description", content: "Choose your color theme and light, dark or system appearance." },
      { property: "og:title", content: "Settings · Daily Bloom" },
      { property: "og:description", content: "Personalise Daily Bloom with themes and appearance modes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Make Daily Bloom feel like yours." />
      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <h2 className="mb-1 font-display text-lg font-semibold">Appearance</h2>
        <p className="mb-4 text-sm text-muted-foreground">System follows your device setting.</p>
        <ModePicker />
      </section>
      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 font-display text-lg font-semibold">Theme</h2>
        <PalettePicker />
      </section>
    </div>
  );
}
