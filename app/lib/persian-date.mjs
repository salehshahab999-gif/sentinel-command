/**
 * Format a date using the Persian calendar with numeric year/month/day parts.
 * @param {Date} date
 * @param {string} [timeZone]
 * @returns {string}
 */
export function formatPersianDate(date, timeZone) {
  const options = {
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
