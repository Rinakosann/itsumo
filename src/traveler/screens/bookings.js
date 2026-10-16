// マイ予約（一覧・確定画面）。開始時刻までいつでも無料キャンセル。事業者のキャンセルは理由（英訳）を表示
import { esc, toast } from '../../common/ui.js';
import { get, post } from '../../common/api.js';
import { googleMapsLink } from '../../common/maps.js';
import { loadRates, state } from '../state.js';
import { AVATAR } from '../../common/character-art.js';
import { t, errText } from '../strings.js';
import { price, rateNote, label, tipsHtml, phrasesHtml } from '../components.js';
import { DIETARY, CANCEL_REASONS } from '../../../shared/constants.js';

const fmtDate = (d) => new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
const badge = (st) => `<span class="badge ${st === 'confirmed' ? 'ok' : st === 'completed' ? '' : 'muted'}">${t(`st_${st}`)}</span>`;

export async function renderList(view) {
  const { items } = await get('bookings', 'list');
  const upcoming = items.filter((b) => b.status === 'confirmed');
  const others = items.filter((b) => b.status !== 'confirmed').reverse();
  const card = (b) => `
    <a class="card col" href="#/booking/${b.id}">
      <div class="row-between"><h3>${esc(b.shop.name.text)}</h3>${badge(b.status)}</div>
      <div class="sub">📅 ${esc(fmtDate(b.date))} ${b.time} · 👥 ${b.people}</div>
      ${b.status === 'cancelled_business' ? `<div class="notice warn small">${esc(t('shopCancelReason', { r: [label(CANCEL_REASONS, b.cancelReason), b.cancelNote?.text].filter(Boolean).join(' — ') }))}</div>` : ''}
    </a>`;
  view.innerHTML = `
    <section>
      <h2>${t('bookingsTitle')}</h2>
      <div class="list">${upcoming.map(card).join('') || `<p class="empty">${t('noBookings')}</p>`}</div>
      ${others.length ? `<details><summary>History (${others.length})</summary><div class="list">${others.map(card).join('')}</div></details>` : ''}
    </section>`;
}

export async function renderOne(view, id) {
  let b;
  try { b = (await get('bookings', 'get', { id })).item; } catch (e) { view.innerHTML = `<p class="empty">${esc(errText(e))}</p>`; return; }
  await loadRates();
  const s = b.shop;
  view.innerHTML = `
    <section>
      <a class="back" href="#/bookings">← ${t('bookingsTitle')}</a>
      ${b.status === 'confirmed' ? `<div class="celebrate">🎉</div><h2>${t('confirmed')}</h2>
        <div class="greet"><div class="char-avatar">${AVATAR}</div><p>${esc(t('keroConfirmed'))}</p></div>` : `<h2>${esc(s.name.text)}</h2>`}
      <div class="tags">${badge(b.status)}</div>
      ${b.status === 'cancelled_business' ? `<p class="notice warn">${esc(t('shopCancelReason', { r: [label(CANCEL_REASONS, b.cancelReason), b.cancelNote?.text].filter(Boolean).join(' — ') }))}</p>` : ''}
      <div class="section kv">
        <div class="wide"><b>Shop</b>${esc(s.name.text)}</div>
        <div class="wide"><b>${t('when')}</b>${esc(fmtDate(b.date))} ${b.time}</div>
        <div><b>${t('people')}</b>${b.people}</div>
        <div><b>${t('duration')}</b>${t('minutes', { n: s.durationMin })}</div>
        <div class="wide"><b>${t('address')}</b>${esc(s.address)}</div>
        <div class="wide"><b>${t('payAmount')}</b>${price(s.priceJPY * b.people)}<br><span class="small muted">${t('payAtShop')}</span></div>
        ${b.dietary.length ? `<div class="wide"><b>${t('dietary')}</b>${b.dietary.map((d) => esc(label(DIETARY, d))).join(', ')}</div>` : ''}
      </div>
      ${rateNote()}
      ${['confirmed', 'completed'].includes(b.status) ? `${tipsHtml(s)}${phrasesHtml(state.user?.name)}` : ''}
      <a class="btn block" href="${esc(googleMapsLink({ name: s.name.ja, lat: s.lat, lng: s.lng, placeId: s.placeId, address: s.address }))}" target="_blank" rel="noopener">🧭 ${t('openInMaps')}</a>
      <a class="btn block" href="${b.threadId ? `#/chat/${b.threadId}` : `#/chat/new?shop=${s.id}`}">💬 ${t('openChat')}</a>
      ${b.status === 'confirmed' ? `<button class="btn block danger" data-cancel>${t('cancel')}</button>` : ''}
    </section>`;
  view.onclick = async (e) => {
    if (!e.target.closest('[data-cancel]') || !confirm(t('cancelConfirm'))) return;
    try { await post('bookings', 'cancel', { id: b.id }); toast(t('cancelled')); renderOne(view, id); } catch (err) { toast(errText(err)); }
  };
}
