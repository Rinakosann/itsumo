// ログイン（メール＋パスワード）。パスワードは scrypt でハッシュ化（元に戻せない）。
// セッションは httpOnly クッキー。複数端末で同時にログインできる。
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from './db.js';
import { unauthorized, forbidden } from './http.js';

const scrypt = promisify(crypto.scrypt);
const COOKIE = 'tlm_session';
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [, salt, hex] = String(stored).split('$');
  if (!salt || !hex) return false;
  const key = await scrypt(String(password), salt, 64);
  const expected = Buffer.from(hex, 'hex');
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
}

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = () => crypto.randomBytes(32).toString('base64url');

function cookie(value, maxAgeSec) {
  const secure = (process.env.APP_URL ?? '').startsWith('https') || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export async function startSession(ctx, userId) {
  const token = randomToken();
  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000) } });
  ctx.setCookie(cookie(token, SESSION_DAYS * 86400));
}

export async function endSession(ctx) {
  const token = ctx.cookies[COOKIE];
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  ctx.setCookie(cookie('', 0));
}

export async function currentUser(ctx) {
  if (ctx._user !== undefined) return ctx._user;
  const token = ctx.cookies[COOKIE];
  let user = null;
  if (token) {
    const s = await prisma.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
    if (s && s.expiresAt > new Date() && !s.user.deletedAt) user = s.user;
  }
  ctx._user = user;
  return user;
}

export async function requireUser(ctx, role) {
  const user = await currentUser(ctx);
  if (!user) throw unauthorized();
  if (role && user.role !== role) throw forbidden();
  return user;
}

export const publicUser = (u) => u && { id: u.id, email: u.email, role: u.role, name: u.name, currency: u.currency, lang: u.lang };

export const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
