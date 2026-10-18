import { createFileRoute } from "@tanstack/react-router";
import { Output, streamText } from "ai";
import { z } from "zod/v4";

const schema = z.object({
  habits: z.array(
    z.object({
      name: z.string(),
      icon: z.string(),
      category: z.enum(["Health", "Fitness", "Coding", "Reading", "Learning", "Mindfulness", "Social", "Other"]),
      frequencyType: z.enum(["daily", "weekdays", "weekly"]),
      weekdays: z.array(z.number().int()).describe("0=Sun..6=Sat; only for weekdays type, else empty"),
      timesPerWeek: z.number().int().nullable().describe("only for weekly type, else null"),
      routine: z.enum(["Morning", "Afternoon", "Evening"]).nullable(),
    }),
  ),
});

export const Route = createFileRoute("/api/bulk-parse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { friendlyError, createGateway, MODEL, reasoningOptions } = await import("@/lib/ai-gateway.server");
        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.slice(0, 4000) : "";
        } catch {
          /* handled below */
        }
        if (!text.trim()) return Response.json({ error: "Please describe your routine first." }, { status: 400 });
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI isn't configured yet." }, { status: 500 });
        try {
          const { provider } = createGateway(apiKey);
          const result = streamText({
            model: provider.responses(MODEL),
            instructions:
              "Extract a list of distinct habits from the user's messy routine description. Use short, actionable names (e.g. 'Read 10 pages'). Pick one fitting emoji icon. 'weekdays' frequency means specific days (Mon-Fri = [1,2,3,4,5]). 'weekly' means N times per week. Infer routine from context (before bed/after 10pm = Evening). Ignore anything that isn't a habit.",
            prompt: text,
            output: Output.object({ schema }),
            abortSignal: request.signal,
            maxRetries: 1,
            providerOptions: reasoningOptions,
          });
          const out = await result.output;
          const parsed = schema.safeParse(out);
          if (!parsed.success || parsed.data.habits.length === 0) {
            return Response.json({ error: "I couldn't find any habits in that text. Try listing them more clearly." }, { status: 422 });
          }
          return Response.json(parsed.data);
        } catch (err) {
          console.error("bulk-parse failed", err);
          const f = friendlyError(err);
          const msg = f.status === 500 ? "The AI returned something I couldn't understand. Please try again or rephrase." : f.message;
          return Response.json({ error: msg }, { status: f.status });
        }
      },
    },
  },
});
