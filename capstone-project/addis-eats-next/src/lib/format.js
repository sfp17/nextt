// One place for how Addis Eats shows money and time. Every formatter is built
// ONCE, here, at module load (creating an Intl formatter is slow, using one is
// cheap) and shared by server and client components alike, so the same value
// looks the same on every page and in the CSV.
//
// Times are always shown in Addis Ababa time, whatever the server's or the
// visitor's own time zone is, so server and browser render identical text
// (no hydration mismatch) and a Nairobi laptop sees what an Addis kitchen sees.

export const TIME_ZONE = 'Africa/Addis_Ababa';

const etbNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** 1050 → "1,050 ETB"; etb(1050, { unit: false }) → "1,050" (when "ETB" is styled separately or in the header). */
export function etb(amount, { unit = true } = {}) {
  const n = etbNumber.format(Number(amount) || 0);
  return unit ? `${n} ETB` : n;
}

/** 1234 → "1,234": plain counts (orders, items). */
export const count = (n) => etbNumber.format(Number(n) || 0);

/** 37090 → "37.1K ETB": axis ticks and other tight spaces. */
export function etbCompact(amount, { unit = true } = {}) {
  const v = Number(amount) || 0;
  const n = Math.abs(v) >= 1000 ? `${Number((v / 1000).toFixed(1))}K` : `${v}`;
  return unit ? `${n} ETB` : n;
}

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const clock = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' });

/** A timestamp (ms, Date or ISO string) → "14 Oct, 01:35", Addis Ababa time. */
export const when = (t) => dateTime.format(new Date(t));
/** → "01:35" */
export const time = (t) => clock.format(new Date(t));
/** → "14 Oct" */
export const day = (t) => dayMonth.format(new Date(t));

/** → "2026-10-14 01:35": sortable and unambiguous, for exports. */
const isoParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
export function stamp(t) {
  const p = Object.fromEntries(isoParts.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/**
 * "just now", "5 minutes ago", "in 2 minutes", "yesterday".
 * Pass `now` explicitly from components so the server render and the first
 * client render use the same clock (see useNow in the tracking page).
 */
export function relative(t, now = Date.now()) {
  const diff = (new Date(t).getTime() - now) / 1000; // negative = in the past
  if (Math.abs(diff) < 10) return 'just now';
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs || unit === 'second') return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
}
