// 店舗データを画面に渡す形にする。
import { prisma } from './db.js';
import { todayJST, addDays } from '../shared/time.js';
import { LIMITS } from '../shared/constants.js';

/** { ja, en } → 旅行者向け（英語。翻訳がなければ原文＋失敗フラグ） */
export const en = (o) => (o ? { text: o.en || o.ja || '', ja: o.ja || '', failed: Boolean(o.ja) && !o.en } : null);

export function toPublic(s) {
  const x = s.extra ?? {};
  return {
    id: s.id, category: s.category, area: s.area, name: en(s.name), address: s.address, lat: s.lat, lng: s.lng, placeId: s.placeId,
    description: en(s.description), priceJPY: s.priceJPY, durationMin: s.durationMin, payment: s.payment, link: s.link,
    customers: s.customers, years: s.years, stationKm: s.stationKm,
    extra: { bring: en(x.bring), minPeople: x.minPeople ?? null, dietary: x.dietary ?? [], menuStyle: x.menuStyle ?? null },
    slots: s.slots ?? [], closedDays: s.closedDays, cutoff: s.cutoff,
    capacityMax: Math.max(0, ...(s.slots ?? []).map((x2) => x2.capacity)),
    publishedAt: s.publishedAt,
  };
}

/** 予約に必要な情報：受付停止日と、枠ごとの予約済み人数 */
export async function availability(shopId) {
  const from = todayJST();
  const to = addDays(from, LIMITS.bookingDaysAhead);
  const [blocked, booked] = await Promise.all([
    prisma.blockedDate.findMany({ where: { shopId, date: { gte: from, lte: to } }, select: { date: true } }),
    prisma.booking.groupBy({ by: ['date', 'time'], where: { shopId, status: 'confirmed', date: { gte: from, lte: to } }, _sum: { people: true } }),
  ]);
  const map = {};
  for (const b of booked) (map[b.date] ??= {})[b.time] = b._sum.people ?? 0;
  return { blocked: blocked.map((b) => b.date), booked: map };
}
