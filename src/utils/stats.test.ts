import { computeStreak } from "./stats";

describe("computeStreak", () => {
  it("returns 0 for no logs", () => {
    expect(computeStreak([], "2026-08-15")).toBe(0);
  });

  it("counts a single completion today as a streak of 1", () => {
    expect(computeStreak([{ date: "2026-08-15" }], "2026-08-15")).toBe(1);
  });

  it("counts a single completion yesterday (not yet completed today) as a streak of 1", () => {
    // Regression case for plan 4.x: yesterday's completion still counts as
    // "at risk" today, not reset to 0, until a full day is skipped.
    expect(computeStreak([{ date: "2026-08-14" }], "2026-08-15")).toBe(1);
  });

  it("increments correctly across consecutive days (plan 4.4)", () => {
    const logs = [
      { date: "2026-08-13" },
      { date: "2026-08-14" },
      { date: "2026-08-15" },
    ];
    expect(computeStreak(logs, "2026-08-15")).toBe(3);
  });

  it("resets to 0 after skipping a full day (plan 4.5)", () => {
    const logs = [{ date: "2026-08-12" }, { date: "2026-08-13" }];
    // Nothing on 8-14, today is 8-15 — the most recent log is 2 days back.
    expect(computeStreak(logs, "2026-08-15")).toBe(0);
  });

  it("ignores duplicate log rows for the same day", () => {
    const logs = [
      { date: "2026-08-15" },
      { date: "2026-08-15" },
      { date: "2026-08-14" },
    ];
    expect(computeStreak(logs, "2026-08-15")).toBe(2);
  });

  it("stops counting at the first gap, ignoring older unconnected streaks", () => {
    const logs = [
      { date: "2026-08-15" },
      { date: "2026-08-14" },
      // gap on 8-13
      { date: "2026-08-12" },
      { date: "2026-08-11" },
    ];
    expect(computeStreak(logs, "2026-08-15")).toBe(2);
  });

  it("recomputes correctly when today advances with no new logs (foreground day-rollover bug)", () => {
    const logs = [{ date: "2026-08-14" }, { date: "2026-08-15" }];
    expect(computeStreak(logs, "2026-08-15")).toBe(2);
    // Device clock/day advances five days with nothing new logged — streak
    // must collapse to 0 rather than staying frozen at 2.
    expect(computeStreak(logs, "2026-08-20")).toBe(0);
  });

  it("handles a streak spanning a month boundary", () => {
    const logs = [{ date: "2026-07-31" }, { date: "2026-08-01" }];
    expect(computeStreak(logs, "2026-08-01")).toBe(2);
  });

  it("safely handles undefined/invalid today and corrupted log entries", () => {
    // @ts-expect-error testing invalid today parameter
    expect(computeStreak([{ date: "2026-08-15" }], undefined)).toBe(0);
    // @ts-expect-error testing corrupted log entries
    expect(computeStreak([{ date: undefined }, { date: "2026-08-15" }], "2026-08-15")).toBe(1);
  });
});
