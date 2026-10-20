// 旅行者画面の表示部品
import { esc } from '../common/ui.js';
import { state, locale } from './state.js';
import { t } from './strings.js';
import { areaOf, CATEGORIES, CUSTOMERS, YEARS, PAYMENTS, TIPS, PHRASES } from '../../shared/constants.js';

export const yen = (n) => `¥${Math.round(n).toLocaleString('ja-JP')}`;
/** 選択肢の表示名（旅行者の言語。なければ英語） */
export const label = (list, id) => { const x = list.find((y) => y.id === id); return x ? x[state.lang] ?? x.en : ''; };
export const L = (x) => x?.[state.lang] ?? x?.en ?? '';

/** 日本円＋選んだ通貨の目安 */
export function price(jpy) {
  const rate = state.rates?.rates?.[state.currency];
  const approx = rate ? new Intl.NumberFormat(locale(), { style: 'currency', currency: state.currency, maximumFractionDigits: jpy * rate < 100 ? 2 : 0 }).format(jpy * rate) : null;
  return `<b>${yen(jpy)}</b>${approx ? ` <span class="approx">≈ ${t('approx')} ${approx}</span>` : ''}`;
}

export function rateNote() {
  const r = state.rates;
  if (!r?.rates || !state.currency) return '';
  const date = new Date(r.fetchedAt).toLocaleDateString(locale(), { month: 'short', day: 'numeric', year: 'numeric' });
  return `<p class="note">💱 ${esc(t(r.stale ? 'rateStale' : 'rateNote', { date }))}</p>`;
}

export function stationText(s) {
  const a = areaOf(s.area);
  const station = { en: a?.stationEn, zh: a?.stationZh, ko: a?.stationKo }[state.lang] ?? a?.stationEn ?? '';
  return t('fromStation', { km: s.stationKm, station });
}

/** 自動翻訳された文：翻訳失敗の表示と「原文を見る」 */
export function translated(field) {
  if (!field) return '';
  if (field.failed) return `${esc(field.text)}<span class="tr-tools">⚠️ ${t('notTranslated')}</span>`;
  return `${esc(field.text)}<span class="tr-tools">🌐 ${t('translated')} · <button class="link" data-original="${esc(field.ja)}">${t('showOriginal')}</button></span>`;
}

export function handleOriginal(e) {
  const b = e.target.closest('[data-original]');
  if (!b) return false;
  b.closest('.tr-tools').insertAdjacentHTML('afterend', `<span class="original">🇯🇵 ${esc(b.dataset.original)}</span>`);
  b.remove();
  return true;
}

/** 1週間の空き（〇△✕）。onTap があれば日付を押して予約へ */
const MARK = { o: '〇', tri: '△', x: '✕' };
export function weekStrip(week, { tap = false } = {}) {
  if (!week?.length) return '';
  const wd = new Intl.DateTimeFormat(locale(), { weekday: 'short', timeZone: 'UTC' });
  return `<div class="week">${week.map((d) => {
    const dt = new Date(`${d.date}T12:00:00Z`);
    const inner = `<span class="wd">${esc(wd.format(dt))}</span><span class="dd">${dt.getUTCDate()}</span><span class="mk">${MARK[d.mark]}</span>`;
    return tap && d.mark !== 'x' ? `<button type="button" class="day ${d.mark}" data-day="${d.date}">${inner}</button>` : `<span class="day ${d.mark}">${inner}</span>`;
  }).join('')}</div>`;
}

/** 地元のお客さんの割合（棒グラフ） */
export function localBar(pct, { note = false } = {}) {
  if (pct == null) return '';
  return `<div class="local-bar"><div class="bar"><span style="width:${pct}%"></span></div>
    <div class="bar-legend"><span class="loc">🏠 ${esc(t('locals', { n: pct }))}</span><span class="vis">🧳 ${esc(t('visitors', { n: 100 - pct }))}</span></div>
    ${note ? `<p class="note">${t('localPctNote')}</p>` : ''}</div>`;
}

export function shopCard(s) {
  const a = areaOf(s.area);
  return `
    <a class="card place-card" href="#/shop/${s.id}">
      <div class="thumb">${s.category === 'restaurant' ? '🍣' : '🍵'}</div>
      <div class="card-body">
        ${s.perk?.text ? `<div class="perk-ribbon">🎁 ${t('perk')}</div>` : ''}
        <h3>${s.isDemo ? `<span class="demo-tag">${t('demoTag')}</span> ` : ''}${esc(s.name.text)}</h3>
        <div class="sub">${esc(label(CATEGORIES, s.category))} · ${esc(L(a))}</div>
        <div class="price-line">${price(s.priceJPY)} <span class="muted">${t('perPerson')}</span></div>
        ${s.localsOrder?.text ? `<div class="locals-order">🍢 <b>${t('localsOrder')}:</b> ${esc(s.localsOrder.text)}</div>` : ''}
        ${weekStrip(s.week)}
        ${localBar(s.localPct)}
        <div class="facts">
          ${s.notInGuidebooks ? `<span class="fact special">📖 ${t('notInGuidebooks')}</span>` : ''}
          ${s.firstGuests ? `<span class="fact first">✨ ${t('firstGuests')}</span>` : ''}
          ${s.localPct == null ? `<span class="fact">👥 ${esc(label(CUSTOMERS, s.customers))}</span>` : ''}
          <span class="fact">🏮 ${esc(label(YEARS, s.years))}</span>
          <span class="fact">🚉 ${esc(stationText(s))}</span>
        </div>
      </div>
    </a>`;
}

export const paymentText = (p) => label(PAYMENTS, p);

/** 来る前に知ってほしいこと（現金のみは支払い方法から自動で入れる） */
export function tipsHtml(s) {
  const list = [
    ...(s.payment === 'cash' ? [t('cashTip')] : []),
    ...(s.tips ?? []).map((id) => L(TIPS.find((x) => x.id === id))).filter(Boolean),
  ];
  if (!list.length && !s.tipsNote?.text) return '';
  return `<div class="section"><h4>🎒 ${t('beforeYouGo')}</h4>
    <ul class="tips">${list.map((x) => `<li>${esc(x)}</li>`).join('')}${s.tipsNote?.text ? `<li>${translated(s.tipsNote)}</li>` : ''}</ul></div>`;
}

/** お店で使える日本語（名前が分かれば1行目に入れる） */
export function phrasesHtml(name = '', withTitle = true) {
  const fill = (x) => x.replaceAll('{name}', name || '___');
  return `<div class="section">${withTitle ? `<h4>🗣️ ${t('phrasesTitle')}</h4>` : ''}<p class="note">${t('phrasesNote')}</p>
    <div class="phrases">${PHRASES.map((p) => `<div class="phrase"><div class="ja" lang="ja">${esc(fill(p.ja))}</div><div class="romaji">${esc(fill(p.romaji))}</div><div class="en">${esc(fill(L(p)))}</div></div>`).join('')}</div></div>`;
}
