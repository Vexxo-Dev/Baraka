import { generateId, generateCustomId } from "./id";

describe("generateId", () => {
  it("produces unique values across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });

  it("returns a non-empty string", () => {
    expect(typeof generateId()).toBe("string");
    expect(generateId().length).toBeGreaterThan(0);
  });
});

describe("generateCustomId", () => {
  it("prefixes with the default 'custom' when no prefix given", () => {
    expect(generateCustomId()).toMatch(/^custom_/);
  });

  it("prefixes with a custom given prefix", () => {
    expect(generateCustomId("niyyah")).toMatch(/^niyyah_/);
  });

  it("produces unique values across many calls", () => {
    const ids = new Set(
      Array.from({ length: 1000 }, () => generateCustomId()),
    );
    expect(ids.size).toBe(1000);
  });
});
