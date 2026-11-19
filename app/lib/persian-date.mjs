/**
 * Format a date using the Persian calendar while keeping stable numeric
 * year/month/day segments for the dashboard.
 */
export function formatPersianDate(date: Date, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  };
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", options).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  return `${values.year}/${values.month}/${values.day}`;
}
