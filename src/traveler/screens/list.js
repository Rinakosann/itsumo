// ============================================================
//  一覧：新着順。絞り込み（カテゴリ・エリア・予算・客層・営業年数・主要駅からの距離）。
//  一覧／地図の切り替え。地図では実在の場所を検索して移動できる。
//  初回は表示通貨を選ぶ。キャラクターが上で一言（×で閉じられる）。
// ============================================================
import { esc, openSheet, closeSheet, store, storage } from '../../common/ui.js';
import { makeMap, placeSearch, mapsEnabled } from '../../common/maps.js';
import { AVATAR_NINJA, FULL_NINJA, fuji } from '../../common/character-art.js';
import { state, saveFilters, setCurrency, guessedCurrency, loadShops, loadRates, setLang } from '../state.js';
import { t } from '../strings.js';
import { shopCard, rateNote, label, L } from '../components.js';
import { AREAS, CATEGORIES, CUSTOMERS, YEARS, BUDGETS, DISTANCES, CURRENCIES, LANGS } from '../../../shared/constants.js';

// 表示言語で作り直すので関数にする
const FILTERS = () => [
  { key: 'category', label: 'fCategory', options: CATEGORIES.map((c) => [c.id, L(c)]) },
  { key: 'area', label: 'fArea', options: AREAS.map((a) => [a.id, L(a)]) },
  { key: 'budget', label: 'fBudget', options: BUDGETS.map((b) => [b.id, L(b)]) },
  { key: 'customers', label: 'fCustomers', options: CUSTOMERS.map((c) => [c.id, L(c)]) },
  { key: 'years', label: 'fYears', options: YEARS.map((y) => [y.id, L(y)]) },
  { key: 'distance', label: 'fDistance', options: DISTANCES.map((d) => [String(d), t('withinKm', { n: d })]) },
  { key: 'guidebook', label: 'fGuidebook', options: [['no', t('onlyNotInGuidebooks')]] },
  { key: 'perk', label: 'fPerk', options: [['yes', t('onlyPerk')]] },
];

function matches(s, f) {
  if (f.category && s.category !== f.category) return false;
  if (f.area && s.area !== f.area) return false;
  if (f.budget) {
    const b = BUDGETS.find((x) => x.id === f.budget);
    if ((b.min != null && s.priceJPY < b.min) || (b.max != null && s.priceJPY >= b.max)) return false;
  }
  if (f.customers && s.customers !== f.customers) return false;
  if (f.years && s.years !== f.years) return false;
  if (f.distance && s.stationKm > Number(f.distance)) return false;
  if (f.guidebook === 'no' && !s.notInGuidebooks) return false;
  if (f.perk === 'yes' && !s.perk?.text) return false;
  return true;
}

/** はじめて開いたとき：忍者のケロがゲームの会話のように案内する（スキップできる）。言語は上で切り替えられる。最後に表示通貨を選ぶ */
function keroIntro(after) {
  const lines = ['intro1', 'intro2', 'intro3', 'intro4', 'intro5'];
  let i = 0;
  const el = document.createElement('div');
  el.className = 'intro';
  document.body.append(el);
  const finish = (cur) => { setCurrency(cur ?? guessedCurrency()); store('tlm.introDone', true); el.remove(); after(); };
  const draw = () => {
    const last = i === lines.length - 1;
    el.innerHTML = `
      <div class="intro-langs">${LANGS.map((l) => `<button class="${l.id === state.lang ? 'on' : ''}" data-lang="${l.id}">${l.label}</button>`).join('')}</div>
      <button class="intro-skip" data-skip>${t('introSkip')}</button>
      <div class="intro-fuji">${fuji('meet')}</div>
      <div class="intro-chara">${FULL_NINJA}</div>
      <div class="intro-box" role="dialog" aria-live="polite">
        <span class="intro-name">Kero</span>
        <p>${esc(t(lines[i]))}</p>
        ${last ? `<div class="choices">${CURRENCIES.map((c) => `<button class="choice ${c === guessedCurrency() ? 'on' : ''}" data-cur="${c}">${c}</button>`).join('')}</div>`
          : `<div class="intro-dots">${lines.map((_, j) => `<span class="${j === i ? 'on' : ''}"></span>`).join('')}</div><button class="btn primary block" data-next>${t('introNext')}</button>`}
      </div>`;
  };
  el.onclick = (e) => {
    if (e.target.closest('[data-skip]')) return finish();
    const lg = e.target.closest('[data-lang]')?.dataset.lang;
    if (lg) { setLang(lg); document.dispatchEvent(new CustomEvent('lang-changed')); return draw(); }
    const c = e.target.closest('[data-cur]')?.dataset.cur;
    if (c) return finish(c);
    if (e.target.closest('[data-next]')) { i++; draw(); }
  };
  draw();
}

