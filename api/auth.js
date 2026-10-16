// /api/auth?action=...  アカウント（旅行者・事業者とも メール＋パスワード）
import { api, bad, str, oneOf, rateLimit } from '../server/http.js';
import { prisma } from '../server/db.js';
import { hashPassword, verifyPassword, startSession, endSession, currentUser, requireUser, publicUser, isEmail, randomToken, sha256 } from '../server/auth.js';
import { sendEmail } from '../server/email.js';
import { CURRENCIES, LIMITS } from '../shared/constants.js';
import { todayJST } from '../shared/time.js';

const password = (v) => {
  const s = typeof v === 'string' ? v : '';
  if (s.length < 8 || s.length > 100) throw bad('weak_password');
  return s;
};
const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

export default api({
  async 'GET me'(ctx) {
    const user = await currentUser(ctx);
    return { user: publicUser(user), maps: { key: process.env.GOOGLE_MAPS_API_KEY || null, mapId: process.env.GOOGLE_MAP_ID || 'DEMO_MAP_ID' } };
  },

  async 'POST register'(ctx) {
    rateLimit(ctx, 'register', 30);
    const role = oneOf(ctx.body.role, ['traveler', 'business'], 'role');
    const email = str(ctx.body.email, { max: 200, required: true, name: 'email' }).toLowerCase();
    if (!isEmail(email)) throw bad('invalid_email');
    const name = str(ctx.body.name, { max: 60, required: true, name: 'name' });
    if (!ctx.body.termsAgreed) throw bad('terms_required');
    // 事業者は、フリガナと電話番号（運営からの連絡用・公開しない）も必須
    let nameKana = null;
    let phone = null;
    if (role === 'business') {
      nameKana = str(ctx.body.nameKana, { max: 60, required: true, name: 'nameKana' });
      if (!/^[ァ-ヶー\s　]+$/.test(nameKana)) throw bad('invalid_kana');
      phone = String(ctx.body.phone ?? '').replace(/[^0-9]/g, '');
      if (!/^0\d{9,10}$/.test(phone) || /^0(120|800)/.test(phone)) throw bad('invalid_phone');
    }
    if (await prisma.user.findUnique({ where: { email } })) throw bad('email_taken');
    const user = await prisma.user.create({
      data: {
        email, name, role, nameKana, phone, passwordHash: await hashPassword(password(ctx.body.password)), termsAgreedAt: new Date(),
        currency: CURRENCIES.includes(ctx.body.currency) ? ctx.body.currency : 'USD',
      },
    });
    await startSession(ctx, user.id);
    return { user: publicUser(user) };
  },

  /** ログインの失敗が続くと、しばらくログインできない */
  async 'POST login'(ctx) {
    rateLimit(ctx, 'login', 60);
    const email = str(ctx.body.email, { max: 200, required: true }).toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.lockedUntil && user.lockedUntil > new Date()) throw bad('locked');
    const ok = user && !user.deletedAt && (await verifyPassword(ctx.body.password ?? '', user.passwordHash));
    if (!ok) {
      if (user && !user.deletedAt) {
        const fails = user.failedLogins + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: fails >= LIMITS.loginFailLock ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LIMITS.loginLockMinutes * 60000) } : { failedLogins: fails },
        });
      }
      throw bad('wrong_login');
    }
    if (ctx.body.role && user.role !== ctx.body.role) throw bad('wrong_role');
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    await startSession(ctx, user.id);
    return { user: publicUser(user) };
  },

  async 'POST logout'(ctx) {
    await endSession(ctx);
    return { ok: true };
  },

  /** パスワード再設定のメール（同じメールアドレスへの送信回数を制限。登録の有無は教えない） */
  async 'POST forgot'(ctx) {
    rateLimit(ctx, 'forgot', 20);
    const email = str(ctx.body.email, { max: 200 }).toLowerCase();
    const user = isEmail(email) ? await prisma.user.findUnique({ where: { email } }) : null;
    if (user && !user.deletedAt) {
      const recent = await prisma.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600000) } } });
      if (recent < LIMITS.resetMailPerHour) {
        const token = randomToken();
        await prisma.passwordReset.create({ data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + LIMITS.resetLinkMinutes * 60000) } });
        const page = user.role === 'business' ? '/business' : '/traveler';
        const link = `${appUrl()}${page}#/reset?token=${token}`;
        await sendEmail(user.role === 'business'
          ? { to: user.email, subject: '【Tabi Local】パスワードの再設定', text: `${user.name} 様\n\n下のリンクから新しいパスワードを設定してください（${LIMITS.resetLinkMinutes}分間・1回だけ有効）。\n${link}\n\nお心当たりがない場合は、このメールを無視してください。` }
          : { to: user.email, subject: '[Tabi Local] Reset your password', text: `Hi ${user.name},\n\nOpen this link to set a new password (valid for ${LIMITS.resetLinkMinutes} minutes, one time only):\n${link}\n\nIf you did not request this, you can ignore this email.` });
      }
    }
    return { ok: true };
  },

  /** 再設定リンクは1回だけ・期限付き */
  async 'POST reset'(ctx) {
    const row = await prisma.passwordReset.findUnique({ where: { id: sha256(String(ctx.body.token ?? '')) } });
    if (!row || row.usedAt || row.expiresAt < new Date()) throw bad('invalid_token');
    const hash = await hashPassword(password(ctx.body.password));
    await prisma.$transaction([
      prisma.user.update({ where: { id: row.userId }, data: { passwordHash: hash, failedLogins: 0, lockedUntil: null } }),
      prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId: row.userId } }),
    ]);
    await startSession(ctx, row.userId);
    return { ok: true };
  },

  async 'POST profile'(ctx) {
    const user = await requireUser(ctx);
    const data = {};
    if (ctx.body.name !== undefined) data.name = str(ctx.body.name, { max: 60, required: true, name: 'name' });
    if (ctx.body.currency) data.currency = oneOf(ctx.body.currency, CURRENCIES, 'currency');
    return { user: publicUser(await prisma.user.update({ where: { id: user.id }, data })) };
  },

  /**
   * 退会。未来の予約があるときは、先にキャンセルしてもらう。
   * 同じメールで登録し直せるよう、メールを置き換えてログインできなくする（過去の予約・チャットは引き継がない）。
   */
  async 'POST delete'(ctx) {
    const user = await requireUser(ctx);
    if (!(await verifyPassword(ctx.body.password ?? '', user.passwordHash))) throw bad('wrong_password');
    const today = todayJST();
    const future = user.role === 'traveler'
      ? await prisma.booking.count({ where: { travelerId: user.id, status: 'confirmed', date: { gte: today } } })
      : await prisma.booking.count({ where: { shop: { ownerId: user.id }, status: 'confirmed', date: { gte: today } } });
    if (future > 0) throw bad('has_future_bookings');
    await prisma.$transaction([
      prisma.shop.updateMany({ where: { ownerId: user.id }, data: { status: 'draft' } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({ where: { id: user.id }, data: { email: `deleted-${user.id}@deleted.invalid`, name: 'Deleted user', passwordHash: 'deleted', deletedAt: new Date() } }),
    ]);
    await endSession(ctx);
    return { ok: true };
  },
});
