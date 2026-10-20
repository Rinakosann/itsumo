// ============================================================
//  一覧（Jimotoを参考にした構成）：
//    上に「行き先・日付・人数［変更］」→ 一覧／地図の切り替え → 絞り込みのボタン（押すと選ぶ画面）→ 〇△✕の説明 → お店
//  選んだ日に予約できるお店を先に、できないお店は「選んだ日は予約できません」と出して後ろに。
//  はじめて開いたときは、忍者のケロが案内する（最後に言語と通貨を選ぶ）→「どこへ行きますか？」へ。
// ============================================================
import { esc, openSheet, closeSheet, store, storage } from '../../common/ui.js';
import { makeMap, placeSearch, placesEnabled, distanceKm } from '../../common/maps.js';
import { FULL_NINJA, fuji } from '../../common/character-art.js';
import { state, saveFilters, setCurrency, guessedCurrency, loadShops, loadRates, setLang, locale } from '../state.js';
import { post } from '../../common/api.js';
import { t } from '../strings.js';
import { shopCard, rateNote, label, L, langCurHtml } from '../components.js';
import { CATEGORIES, CUSTOMERS, YEARS, BUDGETS, DISTANCES, REGIONS, prefOf } from '../../../shared/constants.js';

// 絞り込み（表示言語で作り直すので関数にする）
const FILTERS = () => [
  { key: 'category', label: 'fCategory', options: CATEGORIES.map((c) => [c.id, L(c)]) },
  { key: 'budget', label: 'fBudget', options: BUDGETS.map((b) => [b.id, L(b)]) },
  { key: 'local', label: 'fCustomers', options: [['70', `${t('locals', { n: 70 })}+`], ['50', `${t('locals', { n: 50 })}+`], ...CUSTOMERS.map((c) => [c.id, L(c)])] },
  { key: 'years', label: 'fYears', options: YEARS.map((y) => [y.id, L(y)]) },
  { key: 'distance', label: 'fDistance', options: DISTANCES.map((d) => [String(d), t('withinKm', { n: d })]) },
  { key: 'guidebook', label: 'fGuidebook', options: [['no', t('onlyNotInGuidebooks')]] },
  { key: 'perk', label: 'fPerk', options: [['yes', t('onlyPerk')]] },
];

function matches(s, f, search) {
  if (search.pref && s.pref !== search.pref) return false;
  if (!search.pref && search.region && prefOf(s.pref)?.region !== search.region) return false;
  if (search.near && (s.lat == null || distanceKm(search.near, s) > 30)) return false;
  if (f.category && s.category !== f.category) return false;
  if (f.budget) {
    const b = BUDGETS.find((x) => x.id === f.budget);
    if ((b.min != null && s.priceJPY < b.min) || (b.max != null && s.priceJPY >= b.max)) return false;
  }
  if (f.local) {
    if (/^\d+$/.test(f.local)) { if ((s.localPct ?? (s.customers === 'local' ? 80 : s.customers === 'mixed' ? 50 : 20)) < Number(f.local)) return false; }
    else if (s.customers !== f.local) return false;
  }
  if (f.years && s.years !== f.years) return false;
  if (f.distance && s.stationKm > Number(f.distance)) return false;
  if (f.guidebook === 'no' && !s.notInGuidebooks) return false;
  if (f.perk === 'yes' && !s.perk?.text) return false;
  return true;
}

/** はじめて開いたとき：忍者のケロがゲームの会話のように案内する（スキップできる）。最後に言語と通貨を選ぶ */
function keroIntro(after) {
  const lines = ['intro1', 'intro2', 'intro3', 'intro4', 'intro5'];
  let i = 0;
  const el = document.createElement('div');
  el.className = 'intro';
  document.body.append(el);
  const finish = () => {
    if (!state.currency) setCurrency(guessedCurrency());
    store('tlm.introDone', true); el.remove();
    document.dispatchEvent(new CustomEvent('intro-done'));
    after();
  };
  const draw = () => {
    const last = i === lines.length - 1;
    el.innerHTML = `
      <button class="intro-skip" data-skip>${t('introSkip')}</button>
      <div class="intro-fuji">${fuji('meet')}</div>
      <div class="intro-chara">${FULL_NINJA}</div>
      <div class="intro-box" role="dialog" aria-live="polite">
        <span class="intro-name">Kero</span>
        <p>${esc(t(lines[i]))}</p>
        ${last ? `${langCurHtml()}<button class="btn primary block" data-finish style="margin-top:14px">${t('done')}</button>`
          : `<div class="pill-row lang-mini">${['en', 'zh', 'ko', 'ja'].map((l) => `<button class="pill ${l === state.lang ? 'on' : ''}" data-lang="${l}">${{ en: 'EN', zh: '中文', ko: '한국어', ja: '日本語' }[l]}</button>`).join('')}</div>
            <div class="intro-dots">${lines.map((_, j) => `<span class="${j === i ? 'on' : ''}"></span>`).join('')}</div><button class="btn primary block" data-next>${t('introNext')}</button>`}
      </div>`;
  };
  el.onclick = (e) => {
    if (e.target.closest('[data-skip]') || e.target.closest('[data-finish]')) return finish();
    const lg = e.target.closest('[data-lang]')?.dataset.lang;
    if (lg) { setLang(lg); document.dispatchEvent(new CustomEvent('lang-changed')); return draw(); }
    const c = e.target.closest('[data-cur]')?.dataset.cur;
    if (c) { setCurrency(c); return draw(); }
    if (e.target.closest('[data-next]')) { i++; draw(); }
  };
  draw();
}

