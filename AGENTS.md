<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Habit data lives in Lovable Cloud tables (one row set per user, RLS `auth.uid() = user_id`); `src/context/HabitsContext.tsx` applies changes optimistically then writes via `src/lib/cloud-data.ts`, so the UI stays instant and failures surface as a Retry toast.
- Frequency/streak rules are pure functions in `src/lib/habit-logic.ts` (unit-tested) so UI and the server-side coach summary share one source of truth; the check-in day comes from the profile timezone (`todayInZone`).
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate); `/` is the public landing page and the checklist is `/today`.
- `/api/*` AI routes verify the bearer token with `src/lib/request-auth.server.ts`, and the coach builds its data summary server-side from the caller's rows, never from the request body.
- Service worker is registered only by `src/components/pwa/register-sw.ts` (production, non-preview hosts); it caches static assets only and serves `public/offline.html` for failed navigations.
- AI calls (coach chat, bulk add) run in server routes under `src/routes/api/` through the Lovable AI Gateway so the key never reaches the browser.
- Coach markdown excludes the Mermaid plugin; unused diagram dependencies must not enter the startup graph because a graph-layout initialization error prevents all controls from hydrating.
