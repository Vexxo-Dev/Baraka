import { getRoleByTag, ROLES } from "./roleHelpers";

describe("getRoleByTag", () => {
  it("finds a role by its tag", () => {
    expect(getRoleByTag("parent")).toEqual(
      ROLES.find((r) => r.key === "isParent"),
    );
  });

  it("returns undefined for an unknown tag", () => {
    expect(getRoleByTag("not-a-real-role")).toBeUndefined();
  });

  it("every role in ROLES is findable by its own tag", () => {
    for (const role of ROLES) {
      expect(getRoleByTag(role.tag)).toBe(role);
    }
  });
});