/** 「京都府・10月21日(水)・2名」 */
function searchSummary() {
  const s = state.search;
  const place = s.near ? t('nearYou') : s.pref ? L(prefOf(s.pref)) : s.region ? L(REGIONS.find((r) => r.id === s.region)) : t('allJapan');
  const date = s.date ? new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' }).format(new Date(`${s.date}T12:00:00Z`)) : '';
  return [place, date, t('peopleN', { n: s.people || 1 })].filter(Boolean).join(' · ');
}

/** 絞り込みのボタンを押したとき：選ぶ画面（シート） */
function pickFilter(x, f, after) {
  const c = openSheet(`<h3>${t(x.label)}</h3>
    <div class="choices">
      <button class="choice ${!f[x.key] ? 'on' : ''}" data-v="">${t('any')}</button>
      ${x.options.map(([v, l]) => `<button class="choice ${f[x.key] === v ? 'on' : ''}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}
    </div>`);
  c.onclick = (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    f[x.key] = b.dataset.v;
    saveFilters(); closeSheet(); after();
  };
}

export async function render(view) {
  const [shops] = await Promise.all([loadShops(), loadRates()]);
  const f = state.filters;
  const search = state.search;
  const filters = FILTERS();
  let items = shops.filter((s) => matches(s, f, search));
  // 選んだ日に予約できるお店を先に（週の最初の日が ✕ なら後ろ）
  const dateSet = Boolean(search.date);
  items = items.map((s) => ({ ...s, unavailable: dateSet && s.week?.[0]?.mark === 'x' }));
  if (search.near) items.sort((a, b) => distanceKm(search.near, a) - distanceKm(search.near, b));
  items.sort((a, b) => Number(a.unavailable) - Number(b.unavailable));
  const active = filters.filter((x) => f[x.key]);
  const inArea = shops.filter((s) => matches(s, {}, search)).length;
  const suggestions = items.length || !shops.length ? [] : active
    .map((x) => ({ x, n: shops.filter((s) => matches(s, { ...f, [x.key]: '' }, search)).length }))
    .filter((s) => s.n > 0).sort((a, b) => b.n - a.n);

  view.innerHTML = `
    <section>
      <button class="search-bar" data-change><span class="sb-text">🗾 ${esc(searchSummary())}</span><span class="sb-change">${t('change')}</span></button>
      <div class="hero-line"><div class="hero-fuji">${fuji('meet')}</div><p class="hero-ja">${t('heroJa')}</p><p class="hero-en">${t('heroEn')}</p></div>
      <div class="row-between">
        <h3>${t('recommended')} <span class="muted small">${t('shopsHere', { n: items.length })}</span></h3>
        <span class="seg"><button data-view="list" class="${state.view === 'list' ? 'on' : ''}">${t('listView')}</button><button data-view="map" class="${state.view === 'map' ? 'on' : ''}">🗺 ${t('mapView')}</button></span>
      </div>
      <div class="chips scroll filter-chips">
        ${filters.map((x) => `<button class="chip ${f[x.key] ? 'on' : ''}" data-filter="${x.key}">${esc(f[x.key] ? label(x.options.map(([id, l]) => ({ id, en: l })), f[x.key]) : t(x.label))} ▾</button>`).join('')}
      </div>
      <p class="note legend">${t('markLegend')}</p>
      ${state.view === 'map' ? `
        ${placesEnabled() ? '<div class="place-search" id="place-search"></div>' : ''}
        <div id="list-map" class="map"></div>
        <div id="map-pick" class="list"></div>` : ''}
      <div class="list" ${state.view === 'map' ? 'hidden' : ''}>
        ${!shops.length ? `<p class="empty">${t('noShops')}</p>`
          : !inArea ? `<p class="empty">${t('noShopsHere')}</p><a class="btn block" href="#/where">🗾 ${t('change')}</a>`
          : items.length ? items.map(shopCard).join('')
          : `<p class="empty">${t('noMatch')}</p>${suggestions.map(({ x, n }) => `<button class="btn block" data-relax="${x.key}">${esc(t('removeFilter', { f: `${t(x.label)}: ${label(x.options.map(([id, en]) => ({ id, en })), f[x.key])}`, n }))}</button>`).join('')}`}
      </div>
      ${rateNote()}
    </section>`;

  if (state.view === 'map') {
    const pick = document.getElementById('map-pick');
    makeMap(document.getElementById('list-map'), {
      markers: items.map((s) => ({ lat: s.lat, lng: s.lng, title: s.name.text, label: s.category === 'restaurant' ? '🍣' : '🍵', onClick: () => { pick.innerHTML = shopCard(s); } })),
    }).then(({ map }) => {
      if (placesEnabled()) placeSearch(document.getElementById('place-search'), (p) => { if (p.lat != null) { map.setCenter({ lat: p.lat, lng: p.lng }); map.setZoom(15); } }, { placeholder: t('searchPlace') }).catch(() => {});
    }).catch(() => { document.getElementById('list-map').outerHTML = `<div class="map map-off">${t('mapOff')}</div>`; });
  }

  view.onclick = (e) => {
    if (e.target.closest('[data-change]')) { location.hash = '#/where'; return; }
    const v = e.target.closest('[data-view]')?.dataset.view;
    if (v) { state.view = v; store('tlm.view', v); render(view); }
    const fk = e.target.closest('[data-filter]')?.dataset.filter;
    if (fk) pickFilter(filters.find((x) => x.key === fk), f, () => render(view));
    const r = e.target.closest('[data-relax]')?.dataset.relax;
    if (r) { f[r] = ''; saveFilters(); render(view); }
  };

  if (!storage('tlm.introDone', false)) {
    keroIntro(() => {
      if (state.user) post('auth', 'profile', { lang: state.lang, currency: state.currency }).catch(() => {});
      location.hash = '#/where'; // はじめての人は、行き先を選ぶ画面へ
    });
  }
}
