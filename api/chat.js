// /api/chat?action=...  翻訳チャット（旅行者は英語・事業者は日本語）。予約前でも予約後でも使える
import { api, bad, notFound, str } from '../server/http.js';
import { prisma } from '../server/db.js';
import { requireUser } from '../server/auth.js';
import { translate } from '../server/translate.js';
import { LIMITS } from '../shared/constants.js';

/** ログイン中の人が見てよいスレッドか */
async function threadFor(user, id) {
  const th = await prisma.thread.findUnique({ where: { id }, include: { shop: true, traveler: { select: { name: true, deletedAt: true, lang: true } } } });
  if (!th) throw notFound();
  if (user.role === 'traveler' && th.travelerId !== user.id) throw notFound();
  if (user.role === 'business' && th.shop.ownerId !== user.id) throw notFound();
  return th;
}

const shopName = (s, user) => (user.role === 'business' ? s.name.ja : s.name[user.lang] || s.name.en || s.name.ja);

export default api({
  async 'GET threads'(ctx) {
    const user = await requireUser(ctx);
    const where = user.role === 'business' ? { shop: { ownerId: user.id } } : { travelerId: user.id };
    const threads = await prisma.thread.findMany({
      where, orderBy: { updatedAt: 'desc' },
      include: { shop: true, traveler: { select: { name: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const unreadKey = user.role === 'business' ? 'readByBusiness' : 'readByTraveler';
    const counts = await prisma.message.groupBy({ by: ['threadId'], where: { threadId: { in: threads.map((t) => t.id) }, [unreadKey]: false }, _count: true });
    const unread = Object.fromEntries(counts.map((c) => [c.threadId, c._count]));
    return {
      items: threads.map((t) => {
        const m = t.messages[0];
        const mine = m && m.sender === user.role;
        return {
          id: t.id, shopId: t.shopId, shopName: shopName(t.shop, user), travelerName: t.traveler.name, updatedAt: t.updatedAt,
          unread: unread[t.id] ?? 0, last: m ? (mine ? m.text : m.translated ?? m.text) : '',
        };
      }),
    };
  },

  async 'GET thread'(ctx) {
    const user = await requireUser(ctx);
    const th = await threadFor(user, String(ctx.query.id ?? ''));
    await prisma.message.updateMany({ where: { threadId: th.id }, data: user.role === 'business' ? { readByBusiness: true } : { readByTraveler: true } });
    const msgs = await prisma.message.findMany({ where: { threadId: th.id }, orderBy: { createdAt: 'asc' } });
    return {
      thread: { id: th.id, shopId: th.shopId, shopName: shopName(th.shop, user), travelerName: th.traveler.name, blocked: th.blockedByBusiness, travelerDeleted: Boolean(th.traveler.deletedAt) },
      messages: msgs.map((m) => {
        const mine = m.sender === user.role;
        return {
          id: m.id, mine, createdAt: m.createdAt,
          text: mine ? m.text : (m.translated ?? m.text), // 相手のメッセージは自分の言語で
          original: m.text, translateFailed: !mine && m.translated == null,
        };
      }),
    };
  },

  /** 旅行者：shopId で始める／threadId で続ける。事業者：threadId で返信 */
  async 'POST send'(ctx) {
    const user = await requireUser(ctx);
    const text = str(ctx.body.text, { max: LIMITS.messageMaxChars, required: true, name: 'text' });
    let th;
    if (user.role === 'traveler' && ctx.body.shopId) {
      const shop = await prisma.shop.findFirst({ where: { id: String(ctx.body.shopId), status: 'published' } });
      if (!shop) throw notFound();
      th = await prisma.thread.upsert({
        where: { shopId_travelerId: { shopId: shop.id, travelerId: user.id } },
        create: { shopId: shop.id, travelerId: user.id }, update: {}, include: { shop: true, traveler: { select: { name: true, deletedAt: true, lang: true } } },
      });
    } else {
      th = await threadFor(user, String(ctx.body.threadId ?? ''));
    }
    if (th.blockedByBusiness && user.role === 'traveler') throw bad('blocked');
    const tlang = th.traveler.lang ?? 'en'; // 旅行者の言語 ⇔ 日本語
    const [from, to] = user.role === 'traveler' ? [user.lang ?? 'en', 'ja'] : ['ja', tlang];
    const translated = await translate(text, from, to);
    await prisma.message.create({
      data: { threadId: th.id, sender: user.role, text, translated, readByTraveler: user.role === 'traveler', readByBusiness: user.role === 'business' },
    });
    await prisma.thread.update({ where: { id: th.id }, data: { updatedAt: new Date() } });
    return { threadId: th.id, translateFailed: translated == null };
  },

  /** 事業者：嫌がらせの相手をブロック／解除 */
  async 'POST block'(ctx) {
    const user = await requireUser(ctx, 'business');
    const th = await threadFor(user, String(ctx.body.threadId ?? ''));
    await prisma.thread.update({ where: { id: th.id }, data: { blockedByBusiness: Boolean(ctx.body.blocked) } });
    return { ok: true };
  },
});