function askCurrency(after) {
  const content = openSheet(`
    <h3>${t('chooseCurrency')}</h3>
    <div class="choices">${CURRENCIES.map((c) => `<button class="choice ${c === guessedCurrency() ? 'on' : ''}" data-cur="${c}">${c}</button>`).join('')}</div>
    <p class="note">${t('currencyNote')}</p>`);
  content.onclick = (e) => {
    const c = e.target.closest('[data-cur]')?.dataset.cur;
    if (!c) return;
    setCurrency(c);
    closeSheet();
    after();
  };
}

export async function render(view) {
  const [shops] = await Promise.all([loadShops(), loadRates()]);
  const f = state.filters;
  const FILTERS_ = FILTERS();
  const items = shops.filter((s) => matches(s, f));
  const active = FILTERS_.filter((x) => f[x.key]);
  const suggestions = items.length || !shops.length ? [] : active
    .map((x) => ({ x, n: shops.filter((s) => matches(s, { ...f, [x.key]: '' })).length }))
    .filter((s) => s.n > 0).sort((a, b) => b.n - a.n);

  view.innerHTML = `
    <section>
      <div class="hero-line"><div class="hero-fuji">${fuji('meet')}</div><p class="hero-ja">${t('heroJa')}</p><p class="hero-en">${t('heroEn')}</p></div>
      ${state.greetClosed ? '' : `<div class="greet"><div class="char-avatar">${AVATAR_NINJA}</div><p>${esc(t('greet'))}</p><button data-close-greet aria-label="Close">✕</button></div>`}
      <div class="filter-box">
        <div class="filters-grid">
          ${FILTERS_.map((x) => `<label class="label">${t(x.label)}
            <select data-filter="${x.key}"><option value="">${t('any')}</option>
              ${x.options.map(([v, l]) => `<option value="${esc(v)}" ${f[x.key] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}
            </select></label>`).join('')}
        </div>
      </div>
      <div class="row-between">
        <span class="muted small">${t('shopsCount', { n: items.length })} · ${t('newest')}<br>${t('markLegend')}</span>
        <span class="seg"><button data-view="list" class="${state.view === 'list' ? 'on' : ''}">${t('listView')}</button><button data-view="map" class="${state.view === 'map' ? 'on' : ''}">${t('mapView')}</button></span>
      </div>
      ${state.view === 'map' ? `
        <div class="place-search" id="place-search"></div>
        <div id="list-map" class="map ${mapsEnabled() ? '' : 'map-off'}">${mapsEnabled() ? '' : t('mapOff')}</div>
        <div id="map-pick" class="list"></div>` : ''}
      <div class="list" ${state.view === 'map' ? 'hidden' : ''}>
        ${!shops.length ? `<p class="empty">${t('noShops')}</p>`
          : items.length ? items.map(shopCard).join('')
          : `<p class="empty">${t('noMatch')}</p>${suggestions.map(({ x, n }) => `<button class="btn block" data-relax="${x.key}">${esc(t('removeFilter', { f: `${t(x.label)}: ${label(x.options.map(([id, en]) => ({ id, en })), f[x.key])}`, n }))}</button>`).join('')}`}
      </div>
      ${rateNote()}
    </section>`;

  if (state.view === 'map' && mapsEnabled()) {
    const pick = document.getElementById('map-pick');
    makeMap(document.getElementById('list-map'), {
      markers: items.map((s) => ({ lat: s.lat, lng: s.lng, title: s.name.text, onClick: () => { pick.innerHTML = shopCard(s); } })),
    }).then(({ map }) => {
      placeSearch(document.getElementById('place-search'), (p) => { if (p.lat != null) { map.setCenter({ lat: p.lat, lng: p.lng }); map.setZoom(15); } }, { placeholder: t('searchPlace') }).catch(() => {});
    }).catch(() => { document.getElementById('list-map').outerHTML = `<div class="map map-off">${t('mapOff')}</div>`; });
  }

  view.onchange = (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;
    f[key] = e.target.value;
    saveFilters();
    render(view);
  };
  view.onclick = (e) => {
    if (e.target.closest('[data-close-greet]')) { state.greetClosed = true; store('tlm.greetClosed', true); render(view); }
    const v = e.target.closest('[data-view]')?.dataset.view;
    if (v) { state.view = v; store('tlm.view', v); render(view); }
    const r = e.target.closest('[data-relax]')?.dataset.relax;
    if (r) { f[r] = ''; saveFilters(); render(view); }
  };

  if (!state.currency) {
    if (!storage('tlm.introDone', false)) keroIntro(() => render(view));
    else askCurrency(() => render(view));
  }
}
