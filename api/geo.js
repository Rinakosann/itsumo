// /api/geo?action=...  住所の補助（どちらも無料・キー不要）
//  zip：郵便番号 → 住所（zipcloud）
//  address：住所 → 実在の確認と位置（国土地理院の住所検索）
//  station：位置 → 近くの駅（HeartRails Express・日本全国）
import { api, bad, str, rateLimit } from '../server/http.js';
import { geocodeJa, nearStations } from '../server/geo.js';

export default api({
  async 'GET zip'(ctx) {
    rateLimit(ctx, 'geo', 120);
    const code = String(ctx.query.code ?? '').replace(/[^0-9]/g, '');
    if (code.length !== 7) throw bad('invalid_zip');
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return { found: false };
    return { found: true, address: `${r.address1}${r.address2}${r.address3}` };
  },

  async 'GET station'(ctx) {
    rateLimit(ctx, 'geo', 120);
    const lat = Number(ctx.query.lat); const lng = Number(ctx.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw bad('missing');
    return { items: await nearStations(lat, lng) };
  },

  async 'GET address'(ctx) {
    rateLimit(ctx, 'geo', 120);
    const q = str(ctx.query.q, { max: 200, required: true, name: 'q' });
    const hit = await geocodeJa(q);
    return hit ? { found: true, ...hit } : { found: false };
  },
});
