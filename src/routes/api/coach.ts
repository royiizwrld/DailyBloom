import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM = `You are a warm, practical habit coach inside a habit tracking app.

RULES
- Use ONLY the data in the DATA SUMMARY. Never invent numbers. If there is little history (e.g. habits younger than ~2 weeks or few check-ins), say so plainly.
- Be supportive and non-judgmental. Never shame the user for missed days. Frame misses as information.
- Be concise: short paragraphs or bullets, max ~180 words unless asked for a weekly review.
- Look for patterns: habits often missed on the same weekday, habits that slip together, streak breaks, overloaded days/routines, notes that explain struggles.
- Suggest small, specific adjustments: reduce frequency, a "minimum version", stack after an existing habit, move to another routine.
- General habit-building guidance only — no medical or mental-health advice; suggest a professional if the user raises such concerns.
- The summary is the user's real, current habits, check-ins and goals. Refer to habits by name, cite their actual numbers, and comment on goal pace (check-ins vs target and days left) when relevant.
- You may write a weekly review or a gentle accountability message when asked.

QUICK ACTIONS
When you recommend a concrete change to an existing habit, append one line per change at the very end, exactly in this format (valid JSON, habit id from the data):
[[action:{"habitId":"<id>","label":"Change Gym to 2x per week","patch":{"frequency":{"type":"weekly","times":2}}}]]
Allowed patch keys: "frequency" ({"type":"daily"} | {"type":"weekdays","days":[0-6]} | {"type":"weekly","times":1-7}), "routineId" (one of the routine ids in the data or null), "name" (e.g. a minimum version). Only propose actions you explained in the text. The app asks the user to confirm before applying.`;

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateRequest } = await import("@/lib/request-auth.server");
        const auth = await authenticateRequest(request);
        if (auth instanceof Response) return auth;
        const { friendlyError, createGateway, MODEL, reasoningOptions } = await import("@/lib/ai-gateway.server");
        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return Response.json({ error: "AI isn't configured yet." }, { status: 500 });
        let body: { messages?: UIMessage[]; summary?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
        if (!messages.length) return Response.json({ error: "No message" }, { status: 400 });
        // Build the summary on the server from the caller's own rows only (RLS-scoped client).
        let summary: string;
        try {
          const [{ loadUserData, todayInZone }, { buildCoachSummary }] = await Promise.all([import("@/lib/cloud-data"), import("@/lib/coach-summary")]);
          const { data: prof } = await auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
          const data = await loadUserData(auth.supabase);
          summary = JSON.stringify(buildCoachSummary(data, todayInZone(prof?.timezone ?? "UTC"))).slice(0, 20000);
        } catch (e) {
          console.error("coach summary failed", e);
          return Response.json({ error: "Couldn't load your habit history. Please try again." }, { status: 500 });
        }
        try {
          const { provider, getRunId } = createGateway(apiKey, request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined);
          const result = streamText({
            model: provider.responses(MODEL),
            instructions: `${SYSTEM}\n\nDATA SUMMARY (JSON):\n${summary}`,
            messages: await convertToModelMessages(messages),
            abortSignal: request.signal,
            maxRetries: 1,
            providerOptions: reasoningOptions,
          });
          const res = result.toUIMessageStreamResponse({
            originalMessages: messages,
            onError: (err) => {
              console.error("coach stream error", err);
              return friendlyError(err).message;
            },
          });
          const id = getRunId();
          if (id) res.headers.set("X-Lovable-AIG-Run-ID", id);
          return res;
        } catch (err) {
          console.error("coach failed", err);
          const f = friendlyError(err);
          return Response.json({ error: f.message }, { status: f.status });
        }
      },
    },
  },
});
