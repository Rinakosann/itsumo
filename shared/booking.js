// 予約できる日・時間枠の判定（画面とサーバーの両方で使う）。
// 満席・定休日・受付停止日・受付締切を過ぎた日は選べない。
import { CUTOFFS, LIMITS } from './constants.js';
import { todayJST, addDays, weekday, jstTime } from './time.js';

/** その日に予約できるか（枠の空きは別に確認） */
export function isOpenDate(shop, date, blocked = new Set(), now = new Date()) {
  const today = todayJST(now);
  const cutoffDays = CUTOFFS.find((c) => c.id === shop.cutoff)?.days ?? 0;
  if (date < addDays(today, cutoffDays)) return false; // 受付締切
  if (date > addDays(today, LIMITS.bookingDaysAhead)) return false;
  if ((shop.closedDays ?? []).includes(weekday(date))) return false; // 定休日
  if (blocked.has(date)) return false; // 受付停止日
  return true;
}

/** その日の時間枠と残り人数。booked = { "10:00": 3 } */
export function slotsFor(shop, date, booked = {}, now = new Date()) {
  return (shop.slots ?? [])
    .map((s) => ({ time: s.time, capacity: s.capacity, remaining: Math.max(0, s.capacity - (booked[s.time] ?? 0)) }))
    .filter((s) => jstTime(date, s.time) > now.getTime()) // 開始時刻を過ぎた枠は出さない
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** 予約が「完了」か（日時を過ぎたら自動で完了） */
export const isPast = (b, now = Date.now()) => jstTime(b.date, b.time) <= now;
