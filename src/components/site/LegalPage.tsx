import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { LEGAL_UPDATED } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader anchors={false} />
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <p role="note" className="mb-6 rounded-2xl border border-dashed bg-accent px-4 py-3 text-sm text-accent-foreground">
          <strong>Draft:</strong> this is placeholder text and must be reviewed (ideally by a legal professional) before launch.
        </p>
        <h1 className="font-display text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>
        <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-foreground/90 [&_ul]:space-y-1">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
