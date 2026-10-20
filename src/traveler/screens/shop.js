// 詳細（英語に自動翻訳）。チャット・予約のボタンは押した時点でログインを求める。
import { esc, toast, setReturnTo } from '../../common/ui.js';
import { get, post } from '../../common/api.js';
import { makeMap, mapsEnabled, googleMapsLink } from '../../common/maps.js';
import { state, loadRates } from '../state.js';
import { store } from '../../common/ui.js';
import { marksFor } from '../../../shared/booking.js';
import { t, errText } from '../strings.js';
import { price, rateNote, stationText, placeText, translated, handleOriginal, label, paymentText, tipsHtml, phrasesHtml, weekStrip, localBar, L, yen } from '../components.js';
import { CATEGORIES, CUSTOMERS, YEARS, DIETARY, MENU_STYLES, CUTOFFS } from '../../../shared/constants.js';

export async function render(view, id) {
  let s;
  try { s = (await get('shops', 'get', { id, lang: state.lang })).item; } catch (e) { view.innerHTML = `<p class="empty">${esc(errText(e))}</p><a class="btn block" href="#/">${t('back')}</a>`; return; }
  await loadRates();
  post('shops', 'view', { shopId: s.id, visitorId: state.visitorId }).catch(() => {}); // 閲覧の記録（成功指標）
  const x = s.extra ?? {};
  const canBook = s.slots.length > 0;
  const week = marksFor(s, 14, new Date(), state.search.people || 1); // 2週間分の空き（〇△✕）。探す条件の人数で

  view.innerHTML = `
    <section class="detail">
      <a class="back" href="#/">← ${t('back')}</a>
      ${s.isDemo ? `<p class="notice warn small"><span class="demo-tag">${t('demoTag')}</span> ${t('demoNote')}</p>` : ''}
      <h2>${translated(s.name)}</h2>
      <p class="sub">${esc(label(CATEGORIES, s.category))} · ${esc(placeText(s))}</p>
      <div class="facts">
        ${s.notInGuidebooks ? `<span class="fact special">📖 ${t('notInGuidebooks')}</span>` : ''}
        ${s.firstGuests ? `<span class="fact first">✨ ${t('firstGuests')}</span>` : ''}
        ${s.localPct == null ? `<span class="fact">👥 ${t('customers')}: ${esc(label(CUSTOMERS, s.customers))}</span>` : ''}
        <span class="fact">🏮 ${t('years')}: ${esc(label(YEARS, s.years))}</span>
        <span class="fact">🚉 ${esc(stationText(s))}</span>
      </div>

      ${s.perk?.text ? `<div class="perk-box"><b>${t('perkTitle')}</b><p>${translated(s.perk)}</p></div>` : ''}
      ${localBar(s.localPct, { note: true })}
      ${s.welcome?.text ? `<div class="owner-says"><span class="owner-ico">🧑‍🍳</span><div><b>${t('ownerSays')}</b><p class="owner-text">${translated(s.welcome)}</p></div></div>` : ''}
      ${s.localsOrder?.text ? `<div class="locals-order big">🍢 <b>${t('localsOrder')}:</b> ${translated(s.localsOrder)}</div>` : ''}

      ${s.popular ? `<div class="popular">⭐ <b>${t('popular')}:</b> ${translated(s.popular.name)}${s.popular.priceJPY != null ? ` <span class="pop-price">${yen(s.popular.priceJPY)}</span>` : ''}</div>` : ''}
      ${canBook ? `<div class="section"><h4>📅 ${t('weekTitle')}</h4><p class="note">${t('markLegend')} · ${t('tapDay')}</p>${weekStrip(week, { tap: true })}</div>` : ''}

      <div class="section price-box">
        <div class="big">${price(s.priceJPY)} <span class="muted">${t('perPerson')}</span></div>
        <p class="small">💴 ${t('payAtShop')} · ${esc(paymentText(s.payment))}</p>
        ${rateNote()}
      </div>

      <div class="section"><p>${translated(s.description)}</p></div>

      <div class="section kv">
        <div><b>${t('duration')}</b>${t('minutes', { n: s.durationMin })}</div>
        <div><b>${t('capacity')}</b>${canBook ? t('upTo', { n: s.capacityMax }) : '—'}</div>
        ${s.category === 'experience' && x.bring ? `<div class="wide"><b>${t('bring')}</b>${translated(x.bring)}</div>` : ''}
        ${s.category === 'experience' && x.minPeople > 1 ? `<div><b>${t('minPeople', { n: x.minPeople })}</b></div>` : ''}
        ${s.category === 'restaurant' && x.dietary?.length ? `<div class="wide"><b>${t('dietarySupport')}</b>${x.dietary.map((d) => esc(label(DIETARY, d))).join(', ')}</div>` : ''}
        ${s.category === 'restaurant' && x.allergyOk ? `<div class="wide">${t('allergyOk')}</div>` : ''}
        ${s.category === 'restaurant' && x.menuStyle ? `<div><b>${t('menuStyle')}</b>${esc(label(MENU_STYLES, x.menuStyle))}</div>` : ''}
        <div><b>📅</b>${esc(label(CUTOFFS, s.cutoff))}</div>
      </div>

      ${tipsHtml(s)}

      <div class="section">
        <h4>📍 ${t('address')}</h4>
        <p>${esc(s.address)} ${s.addressVerified ? `<span class="fact">✅ ${t('addressVerified')}</span>` : ''}</p>
        ${mapsEnabled() && s.lat != null ? '<div id="shop-map" class="map small"></div>' : ''}
        <a class="btn block" href="${esc(googleMapsLink({ name: s.name.ja, lat: s.lat, lng: s.lng, placeId: s.placeId, address: s.address }))}" target="_blank" rel="noopener">🧭 ${t('openInMaps')}</a>
        ${s.link ? `<a class="btn block" href="${esc(s.link)}" target="_blank" rel="noopener noreferrer nofollow">🔗 ${t('externalLink')} ↗</a><p class="warn-ext">${t('leaving')}: ${esc(s.link)}</p>` : ''}
      </div>

      ${state.lang === 'ja' ? '' : `<details class="section"><summary>🗣️ ${t('phrasesTitle')}</summary>${phrasesHtml(state.user?.name, false)}</details>`}
      ${canBook ? '' : `<p class="notice info">${t('noSlots')}</p>`}
      <div class="sticky-actions">
        <button class="btn" data-chat>💬 ${t('chat')}</button>
        ${canBook ? `<button class="btn primary" data-book>${t('book')}</button>` : ''}
      </div>
      <p style="text-align:center;margin-top:16px"><button class="link" data-report>⚑ ${t('report')}</button></p>
    </section>`;

  if (document.getElementById('shop-map')) makeMap(document.getElementById('shop-map'), { markers: [{ lat: s.lat, lng: s.lng, title: s.name.text }] }).catch(() => {});

  const needLogin = (target) => {
    if (state.user) { location.hash = target; return; }
    setReturnTo(target);
    toast(t('needLogin'));
    location.hash = '#/login';
  };
  view.onclick = async (e) => {
    if (handleOriginal(e)) return;
    if (e.target.closest('[data-chat]')) needLogin(`#/chat/new?shop=${s.id}`);
    if (e.target.closest('[data-book]')) needLogin(`#/book/${s.id}`);
    const day = e.target.closest('[data-day]')?.dataset.day;
    if (day) { store(`tlm.draft.${s.id}`, { date: day, time: '', people: Math.max(s.extra?.minPeople ?? 1, state.search.people || 1), dietary: [], message: '', month: day.slice(0, 7) }); needLogin(`#/book/${s.id}`); }
    if (e.target.closest('[data-report]')) {
      const reason = prompt(t('reportPrompt'));
      if (reason?.trim()) { await post('shops', 'report', { shopId: s.id, reason }).catch(() => {}); toast(t('reportThanks')); }
    }
  };
}
