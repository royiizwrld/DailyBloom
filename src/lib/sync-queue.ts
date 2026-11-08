import type { HabitData } from "@/types/habit";

/** A serializable database write, so it can be stored offline and replayed later. */
export type SyncOp =
  | { kind: "upsert"; table: string; rows: Record<string, unknown> | Record<string, unknown>[] }
  | { kind: "delete"; table: string; match: Record<string, string> }
  | { kind: "update"; table: string; values: Record<string, unknown>; match: Record<string, string> };

export interface QueueItem {
  id: string;
  label: string;
  ops: SyncOp[];
  attempts: number;
}

type Res = PromiseLike<{ error: { message: string; code?: string } | null }>;
// Minimal shape of the db client we need; keeps this module testable.
export interface SyncDb {
  from(table: string): any;
}

const qKey = (u: string) => `daily-bloom:outbox:${u}`;
const cKey = (u: string) => `daily-bloom:cache:${u}`;

export function readQueue(userId: string): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(qKey(userId)) ?? "[]"); } catch { return []; }
}
export function writeQueue(userId: string, q: QueueItem[]) {
  try { localStorage.setItem(qKey(userId), JSON.stringify(q)); } catch { /* storage full */ }
}
export function enqueue(userId: string, item: QueueItem) {
  writeQueue(userId, [...readQueue(userId), item]);
}

export function readCache(userId: string): HabitData | null {
  try { const r = localStorage.getItem(cKey(userId)); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function writeCache(userId: string, d: HabitData) {
  try { localStorage.setItem(cKey(userId), JSON.stringify(d)); } catch { /* storage full */ }
}

export async function runOp(db: SyncDb, op: SyncOp) {
  let q: any;
  if (op.kind === "upsert") q = db.from(op.table).upsert(op.rows);
  else {
    q = op.kind === "delete" ? db.from(op.table).delete() : db.from(op.table).update(op.values);
    for (const [k, v] of Object.entries(op.match)) q = q.eq(k, v);
  }
  const { error } = await (q as Res);
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
}

/** Network-type failures are retried later; anything else (bad data, permissions) is dropped. */
export const isNetworkError = (e: unknown) => {
  const m = String((e as Error)?.message ?? e).toLowerCase();
  return (typeof navigator !== "undefined" && !navigator.onLine) || /fetch|network|timeout|load failed|offline/.test(m);
};

/** Replays queued items in order. Stops at the first network failure so order is preserved. */
export async function flushQueue(db: SyncDb, userId: string): Promise<{ synced: number; dropped: string[]; remaining: number }> {
  const q = readQueue(userId);
  let synced = 0;
  const dropped: string[] = [];
  while (q.length) {
    const item = q[0]!;
    try {
      for (const op of item.ops) await runOp(db, op);
      synced++;
      q.shift();
    } catch (e) {
      if (isNetworkError(e)) break;
      item.attempts++;
      if (item.attempts >= 3) { dropped.push(item.label); q.shift(); } else break;
    }
    writeQueue(userId, q);
  }
  writeQueue(userId, q);
  return { synced, dropped, remaining: q.length };
}
