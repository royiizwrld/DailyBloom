import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Check, History, Leaf, Mic, MicOff, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputButton, PromptInputFooter, PromptInputProvider, PromptInputSubmit, PromptInputTextarea, usePromptInputController } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useHabits } from "@/context/HabitsContext";
import { buildCoachSummary } from "@/lib/coach-summary";
import { frequencyLabel } from "@/lib/habit-logic";
import type { Frequency, Habit } from "@/types/habit";

const CHAT_KEY = "habit-tracker:coach-chat";
const STARTERS = [
  "Which habits am I struggling with?",
  "Why do I keep missing my gym days?",
  "How was my week?",
  "Which habit should I focus on first?",
  "Am I too ambitious with my list?",
  "Am I on track with my goals?",
];

type Action = { habitId: string; label: string; patch: Partial<Pick<Habit, "frequency" | "routineId" | "name">> };
const ACTION_RE = /\[\[action:(\{[\s\S]*?\})\]\]/g;

function validFrequency(f: unknown): f is Frequency {
  const x = f as Frequency;
  if (!x || typeof x !== "object") return false;
  if (x.type === "daily") return true;
  if (x.type === "weekly") return Number.isInteger(x.times) && x.times >= 1 && x.times <= 7;
  if (x.type === "weekdays") return Array.isArray(x.days) && x.days.length > 0 && x.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return false;
}

function parseActions(text: string, habits: Habit[], routineIds: string[]): { clean: string; actions: Action[] } {
  const actions: Action[] = [];
  const clean = text.replace(ACTION_RE, (_, json: string) => {
    try {
      const a = JSON.parse(json) as Action;
      if (!habits.some((h) => h.id === a.habitId) || !a.patch) return "";
      const patch: Action["patch"] = {};
      if (a.patch.frequency !== undefined && validFrequency(a.patch.frequency)) patch.frequency = a.patch.frequency;
      if (a.patch.routineId !== undefined && (a.patch.routineId === null || routineIds.includes(a.patch.routineId))) patch.routineId = a.patch.routineId;
      if (typeof a.patch.name === "string" && a.patch.name.trim()) patch.name = a.patch.name.trim().slice(0, 80);
      if (Object.keys(patch).length) actions.push({ habitId: a.habitId, label: String(a.label || "Apply suggestion"), patch });
    } catch {
      /* ignore malformed action */
    }
    return "";
  });
  // hide a partially streamed action tag
  return { clean: clean.replace(/\[\[action:[^\]]*$/, "").trim(), actions };
}

export function CoachPanel() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open habit coach"
        className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-hero px-5 font-semibold text-primary-foreground shadow-card transition-transform hover:scale-105 motion-reduce:transition-none md:bottom-6 md:right-6"
      >
        <Leaf className="size-5" /> Coach
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">{open && <CoachChat />}</SheetContent>
      </Sheet>
    </>
  );
}

type Thread = { id: string; title: string; updatedAt: number; messages: UIMessage[] };
const THREADS_KEY = "habit-tracker:coach-threads";

function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (raw) return JSON.parse(raw) as Thread[];
    const old = localStorage.getItem(CHAT_KEY);
    if (old) {
      const msgs = JSON.parse(old) as UIMessage[];
      localStorage.removeItem(CHAT_KEY);
      if (msgs.length) return [{ id: crypto.randomUUID(), title: titleOf(msgs), updatedAt: Date.now(), messages: msgs }];
    }
  } catch { /* ignore */ }
  return [];
}
function titleOf(msgs: UIMessage[]) {
  const first = msgs.find((m) => m.role === "user");
  const t = first?.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim() ?? "";
  return t ? (t.length > 48 ? t.slice(0, 48) + "…" : t) : "New chat";
}

function CoachChat() {
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [activeId, setActiveId] = useState<string>(() => crypto.randomUUID());
  const [showHistory, setShowHistory] = useState(false);
  const save = (next: Thread[]) => { setThreads(next); localStorage.setItem(THREADS_KEY, JSON.stringify(next)); };
  const active = threads.find((t) => t.id === activeId);
  const persist = (msgs: UIMessage[]) => {
    if (!msgs.length) return;
    const rest = threads.filter((t) => t.id !== activeId);
    save([{ id: activeId, title: titleOf(msgs), updatedAt: Date.now(), messages: msgs }, ...rest]);
  };
  const del = (id: string) => {
    save(threads.filter((t) => t.id !== id));
    if (id === activeId) setActiveId(crypto.randomUUID());
  };
  return (
    <>
      <SheetHeader className="flex-row items-center justify-between gap-2 border-b p-4 pr-12">
        <SheetTitle className="flex items-center gap-2 font-display">
          <span className="flex size-9 items-center justify-center rounded-full bg-hero text-primary-foreground"><Leaf className="size-5" /></span>
          Habit coach
        </SheetTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)} aria-pressed={showHistory}><History /> History</Button>
          <Button variant="ghost" size="sm" onClick={() => { setActiveId(crypto.randomUUID()); setShowHistory(false); }}><Plus /> New</Button>
        </div>
      </SheetHeader>
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-3">
          {threads.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No past chats yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...threads].sort((a, b) => b.updatedAt - a.updatedAt).map((t) => (
                <li key={t.id} className={`flex items-center gap-2 rounded-xl border p-2 ${t.id === activeId ? "border-primary bg-accent" : "bg-card"}`}>
                  <button type="button" className="min-w-0 flex-1 px-2 py-1 text-left" onClick={() => { setActiveId(t.id); setShowHistory(false); }}>
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.updatedAt).toLocaleString()} · {t.messages.length} messages</div>
                  </button>
                  <Button variant="ghost" size="icon" aria-label="Delete chat" onClick={() => del(t.id)}><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
          {threads.length > 0 && (
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { save([]); setActiveId(crypto.randomUUID()); }}>Clear all history</Button>
          )}
        </div>
      ) : (
        <ChatWindow key={activeId} id={activeId} initial={active?.messages ?? []} onPersist={persist} onClear={() => { del(activeId); }} />
      )}
    </>
  );
}

