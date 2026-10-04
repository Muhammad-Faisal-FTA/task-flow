import { describe, expect, it } from "@jest/globals";
import { nextRepeatDate } from "@/utils/repeatDate";

describe("nextRepeatDate", () => {
  it("advances daily and weekly dates without changing the time of day", () => {
    const date = new Date("2026-09-26T00:00:00.000Z");

    expect(nextRepeatDate(date, "daily").toISOString()).toBe("2026-09-27T00:00:00.000Z");
    expect(nextRepeatDate(date, "weekly").toISOString()).toBe("2026-10-03T00:00:00.000Z");
  });

  it("skips weekends for weekday repeats", () => {
    const friday = new Date("2026-09-25T00:00:00.000Z");

    expect(nextRepeatDate(friday, "weekdays").toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });

  it("clamps monthly recurrences to the last day of shorter months", () => {
    const januaryEnd = new Date("2026-01-31T00:00:00.000Z");

    expect(nextRepeatDate(januaryEnd, "monthly").toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });
});