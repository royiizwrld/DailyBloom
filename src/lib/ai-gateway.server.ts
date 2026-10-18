import { createOpenAI } from "@ai-sdk/openai";

const RUN = "X-Lovable-AIG-Run-ID";

export const MODEL = "openai/gpt-6-astra";

/** Create the gateway provider per request. Never call at module scope. */
export function createGateway(apiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(RUN)) headers.set(RUN, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN)?.trim() || undefined;
      return res;
    },
  });
  return { provider, getRunId: () => runId };
}

export const reasoningOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/** Map gateway/SDK errors to a friendly status + message. */
export function friendlyError(err: unknown): { status: number; message: string } {
  const e = err as { statusCode?: number; status?: number; message?: string; cause?: { statusCode?: number } };
  const status = e?.statusCode ?? e?.status ?? e?.cause?.statusCode ?? 500;
  if (status === 429) return { status, message: "The coach is getting a lot of requests. Please wait a moment and try again." };
  if (status === 402) return { status, message: "AI credits have run out for this workspace. Add credits to keep using AI features." };
  if (status === 403) return { status, message: "AI access is currently blocked for this workspace." };
  return { status: status >= 400 && status < 600 ? status : 500, message: "Something went wrong talking to the AI. Please try again." };
}
