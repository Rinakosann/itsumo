// ============================================================
//  予約：日付（カレンダー）→ 時間枠 → 人数 → 食事制限・メッセージ → 確認 → 確定（即時）
//  満席の枠・定休日・受付停止日・受付締切を過ぎた日は選べない。人数は残り人数まで。
//  入力の途中で閉じても、端末に残して次に開いたとき再開できる。
// ============================================================
import { esc, toast, storage, store, $ } from '../../common/ui.js';
import { get, post } from '../../common/api.js';
import { state, loadRates, locale } from '../state.js';
import { t, errText } from '../strings.js';
import { price, rateNote, label, L } from '../components.js';
import { isOpenDate, slotsFor } from '../../../shared/booking.js';
import { DIETARY, LIMITS } from '../../../shared/constants.js';
import { todayJST, addDays, weekday } from '../../../shared/time.js';

const WEEK = () => Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(), { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + i))));
const fmtDate = (d) => new Intl.DateTimeFormat(locale(), { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));

export async function render(view, shopId) {
  let shop;
  try { shop = (await get('shops', 'get', { id: shopId, lang: state.lang })).item; } catch (e) { view.innerHTML = `<p class="empty">${esc(errText(e))}</p>`; return; }
  await loadRates();
  const blocked = new Set(shop.blocked);
  const key = `tlm.draft.${shop.id}`;
  const draft = storage(key, null);
  const minPeople = shop.extra?.minPeople ?? 1;
  const s = { date: '', time: '', people: minPeople, dietary: [], message: '', month: todayJST().slice(0, 7), step: 'form', ...(draft ?? {}) };
  if (s.date && !isOpenDate(shop, s.date, blocked)) { s.date = ''; s.time = ''; }
  let restoredShown = !draft;

  const slots = () => (s.date ? slotsFor(shop, s.date, shop.booked[s.date] ?? {}) : []);
  const remaining = () => slots().find((x) => x.time === s.time)?.remaining ?? 0;
  const save = () => store(key, { date: s.date, time: s.time, people: s.people, dietary: s.dietary, message: s.message, month: s.month });

  function calendar() {
    const [y, m] = s.month.split('-').map(Number);
    const first = `${s.month}-01`;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const today = todayJST();
    const canPrev = s.month > today.slice(0, 7);
    const canNext = s.month < addDays(today, LIMITS.bookingDaysAhead).slice(0, 7);
    const cells = Array.from({ length: days }, (_, i) => {
      const d = `${s.month}-${String(i + 1).padStart(2, '0')}`;
      const open = isOpenDate(shop, d, blocked) && slotsFor(shop, d, shop.booked[d] ?? {}).some((x) => x.remaining > 0);
      return `<button type="button" data-date="${d}" class="${s.date === d ? 'on' : ''}" ${open ? '' : 'disabled'} aria-label="${fmtDate(d)}">${i + 1}</button>`;
    });
    return `
      <div class="cal-nav">
        <button type="button" class="btn small" data-month="-1" ${canPrev ? '' : 'disabled'}>‹</button>
        <b>${new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${first}T12:00:00Z`))}</b>
        <button type="button" class="btn small" data-month="1" ${canNext ? '' : 'disabled'}>›</button>
      </div>
      <div class="cal">${WEEK().map((w) => `<div class="h">${w}</div>`).join('')}${'<div></div>'.repeat(weekday(first))}${cells.join('')}</div>`;
  }

  function formHtml() {
    const sl = slots();
    const rem = remaining();
    if (s.time && rem < s.people) s.people = Math.max(minPeople, Math.min(s.people, rem));
    const maxP = Math.min(rem || 0, LIMITS.maxCapacity);
    const missing = [!s.date && 'date', !s.time && 'time'].filter(Boolean);
    return `
      <a class="back" href="#/shop/${shop.id}">← ${t('back')}</a>
      <h2>${t('bookTitle')}: ${esc(shop.name.text)}</h2>
      ${restoredShown ? '' : `<p class="notice info small">${t('draftRestored')}</p>`}
      <h4>${t('stepDate')}</h4>${calendar()}
      <h4>${t('stepTime')}${s.date ? ` — ${esc(fmtDate(s.date))}` : ''}</h4>
      <div class="slot-list">${s.date ? sl.map((x) => `<button type="button" class="slot ${s.time === x.time ? 'on' : ''}" data-time="${x.time}" ${x.remaining > 0 ? '' : 'disabled'}>${x.time}<small>${x.remaining > 0 ? t('left', { n: x.remaining }) : t('full')}</small></button>`).join('') : `<span class="muted small">${t('pickDate')}</span>`}</div>
      <h4>${t('stepPeople')}</h4>
      ${s.time ? `<select data-f="people">${Array.from({ length: Math.max(0, maxP - minPeople + 1) }, (_, i) => minPeople + i).map((n) => `<option ${n === s.people ? 'selected' : ''}>${n}</option>`).join('')}</select>
        ${minPeople > 1 ? `<p class="note">${t('minPeople', { n: minPeople })}</p>` : ''}` : `<span class="muted small">${t('pickTime')}</span>`}
      <h4>${t('stepDetails')}</h4>
      <div class="label">${t('dietary')}</div>
      <div class="chips">${DIETARY.map((d) => `<button type="button" class="chip ${s.dietary.includes(d.id) ? 'on' : ''}" data-diet="${d.id}">${esc(L(d))}</button>`).join('')}</div>
      <label class="label" style="margin-top:10px">${t('message')}
        <textarea data-f="message" maxlength="${LIMITS.messageMaxChars}" placeholder="${esc(t('messageHint'))}">${esc(s.message)}</textarea>
        <span class="muted small" id="cnt">${t('charsLeft', { n: LIMITS.messageMaxChars - s.message.length })}</span></label>
      <p class="error">${missing.length ? esc(t('missing', { list: missing.join(', ') })) : ''}</p>
      <button class="btn primary block" data-review ${missing.length ? 'disabled' : ''}>${t('review')} →</button>`;
  }

  function reviewHtml() {
    return `
      <button class="back link" data-edit>← ${t('back')}</button>
      <h2>${t('stepReview')}</h2>
      <div class="section kv">
        <div class="wide"><b>${t('when')}</b>${esc(fmtDate(s.date))} ${s.time}</div>
        <div><b>${t('people')}</b>${s.people}</div>
        <div><b>${t('duration')}</b>${t('minutes', { n: shop.durationMin })}</div>
        <div class="wide"><b>${t('address')}</b>${esc(shop.address)}</div>
        ${s.dietary.length ? `<div class="wide"><b>${t('dietary')}</b>${s.dietary.map((d) => esc(label(DIETARY, d))).join(', ')}</div>` : ''}
        ${s.message ? `<div class="wide"><b>${t('message')}</b>${esc(s.message)}</div>` : ''}
        <div class="wide"><b>${t('payAmount')}</b>${price(shop.priceJPY * s.people)}</div>
      </div>
      ${rateNote()}
      <p class="error" id="err" role="alert"></p>
      <button class="btn primary block" data-confirm>${t('confirm')}</button>`;
  }

  const draw = () => { view.innerHTML = `<section>${s.step === 'form' ? formHtml() : reviewHtml()}</section>`; restoredShown = true; };
  draw();

  const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  view.onclick = async (e) => {
    const d = e.target.closest('[data-date],[data-time],[data-diet],[data-month],[data-review],[data-edit],[data-confirm]')?.dataset;
    if (!d) return;
    if (d.month) { const [y, m] = s.month.split('-').map(Number); const nd = new Date(Date.UTC(y, m - 1 + Number(d.month), 1)); s.month = nd.toISOString().slice(0, 7); }
    if (d.date) { s.date = d.date; s.time = ''; }
    if (d.time) { s.time = d.time; s.people = Math.max(minPeople, Math.min(s.people, remaining())); }
    if (d.diet) s.dietary = toggle(s.dietary, d.diet);
    if (d.review !== undefined) { s.step = 'review'; window.scrollTo(0, 0); }
    if (d.edit !== undefined) s.step = 'form';
    if (d.confirm !== undefined) {
      e.target.disabled = true;
      try {
        const res = await post('bookings', 'create', { shopId: shop.id, date: s.date, time: s.time, people: s.people, dietary: s.dietary, message: s.message });
        store(key, undefined);
        toast(t('confirmed'));
        location.hash = `#/booking/${res.id}`;
      } catch (err) {
        $('#err').textContent = errText(err);
        e.target.disabled = false;
        if (['full', 'not_enough_seats', 'date_closed'].includes(err.code)) { // 最新の空きで選び直してもらう
          shop = { ...shop, ...(await get('shops', 'get', { id: shop.id, lang: state.lang })).item };
          s.time = ''; s.step = 'form'; save(); setTimeout(draw, 2500);
        }
      }
      return;
    }
    save();
    draw();
  };
  view.oninput = (e) => {
    if (e.target.dataset.f === 'message') {
      s.message = e.target.value;
      $('#cnt').textContent = t('charsLeft', { n: LIMITS.messageMaxChars - s.message.length });
      save();
    }
  };
  view.onchange = (e) => {
    if (e.target.dataset.f === 'people') { s.people = Number(e.target.value); save(); }
  };
}
