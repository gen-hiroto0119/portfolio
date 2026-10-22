import { z } from "zod";

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatCalendarDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const calendarDateSchema = z
  .union([z.string(), z.date()])
  .transform((value) =>
    value instanceof Date ? formatCalendarDateUTC(value) : value,
  )
  .pipe(
    z
      .string()
      .regex(CALENDAR_DATE_PATTERN, "Expected YYYY-MM-DD date format"),
  );
