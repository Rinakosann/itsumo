// /api/biz?action=...  事業者画面（店舗登録・受付停止日・予約一覧・キャンセル・新着の数）
import { api, bad, notFound, str, oneOf, isDate } from '../server/http.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../server/db.js';
import { requireUser } from '../server/auth.js';
import { jaToAll, fullyTranslated } from '../server/translate.js';
import { geocodeJa } from '../server/geo.js';
import { isPast } from '../shared/booking.js';
import { AREAS, CATEGORIES, CUSTOMERS, YEARS, PAYMENTS, DIETARY, MENU_STYLES, CUTOFFS, CANCEL_REASONS, LIMITS, TIPS, LOCAL_PCTS } from '../shared/constants.js';
import { todayJST, addDays } from '../shared/time.js';

const biz = (ctx) => requireUser(ctx, 'business');
const ids = (list) => list.map((x) => x.id);

async function myShop(user, id) {
  const s = await prisma.shop.findFirst({ where: { id: String(id ?? ''), ownerId: user.id } });
  if (!s) throw notFound();
  return s;
}

/** 入力を確認して保存用の形にする。足りない必須項目は missing に入れる（下書きとしては保存できる） */
function readShop(b) {
  const missing = [];
  const need = (v, label) => { if (v === null || v === undefined || v === '' || Number.isNaN(v)) missing.push(label); return v; };
  const opt = (v, list) => (ids(list).includes(v) ? v : null);
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

  const link = str(b.link, { max: 300 });
  if (link && !/^https?:\/\/[^\s]+$/i.test(link)) throw bad('invalid_link'); // http:// か https:// で始まるURLだけ
  const slots = (Array.isArray(b.slots) ? b.slots : []).slice(0, LIMITS.maxSlots)
    .filter((s) => /^\d{2}:\d{2}$/.test(s?.time ?? ''))
    .map((s) => ({ time: s.time, capacity: Math.min(LIMITS.maxCapacity, Math.max(1, Math.round(Number(s.capacity) || 1))) }));
  const uniqueSlots = [...new Map(slots.map((s) => [s.time, s])).values()].sort((a, b2) => a.time.localeCompare(b2.time));
  const price = num(b.priceJPY);
  const duration = num(b.durationMin);
  const km = num(b.stationKm);

  return {
    missing,
    data: {
      category: need(opt(b.category, CATEGORIES), 'カテゴリ'),
      area: need(opt(b.area, AREAS), 'エリア'),
      nameJa: need(str(b.name, { max: 60 }), '店名'),
      address: need(str(b.address, { max: 200 }), '住所'),
      descriptionJa: need(str(b.description, { max: LIMITS.descriptionMaxChars }), '説明文'),
      priceJPY: need(price != null && price >= 0 && price <= 1_000_000 ? Math.round(price) : null, '料金'),
      durationMin: need(duration != null && duration >= 10 && duration <= 1440 ? Math.round(duration) : null, '所要時間'),
      payment: need(opt(b.payment, PAYMENTS), '支払い方法'),
      customers: need(opt(b.customers, CUSTOMERS), '客層'),
      years: need(opt(b.years, YEARS), '営業年数'),
      stationKm: need(km != null && km >= 0 && km <= 100 ? Math.round(km * 10) / 10 : null, '主要駅からの距離'),
      link: link || null,
      lat: num(b.lat), lng: num(b.lng), placeId: str(b.placeId, { max: 300 }) || null,
      postal: str(b.postal, { max: 8 }).replace(/[^0-9-]/g, '') || null,
      addressVerified: Boolean(b.addressVerified) && num(b.lat) != null,
      bringJa: str(b.bring, { max: 200 }),
      minPeople: num(b.minPeople) ? Math.max(1, Math.min(LIMITS.maxCapacity, Math.round(num(b.minPeople)))) : null,
      dietary: (Array.isArray(b.dietary) ? b.dietary : []).filter((d) => ids(DIETARY).includes(d) && d !== 'allergy'),
      allergyOk: Boolean(b.allergyOk),
      menuStyle: opt(b.menuStyle, MENU_STYLES),
      slots: uniqueSlots,
      closedDays: (Array.isArray(b.closedDays) ? b.closedDays : []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
      cutoff: opt(b.cutoff, CUTOFFS) ?? 'same_day',
      // こだわり（任意）
      localsOrderJa: str(b.localsOrder, { max: 100 }),
      notInGuidebooks: Boolean(b.notInGuidebooks),
      welcomeJa: str(b.welcome, { max: 100 }),
      tips: (Array.isArray(b.tips) ? b.tips : []).filter((x) => ids(TIPS).includes(x)),
      tipsNoteJa: str(b.tipsNote, { max: 200 }),
      // Jimotoを参考に追加（任意）：地元客の割合・一番人気・ITSUMO限定の特典
      localPct: LOCAL_PCTS.includes(num(b.localPct)) ? num(b.localPct) : null,
      popularJa: str(b.popularName, { max: 40 }),
      popularPrice: num(b.popularPrice) != null && num(b.popularPrice) >= 0 && num(b.popularPrice) <= 1_000_000 ? Math.round(num(b.popularPrice)) : null,
      perkJa: str(b.perk, { max: 100 }),
    },
  };
}

const keep = (prev, ja) => (prev?.ja === ja && fullyTranslated(prev) ? prev : null); // 変わっていなければ翻訳し直さない

export default api({
  /** 新着の数（画面の新着表示・未読バッジ） */
  async 'GET badges'(ctx) {
    const user = await biz(ctx);
    const [bookings, cancels, messages] = await Promise.all([
      prisma.booking.count({ where: { shop: { ownerId: user.id }, seenByBusiness: false } }),
      prisma.booking.count({ where: { shop: { ownerId: user.id }, seenCancelByBusiness: false } }),
      prisma.message.count({ where: { thread: { shop: { ownerId: user.id } }, readByBusiness: false } }),
    ]);
    return { bookings: bookings + cancels, messages };
  },

  async 'GET shops'(ctx) {
    const user = await biz(ctx);
    return { items: await prisma.shop.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'asc' } }) };
  },

  async 'GET shop'(ctx) {
    const user = await biz(ctx);
    return { item: await myShop(user, ctx.query.id) };
  },

  /**
   * 保存。必須項目がそろっていれば即公開（英語・中国語・韓国語に自動翻訳）。足りなければ下書き。
   * publish=false なら下書きのまま保存。
   */
  async 'POST shop-save'(ctx) {
    const user = await biz(ctx);
    const prev = ctx.body.id ? await myShop(user, ctx.body.id) : null;
    const { data: v, missing } = readShop(ctx.body.shop ?? {});
    const wantPublish = ctx.body.publish !== false;

    // 英語・中国語・韓国語に自動翻訳（変わっていない文は訳し直さない）
    const tr = async (prevVal, ja) => (ja ? keep(prevVal, ja) ?? (await jaToAll(ja)) : null);
    const [name0, description0, bring, localsOrder, welcome, tipsNote, popularName, perk] = await Promise.all([
      tr(prev?.name, v.nameJa), tr(prev?.description, v.descriptionJa), tr(prev?.extra?.bring, v.bringJa),
      tr(prev?.localsOrder, v.localsOrderJa), tr(prev?.welcome, v.welcomeJa), tr(prev?.tipsNote, v.tipsNoteJa),
      tr(prev?.popular?.name, v.popularJa), tr(prev?.perk, v.perkJa),
    ]);
    const name = name0 ?? { ja: '' };
    const description = description0 ?? { ja: '' };
    // 住所が未確認なら、保存のときにサーバーでも確認する（押し忘れても公開が止まらないように）
    if (!v.addressVerified && v.address) {
      const hit = await geocodeJa(v.address);
      if (hit) { v.addressVerified = true; if (v.lat == null) { v.lat = hit.lat; v.lng = hit.lng; } }
    }
    // 架空の店舗を防ぐため、公開には住所の確認（国土地理院の住所検索かGoogleマップで実在を確認）が必要
    if (!v.addressVerified) missing.push('住所の確認（「住所を確認する」を押す）');
    const publish = wantPublish && missing.length === 0;

    const data = {
      category: v.category ?? 'experience', area: v.area ?? AREAS[0].id, name, address: v.address ?? '', description,
      priceJPY: v.priceJPY ?? 0, durationMin: v.durationMin ?? 60, payment: v.payment ?? 'cash',
      customers: v.customers ?? 'mixed', years: v.years ?? '<10', stationKm: v.stationKm ?? 0,
      link: v.link, lat: v.lat, lng: v.lng, placeId: v.placeId, postal: v.postal, addressVerified: v.addressVerified,
      extra: v.category === 'restaurant'
        ? { dietary: v.dietary, allergyOk: v.allergyOk, menuStyle: v.menuStyle }
        : { bring, minPeople: v.minPeople },
      slots: v.slots, closedDays: v.closedDays, cutoff: v.cutoff,
      localsOrder: localsOrder ?? Prisma.DbNull, notInGuidebooks: v.notInGuidebooks, welcome: welcome ?? Prisma.DbNull, tips: v.tips, tipsNote: tipsNote ?? Prisma.DbNull,
      localPct: v.localPct, popular: popularName ? { name: popularName, priceJPY: v.popularPrice } : Prisma.DbNull, perk: perk ?? Prisma.DbNull,
      status: publish ? 'published' : prev?.status === 'hidden' ? 'hidden' : 'draft',
      ...(publish && !prev?.publishedAt ? { publishedAt: new Date() } : {}),
    };
    const saved = prev
      ? await prisma.shop.update({ where: { id: prev.id }, data })
      : await prisma.shop.create({ data: { ...data, ownerId: user.id } });
    const translateFailed = [name, description, bring, localsOrder, welcome, tipsNote, popularName, perk].some((o) => o && o.ja && !fullyTranslated(o));
    return { id: saved.id, status: saved.status, missing: wantPublish ? missing : [], translateFailed };
  },

  async 'POST shop-unpublish'(ctx) {
    const user = await biz(ctx);
    const s = await myShop(user, ctx.body.id);
    await prisma.shop.update({ where: { id: s.id }, data: { status: 'draft' } });
    return { ok: true };
  },

  // ---------- 受付停止日 ----------

  async 'GET blocked'(ctx) {
    const user = await biz(ctx);
    const s = await myShop(user, ctx.query.shopId);
    const rows = await prisma.blockedDate.findMany({ where: { shopId: s.id, date: { gte: todayJST() } }, orderBy: { date: 'asc' } });
    const booked = await prisma.booking.groupBy({ by: ['date'], where: { shopId: s.id, status: 'confirmed', date: { gte: todayJST() } }, _count: true });
    return { dates: rows.map((r) => r.date), booked: Object.fromEntries(booked.map((b) => [b.date, b._count])), shop: { id: s.id, closedDays: s.closedDays, name: s.name.ja } };
  },

  /** dates を停止（stop=true）／再開。from〜to で期間をまとめて指定もできる */
  async 'POST blocked'(ctx) {
    const user = await biz(ctx);
    const s = await myShop(user, ctx.body.shopId);
    let dates = (Array.isArray(ctx.body.dates) ? ctx.body.dates : []).filter(isDate);
    if (isDate(ctx.body.from) && isDate(ctx.body.to) && ctx.body.from <= ctx.body.to) {
      for (let d = ctx.body.from; d <= ctx.body.to && dates.length < 366; d = addDays(d, 1)) dates.push(d);
    }
    dates = [...new Set(dates)].slice(0, 366);
    if (!dates.length) throw bad('missing');
    if (ctx.body.stop) {
      await prisma.blockedDate.createMany({ data: dates.map((date) => ({ shopId: s.id, date })), skipDuplicates: true });
    } else {
      await prisma.blockedDate.deleteMany({ where: { shopId: s.id, date: { in: dates } } });
    }
    return { ok: true, count: dates.length };
  },

  // ---------- 予約 ----------

  /** 日付順の予約一覧（旅行者名・メール・人数・時間枠・食事制限・メッセージの日本語訳）。開いたら新着を既読に */
  async 'GET bookings'(ctx) {
    const user = await biz(ctx);
    const rows = await prisma.booking.findMany({
      where: { shop: { ownerId: user.id } }, include: { shop: true, traveler: { select: { name: true, email: true, deletedAt: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    const items = rows.map((b) => ({
      id: b.id, shopId: b.shopId, shopName: b.shop.name.ja, date: b.date, time: b.time, people: b.people, dietary: b.dietary,
      travelerName: b.traveler.deletedAt ? '退会したユーザー' : b.traveler.name, travelerEmail: b.traveler.deletedAt ? null : b.traveler.email,
      message: b.message ? { ja: b.message.ja, original: b.message[b.message.lang ?? 'en'], lang: b.message.lang ?? 'en', failed: !b.message.ja } : null,
      status: b.status === 'confirmed' && isPast(b) ? 'completed' : b.status,
      cancelReason: b.cancelReason, isNew: !b.seenByBusiness, isNewCancel: !b.seenCancelByBusiness, createdAt: b.createdAt,
      travelerId: b.travelerId,
    }));
    await prisma.booking.updateMany({ where: { shop: { ownerId: user.id }, OR: [{ seenByBusiness: false }, { seenCancelByBusiness: false }] }, data: { seenByBusiness: true, seenCancelByBusiness: true } });
    const threads = await prisma.thread.findMany({ where: { shop: { ownerId: user.id } }, select: { id: true, shopId: true, travelerId: true } });
    const th = Object.fromEntries(threads.map((t) => [`${t.shopId}|${t.travelerId}`, t.id]));
    return { items: items.map(({ travelerId, ...b }) => ({ ...b, threadId: th[`${b.shopId}|${travelerId}`] ?? null })) };
  },

  /** 事業者のキャンセル：理由（臨時休業／天候／その他）を選ぶ。理由は英語に翻訳して旅行者に表示 */
  async 'POST cancel'(ctx) {
    const user = await biz(ctx);
    const b = await prisma.booking.findFirst({ where: { id: String(ctx.body.id ?? ''), shop: { ownerId: user.id } } });
    if (!b) throw notFound();
    if (b.status !== 'confirmed' || isPast(b)) throw bad('cannot_cancel');
    const reason = oneOf(ctx.body.reason, ids(CANCEL_REASONS), 'reason');
    const note = str(ctx.body.note, { max: 300 });
    await prisma.booking.update({
      where: { id: b.id },
      data: { status: 'cancelled_business', cancelReason: reason, cancelNote: note ? await jaToAll(note) : undefined, cancelledAt: new Date() },
    });
    return { ok: true };
  },
});

