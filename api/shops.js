// /api/shops?action=...  旅行者向け：店舗の一覧・詳細（ログイン不要）、閲覧の記録、店舗の報告
import { api, bad, notFound, str, isDate } from '../server/http.js';
import { todayJST } from '../shared/time.js';
import { prisma } from '../server/db.js';
import { currentUser } from '../server/auth.js';
import { toPublic, availability, bookingCounts, weekMarks, langOf } from '../server/shops.js';

export default api({
  /**
   * 公開中の店舗（新着順）。?lang= en | zh | ko | ja
   * ?date=YYYY-MM-DD&people=n を渡すと、その日から1週間分の空き（〇△✕）をその人数で計算する
   */
  async 'GET list'(ctx) {
    const lang = langOf(ctx.query.lang);
    const from = isDate(ctx.query.date) && ctx.query.date >= todayJST() ? ctx.query.date : todayJST();
    const people = Math.min(20, Math.max(1, Number(ctx.query.people) || 1));
    const shops = await prisma.shop.findMany({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' } });
    const [count, week] = await Promise.all([bookingCounts(shops.map((s) => s.id)), weekMarks(shops, { from, people })]);
    return { items: shops.map((s) => toPublic({ ...s, _bookingCount: count(s.id), _week: week(s) }, lang)) };
  },

  async 'GET get'(ctx) {
    const s = await prisma.shop.findFirst({ where: { id: String(ctx.query.id ?? ''), status: 'published' } });
    if (!s) throw notFound();
    const count = await bookingCounts([s.id]);
    return { item: { ...toPublic({ ...s, _bookingCount: count(s.id) }, langOf(ctx.query.lang)), ...(await availability(s.id)) } };
  },

  /** 成功指標：詳細ページの閲覧を1回ごとに記録 */
  async 'POST view'(ctx) {
    const s = await prisma.shop.findFirst({ where: { id: String(ctx.body.shopId ?? ''), status: 'published' }, select: { id: true } });
    if (!s) return { ok: false };
    await prisma.shopView.create({ data: { shopId: s.id, visitorId: str(ctx.body.visitorId, { max: 64 }) || null } });
    return { ok: true };
  },

  /** この店舗を報告（運営が毎日DBで確認する） */
  async 'POST report'(ctx) {
    const s = await prisma.shop.findUnique({ where: { id: String(ctx.body.shopId ?? '') }, select: { id: true } });
    if (!s) throw notFound();
    const reason = str(ctx.body.reason, { max: 500, required: true, name: 'reason' });
    if (!reason) throw bad('missing');
    const user = await currentUser(ctx);
    await prisma.report.create({ data: { shopId: s.id, reporterId: user?.id ?? null, reason } });
    return { ok: true };
  },
});
