// /api/bookings?action=...  旅行者の予約（時間枠の上限人数内なら即時確定）
import { api, bad, notFound, str, isDate, isTime } from '../server/http.js';
import { prisma } from '../server/db.js';
import { requireUser } from '../server/auth.js';
import { translate } from '../server/translate.js';
import { toPublic } from '../server/shops.js';
import { isOpenDate, isPast } from '../shared/booking.js';
import { DIETARY, LIMITS } from '../shared/constants.js';
import { todayJST, jstTime } from '../shared/time.js';

const traveler = (ctx) => requireUser(ctx, 'traveler');

function view(b) {
  return {
    id: b.id, date: b.date, time: b.time, people: b.people, dietary: b.dietary,
    message: b.message?.en ?? null,
    status: b.status === 'confirmed' && isPast(b) ? 'completed' : b.status,
    cancelReason: b.cancelReason, cancelNote: b.cancelNote ? { text: b.cancelNote.en || b.cancelNote.ja, failed: !b.cancelNote.en && Boolean(b.cancelNote.ja) } : null,
    createdAt: b.createdAt, shop: toPublic(b.shop), threadId: b.threadId ?? null,
  };
}

export default api({
  async 'GET list'(ctx) {
    const user = await traveler(ctx);
    const rows = await prisma.booking.findMany({ where: { travelerId: user.id }, include: { shop: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] });
    const threads = await prisma.thread.findMany({ where: { travelerId: user.id }, select: { id: true, shopId: true } });
    const byShop = Object.fromEntries(threads.map((t) => [t.shopId, t.id]));
    return { items: rows.map((b) => view({ ...b, threadId: byShop[b.shopId] })) };
  },

  async 'GET get'(ctx) {
    const user = await traveler(ctx);
    const b = await prisma.booking.findFirst({ where: { id: String(ctx.query.id ?? ''), travelerId: user.id }, include: { shop: true } });
    if (!b) throw notFound();
    const th = await prisma.thread.findUnique({ where: { shopId_travelerId: { shopId: b.shopId, travelerId: user.id } }, select: { id: true } });
    return { item: view({ ...b, threadId: th?.id }) };
  },

  /** 予約を確定する。確定の直前に残り人数をもう一度確認し、同時に予約されたら後の人は満席になる */
  async 'POST create'(ctx) {
    const user = await traveler(ctx);
    const { date, time } = ctx.body;
    const people = Number(ctx.body.people);
    if (!isDate(date) || !isTime(time) || !Number.isInteger(people) || people < 1) throw bad('missing');
    const shop = await prisma.shop.findFirst({ where: { id: String(ctx.body.shopId ?? ''), status: 'published' } });
    if (!shop) throw notFound();
    const slot = (shop.slots ?? []).find((s) => s.time === time);
    if (!slot) throw bad('no_slot');
    const blocked = await prisma.blockedDate.findUnique({ where: { shopId_date: { shopId: shop.id, date } } });
    if (!isOpenDate(shop, date, new Set(blocked ? [date] : [])) || jstTime(date, time) <= Date.now()) throw bad('date_closed');
    const minPeople = shop.extra?.minPeople ?? 1;
    if (people < minPeople) throw bad('min_people');

    const future = await prisma.booking.count({ where: { travelerId: user.id, status: 'confirmed', date: { gte: todayJST() } } });
    if (future >= LIMITS.maxFutureBookings) throw bad('too_many_bookings');

    const dietary = (Array.isArray(ctx.body.dietary) ? ctx.body.dietary : []).filter((d) => DIETARY.some((x) => x.id === d));
    const msgEn = str(ctx.body.message, { max: LIMITS.messageMaxChars });
    const message = msgEn ? { en: msgEn, ja: await translate(msgEn, 'en', 'ja') } : null;

    // 同時に同じ枠を予約しても上限を超えないよう、まとめて確認して確定（競合したら少し待ってやり直す）
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const booking = await prisma.$transaction(async (tx) => {
          const sum = await tx.booking.aggregate({ where: { shopId: shop.id, date, time, status: 'confirmed' }, _sum: { people: true } });
          const remaining = slot.capacity - (sum._sum.people ?? 0);
          if (people > remaining) throw bad(remaining <= 0 ? 'full' : 'not_enough_seats');
          return tx.booking.create({ data: { shopId: shop.id, travelerId: user.id, date, time, people, dietary, message: message ?? undefined } });
        }, { isolationLevel: 'Serializable' });
        return { id: booking.id };
      } catch (e) {
        if (e.code === 'P2034' && attempt < 2) { await new Promise((r) => setTimeout(r, 100 * (attempt + 1))); continue; }
        throw e;
      }
    }
    throw bad('full');
  },

  /** 開始時刻までいつでも無料でキャンセル。枠は自動で空く */
  async 'POST cancel'(ctx) {
    const user = await traveler(ctx);
    const b = await prisma.booking.findFirst({ where: { id: String(ctx.body.id ?? ''), travelerId: user.id } });
    if (!b) throw notFound();
    if (b.status !== 'confirmed' || isPast(b)) throw bad('cannot_cancel');
    await prisma.booking.update({ where: { id: b.id }, data: { status: 'cancelled_traveler', cancelledAt: new Date(), seenCancelByBusiness: false } });
    return { ok: true };
  },
});