function ChatWindow({ id, initial, onPersist, onClear }: { id: string; initial: UIMessage[]; onPersist: (m: UIMessage[]) => void; onClear: () => void }) {
  const data = useHabits();
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<{ key: string; action: Action } | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/coach" }), []);
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id,
    messages: initial,
    transport,
    onError: (e) => {
      let msg = e.message;
      try { msg = JSON.parse(e.message).error ?? msg; } catch { /* plain text */ }
      toast.error(msg || "The coach couldn't respond. Please try again.");
    },
  });
  const persistRef = useRef(onPersist);
  persistRef.current = onPersist;
  const lastSaved = useRef(initial.length);
  useEffect(() => {
    if ((status === "ready" || status === "error") && messages.length !== lastSaved.current) {
      lastSaved.current = messages.length;
      persistRef.current(messages);
    }
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text }, { body: { summary: buildCoachSummary(data, data.today) } });
  };
  const routineIds = data.routines.map((r) => r.id);

  const applyAction = (key: string, a: Action) => {
    data.updateHabit(a.habitId, a.patch);
    setApplied((s) => ({ ...s, [key]: true }));
    setPending(null);
    toast.success("Habit updated");
  };

  const describe = (a: Action) => {
    const h = data.habits.find((x) => x.id === a.habitId);
    const parts: string[] = [];
    if (a.patch.frequency) parts.push(`${h ? frequencyLabel(h.frequency) : ""} → ${frequencyLabel(a.patch.frequency)}`);
    if (a.patch.routineId !== undefined) parts.push(`${data.routineName(h?.routineId ?? null)} → ${data.routineName(a.patch.routineId)}`);
    if (a.patch.name) parts.push(`rename to "${a.patch.name}"`);
    return `${h?.name ?? "Habit"}: ${parts.join(", ")}`;
  };

  return (
    <>
      {messages.length > 0 && (
        <div className="flex justify-end border-b px-3 py-1">
          <Button variant="ghost" size="sm" onClick={() => { stop(); setMessages([]); onClear(); }}><Trash2 /> Clear chat</Button>
        </div>
      )}

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Leaf className="size-10 text-primary" />}
              title="Your habit coach"
              description="I look at your check-ins and suggest small, kind adjustments. Ask me anything about your habits."
            />
          ) : (
            messages.map((m, mi) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isLast = mi === messages.length - 1;
              const { clean, actions } = m.role === "assistant" ? parseActions(text, data.habits, routineIds) : { clean: text, actions: [] };
              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.role === "assistant" ? <MessageResponse>{clean}</MessageResponse> : <span className="whitespace-pre-wrap">{clean}</span>}
                    {actions.length > 0 && (!isLast || status === "ready") && (
                      <div className="mt-3 flex flex-col gap-2">
                        {actions.map((a, i) => {
                          const key = `${m.id}-${i}`;
                          return applied[key] ? (
                            <div key={key} className="flex items-center gap-2 rounded-xl bg-success/15 px-3 py-2 text-sm"><Check className="size-4" /> Applied: {a.label}</div>
                          ) : (
                            <Button key={key} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => setPending({ key, action: a })}>
                              {a.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {status === "submitted" && <Shimmer>Looking at your history…</Shimmer>}
          {error && status === "error" && <p className="text-sm text-destructive">The coach couldn't reply. Try again in a moment.</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {pending && (
        <div className="mx-4 mb-2 rounded-2xl border bg-card p-3 shadow-card">
          <div className="mb-1 text-sm font-semibold">Apply this change?</div>
          <div className="mb-3 text-sm text-muted-foreground">{describe(pending.action)}</div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => applyAction(pending.key, pending.action)}><Check /> Confirm</Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}><X /> Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 border-t p-3">
        {messages.length === 0 && (
          <Suggestions>
            {STARTERS.map((s) => <Suggestion key={s} suggestion={s} onClick={send} />)}
          </Suggestions>
        )}
        <PromptInputProvider>
          <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
            <PromptInputTextarea placeholder="Ask your coach… or tap the mic" />
            <PromptInputFooter className="justify-between">
              <MicButton />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </>
  );
}

type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };

function MicButton() {
  const { textInput } = usePromptInputController();
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const baseRef = useRef("");
  useEffect(() => () => recRef.current?.stop(), []);
  const toggle = () => {
    if (listening) { recRef.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { toast.error("Voice input isn't supported in this browser. Try Chrome, Edge or Safari."); return; }
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    baseRef.current = textInput.value ? textInput.value.trimEnd() + " " : "";
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += (e.results[i]?.[0]?.transcript ?? "");
      textInput.setInput(baseRef.current + t);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") toast.error("Microphone access was blocked. Allow it in your browser to use voice.");
      else if (e.error !== "no-speech" && e.error !== "aborted") toast.error("Voice input stopped. Please try again.");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };
  return (
    <PromptInputButton onClick={toggle} aria-label={listening ? "Stop voice input" : "Start voice input"} aria-pressed={listening} className={listening ? "animate-pulse text-destructive" : ""}>
      {listening ? <MicOff /> : <Mic />}
      <span className="text-xs">{listening ? "Listening…" : "Voice"}</span>
    </PromptInputButton>
  );
}
