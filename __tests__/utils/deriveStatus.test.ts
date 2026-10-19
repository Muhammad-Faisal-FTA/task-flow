import { describe, expect, it } from "@jest/globals";
import { deriveStatus } from "@/utils/deriveStatus";

describe("deriveStatus", () => {
  it("treats a date-only due date as today regardless of timezone", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";

    try {
      const today = new Date();
      const dueDate = new Date(Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ));

      expect(deriveStatus(dueDate, false)).toBe("today");
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });
});
