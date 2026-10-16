// /api/rates?action=get  為替レート（日本円 → 対応通貨）。1日1回だけ取得してDBに保存する。
// 取得元：ExchangeRate-API（無料・登録不要） https://www.exchangerate-api.com/docs/free
// 取得に失敗したら、最後に取得したレートと取得日時を返す。
import { api } from '../server/http.js';
import { prisma } from '../server/db.js';
import { CURRENCIES } from '../shared/constants.js';
import { todayJST } from '../shared/time.js';

export default api({
  async 'GET get'() {
    const day = todayJST();
    let row = await prisma.rate.findUnique({ where: { day } });
    if (!row) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/JPY', { signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        if (data.result !== 'success') throw new Error('rate api');
        const rates = Object.fromEntries(CURRENCIES.map((c) => [c, data.rates[c]]).filter(([, v]) => v));
        row = await prisma.rate.upsert({ where: { day }, create: { day, rates }, update: { rates, fetchedAt: new Date() } });
      } catch {
        row = await prisma.rate.findFirst({ orderBy: { day: 'desc' } }); // 最後に取得したレート
      }
    }
    return row ? { rates: row.rates, fetchedAt: row.fetchedAt, stale: row.day !== day } : { rates: null };
  },
});
