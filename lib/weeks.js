// League weeks run Monday 00:00 UTC to the next Monday 00:00 UTC.
// A week is identified by the date of its Monday, e.g. "2026-11-09",
// which matches Postgres date_trunc('week', ...) in the database policies.

const DAY = 24 * 60 * 60 * 1000;

function utcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

export function weekKey(date = new Date()) {
  const day = utcDay(date);
  const daysSinceMonday = (day.getUTCDay() + 6) % 7;
  return toKey(new Date(day.getTime() - daysSinceMonday * DAY));
}

export function addWeeks(key, count) {
  const start = Date.parse(`${key}T00:00:00Z`);
  return toKey(new Date(start + count * 7 * DAY));
}

export function weekRange(key) {
  const start = Date.parse(`${key}T00:00:00Z`);
  return {
    key,
    start: new Date(start).toISOString(),
    end: new Date(start + 7 * DAY).toISOString(),
  };
}

export function monthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
  );

  return {
    key: toKey(start).slice(0, 7),
    label: start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// A week belongs to the month its Monday falls in.
export function weeksInMonth(month) {
  const weeks = [];
  let key = weekKey(new Date(month.start));

  if (key < month.start.slice(0, 10)) key = addWeeks(key, 1);

  while (key < month.end.slice(0, 10)) {
    weeks.push(key);
    key = addWeeks(key, 1);
  }

  return weeks;
}

export function weekLabel(key) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
