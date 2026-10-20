// 店舗データを画面に渡す形にする。
import { prisma } from './db.js';
import { todayJST, addDays } from '../shared/time.js';
import { LIMITS, LANG_IDS } from '../shared/constants.js';
import { dayMark } from '../shared/booking.js';

export const langOf = (v) => (LANG_IDS.includes(v) ? v : 'en');

/** { ja, en, zh, ko } → 旅行者の言語の文（訳がなければ英語、それもなければ原文＋失敗フラグ） */
export const loc = (o, lang = 'en') => (o ? { text: o[lang] || o.en || o.ja || '', ja: o.ja || '', failed: Boolean(o.ja) && !o[lang] && !o.en } : null);
export const en = (o) => loc(o, 'en');

export function toPublic(s, lang = 'en') {
  const x = s.extra ?? {};
  const L = (o) => loc(o, lang);
  return {
    id: s.id, isDemo: s.isDemo, category: s.category, area: s.area, name: L(s.name), address: s.address, lat: s.lat, lng: s.lng, placeId: s.placeId, addressVerified: s.addressVerified,
    description: L(s.description), priceJPY: s.priceJPY, durationMin: s.durationMin, payment: s.payment, link: s.link,
    customers: s.customers, years: s.years, stationKm: s.stationKm,
    localsOrder: L(s.localsOrder), notInGuidebooks: s.notInGuidebooks, welcome: L(s.welcome), tips: s.tips ?? [], tipsNote: L(s.tipsNote),
    localPct: s.localPct ?? null,
    popular: s.popular?.name?.ja ? { name: L(s.popular.name), priceJPY: s.popular.priceJPY ?? null } : null,
    perk: L(s.perk),
    firstGuests: s._bookingCount === 0, // まだ予約がない＝最初の海外のお客さんになれる
    week: s._week ?? null,
    extra: { bring: L(x.bring), minPeople: x.minPeople ?? null, dietary: x.dietary ?? [], menuStyle: x.menuStyle ?? null },
    slots: s.slots ?? [], closedDays: s.closedDays, cutoff: s.cutoff,
    capacityMax: Math.max(0, ...(s.slots ?? []).map((x2) => x2.capacity)),
    publishedAt: s.publishedAt,
  };
}

/** 店舗ごとの予約数（「最初のお客さんになれる」の表示用。キャンセルは数えない） */
export async function bookingCounts(shopIds) {
  const rows = await prisma.booking.groupBy({ by: ['shopId'], where: { shopId: { in: shopIds }, status: 'confirmed' }, _count: true });
  const map = Object.fromEntries(rows.map((r) => [r.shopId, r._count]));
  return (id) => map[id] ?? 0;
}

/** 一覧用：店舗ごとに、今日から days 日分の空きの印（2回の問い合わせでまとめて計算） */
export async function weekMarks(shops, days = 7) {
  const from = todayJST();
  const to = addDays(from, days - 1);
  const ids = shops.map((s) => s.id);
  const [blocked, booked] = await Promise.all([
    prisma.blockedDate.findMany({ where: { shopId: { in: ids }, date: { gte: from, lte: to } } }),
    prisma.booking.groupBy({ by: ['shopId', 'date', 'time'], where: { shopId: { in: ids }, status: 'confirmed', date: { gte: from, lte: to } }, _sum: { people: true } }),
  ]);
  const bl = {};
  for (const b of blocked) (bl[b.shopId] ??= new Set()).add(b.date);
  const bk = {};
  for (const b of booked) ((bk[b.shopId] ??= {})[b.date] ??= {})[b.time] = b._sum.people ?? 0;
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  return (s) => ((s.slots ?? []).length ? dates.map((date) => ({ date, mark: dayMark(s, date, bl[s.id] ?? new Set(), bk[s.id]?.[date]) })) : null);
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
