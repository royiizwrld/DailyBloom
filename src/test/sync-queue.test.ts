import { beforeEach, describe, expect, it } from "vitest";
import { enqueue, flushQueue, readQueue } from "@/lib/sync-queue";

function fakeDb(fail: () => string | null) {
  const calls: string[] = [];
  const q = (desc: string) => {
    const obj: any = {
      eq: (k: string, v: string) => { desc += ` ${k}=${v}`; return obj; },
      then: (res: any) => { calls.push(desc); const m = fail(); return Promise.resolve({ error: m ? { message: m } : null }).then(res); },
    };
    return obj;
  };
  return { calls, from: (t: string) => ({ upsert: () => q(`upsert ${t}`), delete: () => q(`delete ${t}`), update: () => q(`update ${t}`) }) };
}

describe("offline sync queue", () => {
  beforeEach(() => localStorage.clear());

  it("keeps changes queued while the network fails, then syncs them in order", async () => {
    enqueue("u1", { id: "a", label: "check-in", ops: [{ kind: "upsert", table: "completions", rows: {} }], attempts: 0 });
    enqueue("u1", { id: "b", label: "undo", ops: [{ kind: "delete", table: "completions", match: { day: "2026-11-08" } }], attempts: 0 });
    let down = true;
    const db = fakeDb(() => (down ? "Failed to fetch" : null));
    expect((await flushQueue(db, "u1")).remaining).toBe(2);
    down = false;
    const r = await flushQueue(db, "u1");
    expect(r.synced).toBe(2);
    expect(readQueue("u1")).toHaveLength(0);
    expect(db.calls.slice(-2)).toEqual(["upsert completions", "delete completions day=2026-11-08"]);
  });

  it("drops a change after 3 non-network rejections so the queue never gets stuck", async () => {
    enqueue("u1", { id: "a", label: "bad", ops: [{ kind: "upsert", table: "habits", rows: {} }], attempts: 0 });
    const db = fakeDb(() => "violates row-level security");
    await flushQueue(db, "u1");
    await flushQueue(db, "u1");
    const r = await flushQueue(db, "u1");
    expect(r.dropped).toEqual(["bad"]);
    expect(readQueue("u1")).toHaveLength(0);
  });
});
