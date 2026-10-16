// API共通：リクエストの読み取り・JSONで返す・エラー処理。
// Vercel Functions と、ローカル開発（vite のミドルウェア）の両方で同じように動く。

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

export const bad = (code, message) => new HttpError(400, code, message);
export const unauthorized = () => new HttpError(401, 'login_required');
export const forbidden = () => new HttpError(403, 'forbidden');
export const notFound = () => new HttpError(404, 'not_found');

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (raw.length > 200_000) throw bad('too_large');
  return raw ? JSON.parse(raw) : {};
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/**
 * ?action=xxx で処理を振り分ける。
 *   export default api({ 'GET list': async (ctx) => ..., 'POST create': async (ctx) => ... })
 * ctx = { req, res, query, body, cookies, setCookie(str) }
 */
export function api(handlers) {
  return async function handler(req, res) {
    const cookiesOut = [];
    try {
      const url = new URL(req.url, 'http://localhost');
      const query = Object.fromEntries(url.searchParams);
      const action = query.action ?? '';
      const fn = handlers[`${req.method} ${action}`];
      if (!fn) throw notFound();
      const body = req.method === 'GET' ? {} : await readBody(req);
      const ctx = { req, res, query, body, cookies: parseCookies(req), setCookie: (c) => cookiesOut.push(c) };
      const result = await fn(ctx);
      if (cookiesOut.length) res.setHeader('Set-Cookie', cookiesOut);
      if (!res.writableEnded) send(res, 200, result ?? { ok: true });
    } catch (e) {
      if (cookiesOut.length) res.setHeader('Set-Cookie', cookiesOut);
      if (e instanceof HttpError) return send(res, e.status, { error: e.code, message: e.message });
      if (e instanceof SyntaxError) return send(res, 400, { error: 'bad_json' });
      console.error(e);
      send(res, 500, { error: 'server_error' });
    }
  };
}

// ---------- 入力チェック ----------

export function str(v, { max = 200, required = false, name = 'field' } = {}) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw bad('missing', name);
  if (s.length > max) throw bad('too_long', name);
  return s;
}

export function int(v, { min = -Infinity, max = Infinity, name = 'field' } = {}) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad('invalid', name);
  return n;
}

export function oneOf(v, list, name = 'field') {
  if (!list.includes(v)) throw bad('invalid', name);
  return v;
}

export function listOf(v, list) {
  return Array.isArray(v) ? [...new Set(v.filter((x) => list.includes(x)))] : [];
}

export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isTime = (s) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);

// ---------- 連続アクセスの制限（1つのサーバーインスタンス内の簡易版）----------
const hits = new Map();
export function rateLimit(ctx, key, max = 10, windowMs = 60_000) {
  const ip = ctx.req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? ctx.req.socket?.remoteAddress ?? 'local';
  const k = `${key}|${ip}`;
  const now = Date.now();
  const list = (hits.get(k) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) throw new HttpError(429, 'rate_limited');
  list.push(now);
  hits.set(k, list);
}
