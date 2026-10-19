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
- All habit data lives in browser localStorage via `src/context/HabitsContext.tsx`; frequency/streak rules are pure functions in `src/lib/habit-logic.ts` (unit-tested) so UI and AI coach share one source of truth.
- AI calls (coach chat, bulk add) run in server routes under `src/routes/api/` through the Lovable AI Gateway so the key never reaches the browser.
