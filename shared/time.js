// 日付・時刻はすべて日本時間で扱う。

export function todayJST(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(now);
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' の曜日（0=日） */
export function weekday(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** 日本時間の日付＋時刻 → ミリ秒 */
export function jstTime(dateStr, hhmm = '00:00') {
  return Date.parse(`${dateStr}T${hhmm}:00+09:00`);
}

/** 2つの日付の差（日数）。b - a */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}
