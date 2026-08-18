import { parseReminderTime } from "./parseReminderTime";

describe("parseReminderTime", () => {
  it("parses HH:mm into hour/minute numbers", () => {
    expect(parseReminderTime("08:30")).toEqual({ hour: 8, minute: 30 });
  });

  it("parses midnight", () => {
    expect(parseReminderTime("00:00")).toEqual({ hour: 0, minute: 0 });
  });

  it("parses a time without leading zeros", () => {
    expect(parseReminderTime("9:5")).toEqual({ hour: 9, minute: 5 });
  });

  it("parses the last minute of the day", () => {
    expect(parseReminderTime("23:59")).toEqual({ hour: 23, minute: 59 });
  });
});
