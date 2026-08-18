import { toYMD, getTodayString } from "./date";

describe("toYMD", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toYMD(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("pads single-digit months and days", () => {
    expect(toYMD(new Date(2026, 8, 1))).toBe("2026-09-01");
  });

  it("handles December correctly (0-indexed month)", () => {
    expect(toYMD(new Date(2026, 11, 25))).toBe("2026-12-25");
  });
});

describe("getTodayString", () => {
  it("matches toYMD(new Date()) at call time", () => {
    expect(getTodayString()).toBe(toYMD(new Date()));
  });
});
