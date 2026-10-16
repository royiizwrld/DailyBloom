# Habit & Routine Tracker — Plan

## Visual direction
Warm, motivating "paper + ink" look: off-white/charcoal surfaces, one vivid accent (coral), habit colors as soft tinted cards, Space Grotesk headings + DM Sans body. Mobile-first card layout, 48px+ tap targets, bottom tab bar on mobile / sidebar on desktop. Light/dark toggle (defaults to system, saved).

## Pages
- **Today (/)** — date with prev/next arrows (edit past days), progress ring "4 of 6 done", checklist grouped by category or routine (toggle), filters by category/routine, one-tap check/undo, optional note per check-in, weekly progress chip for "X per week" habits (stays visible until target met). Confetti + congrats message once per day when all due habits are done (skipped if reduced motion).
- **Habits (/habits)** — list, create/edit dialog (name, icon/emoji picker, color, category, frequency, routine, reminder label), archive, delete. Manage custom categories and routines. "Bulk Add Habits" button. "Clear sample data" button.
- **Habit detail (/habits/$id)** — current/longest streak, 30-day completion rate, per-habit monthly heatmap with month selector, history list with notes.
- **History (/history)** — overall monthly heatmap (% of due habits done per day), month selector, category/routine filters.
- **Stats (/stats)** — weekly completion line chart (12 weeks), completion by category bar chart, best/worst weekdays, streak leaderboard.
- **AI Coach** — floating button on every page opening a side panel.

## Habit logic (single data context)
- Frequency types: daily, specific weekdays, X times per week.
- "Due today": daily → always; weekdays → if today matches; weekly → until target met this week.
- Streaks: daily/weekday habits count consecutive due days completed, ignoring non-due days (today not yet done doesn't break it); weekly habits count consecutive weeks meeting target.
- Everything stored in browser storage; sample habits seeded on first visit.

## Bulk Add
Textarea → AI returns structured habits (name, icon, category, frequency, routine). Editable preview table: rename, change frequency/icon/category/routine, delete rows, "possible duplicate" badge vs existing habits. Saved only on "Confirm & Add". Friendly error on invalid output.

## AI Coach
- Each message sends a compact data summary: habits with frequency, streaks, 30-day rate, weekday completion, recent notes, overall weekly trend.
- System prompt: supportive, non-judgmental, data-only (never invents numbers, says when history is thin), concise, pattern spotting (weekday misses, habits slipping together, streak breaks, overloaded days), small adjustments, weekly review; no medical advice.
- Streaming replies, markdown, typing indicator, starter questions, Clear chat. One conversation kept in browser storage.
- Quick actions: the AI can propose changes (change frequency, move routine, rename to minimum version) shown as action cards; applied only after user clicks Confirm.
- Graceful messages for rate limits (429) and out-of-credits (402).

## Technical details
- TanStack Start; AI calls run in the app's own server functions/server routes (equivalent to an edge function — API key never reaches the browser), via Lovable AI Gateway with the default model. Streaming chat at a server route; bulk-parse uses strict JSON schema output plus zod validation.
- No database needed (localStorage per request); Lovable Cloud is only required if we later add accounts/sync.
- Structure: `src/types/habit.ts`, `src/lib/habit-logic.ts` (pure frequency/streak/stats functions, unit-tested), `src/context/HabitsContext.tsx` (state + persistence + hook), components (`HabitCard`, `HabitForm`, `IconPicker`, `Heatmap`, `ProgressRing`, `Confetti`, `FilterBar`, `CoachPanel`, `BulkAddDialog`, `ThemeToggle`), recharts for charts, AI Elements for the chat UI.
- Tests for due/streak rules (daily, weekday skips, weekly targets) and confetti-once-per-day.
