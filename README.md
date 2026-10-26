# Habit Helper Hub

Build a responsive daily Habit & Routine Tracker web app with a clean, motivating, modern design (card layout, mobile-first, large tap targets for checking off habits).

HABITS
- Users can create, edit, archive and delete habits. Each habit has: name, icon (picker from a built-in icon/emoji set), color, category, target frequency, and an optional reminder time label.
- Default categories: Health, Fitness, Coding, Reading, Learning, Mindfulness, Social, Other. Users can add custom categories.
- Target frequency options: every day, specific weekdays (e.g. Mon/Wed/Fri), or X times per week (e.g. 3 times a week). The app must understand each type when deciding what is "due" and whether the target was met.

DAILY CHECKLIST (home screen)
- Show today's due habits as a checklist grouped by category, with one-tap check-off and undo.
- Show a daily progress indicator (e.g. 4 of 6 done) and the date, with arrows to view and edit previous days.
- For "X times per week" habits, show weekly progress (e.g. 2/3 this week) and keep the habit visible until the weekly target is hit.

ROUTINES
- Users can group habits into routines such as Morning, Afternoon and Evening. Checklist can be viewed by routine or by category.

STREAKS & HISTORY
- Calculate the current streak and longest streak per habit, respecting its frequency type. For weekly-target habits, count consecutive weeks where the target was met. Do not break a streak on days a habit isn't due.
- Monthly calendar heatmap showing completion history, with a month selector. Provide one overall heatmap (percentage of due habits completed each day) and a per-habit heatmap when a habit is opened.
- A habit detail page with streaks, completion rate for the last 30 days, and a history list.

DATA
- Persist everything in localStorage (habits, categories, routines, completion logs).
- Seed a few sample habits on first load, with a "Clear sample data" button.

Organize the code with separate components, shared types, and one data context/hook that holds the streak and frequency logic.                                                                                                                                                                                                                                                                           Add a confetti animation that fires once when all habits due today are checked off (not again if the user unchecks and rechecks the same day), with a short congratulatory message. Respect the "reduce motion" accessibility setting. Add a dark mode / light mode toggle that defaults to the system setting and saves the choice.                                                                                                                                                                                                                    Add filtering on the checklist and history by category and routine. Add a Stats page showing: overall completion rate by week for the last 12 weeks (line chart), completion rate by category (bar chart), best and worst days of the week, and a leaderboard of habits by current streak. Allow an optional short note on each day's check-in (e.g. "felt tired, did a short version"), shown on the habit detail page.                                                                                                                                                                                                                                            Add a "Bulk Add Habits" feature. The user can paste or type a messy description of their routine, for example:

"Morning: wake up 6am, drink water, 20 min stretching, read 10 pages

Gym Mon/Wed/Fri, code 1 hour weekdays, journal before bed, no phone after 10pm"

Send it to the AI through an edge function and have it return structured JSON: a list of habits with name, suggested icon, category, frequency (daily, specific weekdays, or X per week) and routine (Morning/Afternoon/Evening). Show an editable preview where the user can rename, change frequency, icon, category or routine, delete rows, and flag possible duplicates of existing habits. Nothing is saved until the user clicks "Confirm & Add". Handle invalid AI output with a friendly error.                                                                                                                                                                                                                                                           Add an AI habit coach as a floating chat button that opens a side panel on every page.

BEHAVIOR

- The coach analyzes the user's check-in history and answers questions like "Which habits am I struggling with?", "Why do I keep missing my gym days?", "How was my week?", "Which habit should I focus on first?", "Am I too ambitious with my list?"

- On each message, send the AI a compact summary of the user's data: each habit with its frequency, current and longest streak, 30-day completion rate, completion by day of week, recent notes, and the overall weekly trend.

- It looks for patterns: habits that are often missed on the same weekday, habits that slip together, habits with streak breaks, and overloaded days. It explains what it sees using the data, and suggests small, specific adjustments such as reducing frequency, shortening a habit to a "minimum version", stacking it after an existing habit, or moving it to a different routine.

- It can propose a weekly review and gentle accountability messages, always in a supportive, non-judgmental tone. It never shames the user for missed days.

- It only uses the data provided, never invents numbers, and says so when there isn't enough history. Answers are concise and practical. It gives general habit-building guidance, not medical or mental health advice.

- Include starter questions, markdown rendering, streaming responses, a "Clear chat" button and a typing indicator.

- Add quick actions on suggestions such as "Change this habit to 3x per week" or "Move to Evening routine", applied only after the user confirms.

IMPLEMENTATION

- Use Lovable Cloud with an edge function to call the AI model so no API key is exposed in the browser. Handle errors and rate limits gracefully.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bd084178-dcbd-4861-bf56-731510ff9cce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
