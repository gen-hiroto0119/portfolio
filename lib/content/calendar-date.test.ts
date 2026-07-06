import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calendarDateSchema,
  formatCalendarDateUTC,
} from "./calendar-date.ts";

describe("formatCalendarDateUTC", () => {
  it("formats UTC midnight as YYYY-MM-DD", () => {
    assert.equal(
      formatCalendarDateUTC(new Date("2026-07-03T00:00:00.000Z")),
      "2026-07-03",
    );
  });
});

describe("calendarDateSchema", () => {
  it("accepts Date objects from js-yaml", () => {
    const result = calendarDateSchema.safeParse(
      new Date("2026-07-03T00:00:00.000Z"),
    );
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, "2026-07-03");
    }
  });

  it("accepts quoted YYYY-MM-DD strings", () => {
    const result = calendarDateSchema.safeParse("2026-07-03");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, "2026-07-03");
    }
  });

  it("rejects non-padded date strings", () => {
    const result = calendarDateSchema.safeParse("2026-7-3");
    assert.equal(result.success, false);
  });
});
