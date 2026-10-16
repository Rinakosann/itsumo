// ============================================================
//  一覧：新着順。絞り込み（カテゴリ・エリア・予算・客層・営業年数・主要駅からの距離）。
//  一覧／地図の切り替え。地図では実在の場所を検索して移動できる。
//  初回は表示通貨を選ぶ。キャラクターが上で一言（×で閉じられる）。
// ============================================================
import { esc, openSheet, closeSheet, store } from '../../common/ui.js';
import { makeMap, placeSearch, mapsEnabled } from '../../common/maps.js';
import { AVATAR } from '../../common/character-art.js';
import { state, saveFilters, setCurrency, guessedCurrency, loadShops, loadRates } from '../state.js';
import { t } from '../strings.js';
import { shopCard, rateNote, label } from '../components.js';
import { AREAS, CATEGORIES, CUSTOMERS, YEARS, BUDGETS, DISTANCES, CURRENCIES } from '../../../shared/constants.js';

const FILTERS = [
  { key: 'category', label: 'fCategory', options: CATEGORIES.map((c) => [c.id, c.en]) },
  { key: 'area', label: 'fArea', options: AREAS.map((a) => [a.id, a.en]) },
  { key: 'budget', label: 'fBudget', options: BUDGETS.map((b) => [b.id, b.en]) },
  { key: 'customers', label: 'fCustomers', options: CUSTOMERS.map((c) => [c.id, c.en]) },
  { key: 'years', label: 'fYears', options: YEARS.map((y) => [y.id, y.en]) },
  { key: 'distance', label: 'fDistance', options: DISTANCES.map((d) => [String(d), t('withinKm', { n: d })]) },
  { key: 'guidebook', label: 'fGuidebook', options: [['no', t('onlyNotInGuidebooks')]] },
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
  return true;
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
  const items = shops.filter((s) => matches(s, f));
  const active = FILTERS.filter((x) => f[x.key]);
  const suggestions = items.length || !shops.length ? [] : active
    .map((x) => ({ x, n: shops.filter((s) => matches(s, { ...f, [x.key]: '' })).length }))
    .filter((s) => s.n > 0).sort((a, b) => b.n - a.n);

  view.innerHTML = `
    <section>
      ${state.greetClosed ? '' : `<div class="greet"><div class="char-avatar">${AVATAR}</div><p>${esc(t('greet'))}</p><button data-close-greet aria-label="Close">✕</button></div>`}
      <div class="filter-box">
        <div class="filters-grid">
          ${FILTERS.map((x) => `<label class="label">${t(x.label)}
            <select data-filter="${x.key}"><option value="">${t('any')}</option>
              ${x.options.map(([v, l]) => `<option value="${esc(v)}" ${f[x.key] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}
            </select></label>`).join('')}
        </div>
      </div>
      <div class="row-between">
        <span class="muted small">${t('shopsCount', { n: items.length })} · ${t('newest')}</span>
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

  if (!state.currency) askCurrency(() => render(view));
}
