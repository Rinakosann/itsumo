// 旅行者画面の表示部品
import { esc } from '../common/ui.js';
import { state } from './state.js';
import { t } from './strings.js';
import { areaOf, CATEGORIES, CUSTOMERS, YEARS, PAYMENTS, TIPS, PHRASES } from '../../shared/constants.js';

export const yen = (n) => `¥${Math.round(n).toLocaleString('ja-JP')}`;
export const label = (list, id) => list.find((x) => x.id === id)?.en ?? '';

/** 日本円＋選んだ通貨の目安 */
export function price(jpy) {
  const rate = state.rates?.rates?.[state.currency];
  const approx = rate ? new Intl.NumberFormat('en', { style: 'currency', currency: state.currency, maximumFractionDigits: jpy * rate < 100 ? 2 : 0 }).format(jpy * rate) : null;
  return `<b>${yen(jpy)}</b>${approx ? ` <span class="approx">≈ ${t('approx')} ${approx}</span>` : ''}`;
}

export function rateNote() {
  const r = state.rates;
  if (!r?.rates || !state.currency) return '';
  const date = new Date(r.fetchedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  return `<p class="note">💱 ${esc(t(r.stale ? 'rateStale' : 'rateNote', { date }))}</p>`;
}

export function stationText(s) {
  const a = areaOf(s.area);
  return t('fromStation', { km: s.stationKm, station: a?.stationEn ?? '' });
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

export function shopCard(s) {
  const a = areaOf(s.area);
  return `
    <a class="card place-card" href="#/shop/${s.id}">
      <div class="thumb" style="background:#e3f0d8">${s.category === 'restaurant' ? '🍽️' : '🎋'}</div>
      <div class="card-body">
        <h3>${esc(s.name.text)}</h3>
        <div class="sub">${esc(label(CATEGORIES, s.category))} · ${esc(a?.en ?? '')}</div>
        <div class="price-line">${price(s.priceJPY)} <span class="muted">${t('perPerson')}</span></div>
        ${s.localsOrder?.text ? `<div class="locals-order">🍢 <b>${t('localsOrder')}:</b> ${esc(s.localsOrder.text)}</div>` : ''}
        <div class="facts">
          ${s.notInGuidebooks ? `<span class="fact special">📖 ${t('notInGuidebooks')}</span>` : ''}
          ${s.firstGuests ? `<span class="fact first">✨ ${t('firstGuests')}</span>` : ''}
          <span class="fact">👥 ${esc(label(CUSTOMERS, s.customers))}</span>
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
    ...(s.tips ?? []).map((id) => TIPS.find((x) => x.id === id)?.en).filter(Boolean),
  ];
  if (!list.length && !s.tipsNote?.text) return '';
  return `<div class="section"><h4>🎒 ${t('beforeYouGo')}</h4>
    <ul class="tips">${list.map((x) => `<li>${esc(x)}</li>`).join('')}${s.tipsNote?.text ? `<li>${translated(s.tipsNote)}</li>` : ''}</ul></div>`;
}

/** お店で使える日本語（名前が分かれば1行目に入れる） */
export function phrasesHtml(name = '', withTitle = true) {
  const fill = (x) => x.replaceAll('{name}', name || '___');
  return `<div class="section">${withTitle ? `<h4>🗣️ ${t('phrasesTitle')}</h4>` : ''}<p class="note">${t('phrasesNote')}</p>
    <div class="phrases">${PHRASES.map((p) => `<div class="phrase"><div class="ja" lang="ja">${esc(fill(p.ja))}</div><div class="romaji">${esc(fill(p.romaji))}</div><div class="en">${esc(fill(p.en))}</div></div>`).join('')}</div></div>`;
}
