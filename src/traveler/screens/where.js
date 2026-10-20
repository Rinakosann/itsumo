// ============================================================
//  どこへ行きますか？：日本全国から行き先を選ぶ（Jimotoを参考にした構成）
//  タイル地図（四角を並べた日本地図）で地方 → 都道府県を選ぶ。現在地の近くでも探せる。
//  日付と人数を選んで「探す」→ 一覧へ。「地図から探す」→ 一覧の地図表示へ。
// ============================================================
import { esc, toast } from '../../common/ui.js';
import { fuji, AVATAR_NINJA } from '../../common/character-art.js';
import { state, saveSearch, loadShops } from '../state.js';
import { t } from '../strings.js';
import { L } from '../components.js';
import { REGIONS, PREFS, prefOf, LIMITS } from '../../../shared/constants.js';
import { todayJST, addDays } from '../../../shared/time.js';

const CELL = 30; // タイル1つの大きさ
const regionOf = (id) => REGIONS.find((r) => r.id === id);

/** タイル地図。地方を選ぶ前は地方ごとに色分け、選んだ後はその地方の都道府県だけ明るくする */
function tileMap(sel, counts) {
  const w = 13 * CELL; const h = 13 * CELL;
  return `<svg viewBox="-4 -4 ${w + 8} ${h + 8}" class="tilemap" role="img" aria-label="${esc(t('japan'))}">
    ${PREFS.map((p) => {
      const r = regionOf(p.region);
      const active = !sel.region || sel.region === p.region;
      const on = sel.pref === p.id;
      const n = counts[p.id] ?? 0;
      return `<g class="tile ${active ? '' : 'dim'} ${on ? 'on' : ''}" data-tile="${p.id}" data-region="${p.region}" tabindex="0">
        <rect x="${p.x * CELL}" y="${p.y * CELL}" width="${CELL - 3}" height="${CELL - 3}" rx="6" fill="${r.color}"/>
        <text x="${p.x * CELL + (CELL - 3) / 2}" y="${p.y * CELL + 17}" text-anchor="middle">${esc(p.ja.replace(/[都府県]$/, '').slice(0, 2))}</text>
        ${n ? `<circle cx="${p.x * CELL + CELL - 6}" cy="${p.y * CELL + 2}" r="7" class="cnt"/><text class="cnt-t" x="${p.x * CELL + CELL - 6}" y="${p.y * CELL + 5.5}" text-anchor="middle">${n}</text>` : ''}
      </g>`;
    }).join('')}
  </svg>`;
}

export async function render(view) {
  const shops = await loadShops().catch(() => []);
  const counts = {};
  for (const s of shops) if (s.pref) counts[s.pref] = (counts[s.pref] ?? 0) + 1;
  const sel = { ...state.search }; // 日付は任意（選ぶと、その日に空いているお店を先に出す）

  const draw = () => {
    const region = regionOf(sel.region);
    const crumbs = `<button class="link" data-crumb="all">${t('japan')}</button>${region ? ` › <button class="link" data-crumb="region">${esc(L(region))}</button>` : ''}${sel.pref ? ` › <b>${esc(L(prefOf(sel.pref)))}</b>` : ''}${sel.near ? ` › <b>${t('nearYou')}</b>` : ''}`;
    view.innerHTML = `
      <section class="where">
        <div class="where-head"><h2>${t('whereTitle')}</h2>${state.keroOn ? `<div class="where-kero"><span class="wk-say">${esc(t('keroWhere'))}</span><span class="wk-av">${AVATAR_NINJA}</span></div>` : ''}</div>
        <div class="label">${t('whereDest')}</div>
        <p class="crumbs">${crumbs}</p>
        <div class="tilemap-box"><div class="tm-fuji">${fuji('meet')}</div>${tileMap(sel, counts)}</div>
        <p class="note">${region ? t('pickPref') : t('tapRegion')}</p>
        <div class="pill-row">
          ${region
            ? PREFS.filter((p) => p.region === region.id).map((p) => `<button class="pill ${sel.pref === p.id ? 'on' : ''}" data-pref="${p.id}">${esc(L(p))}${counts[p.id] ? ` <small>${counts[p.id]}</small>` : ''}</button>`).join('')
            : `<button class="pill ${!sel.region && !sel.near ? 'on' : ''}" data-region="">${t('allJapan')}</button>${REGIONS.map((r) => `<button class="pill" data-region="${r.id}"><i class="swatch" style="background:${r.color}"></i>${esc(L(r))}</button>`).join('')}`}
        </div>
        <button class="btn ${sel.near ? 'primary' : ''}" data-near style="margin-top:10px">${t('nearMe')}</button>
        <div class="when-row">
          <label class="label">${t('date')}<input type="date" data-f="date" value="${sel.date || ''}" min="${todayJST()}" max="${addDays(todayJST(), LIMITS.bookingDaysAhead)}" />
            ${sel.date ? `<button type="button" class="link small" data-nodate>${t('anyDate')}</button>` : `<span class="note">${t('anyDate')}</span>`}</label>
          <div class="label">${t('people')}
            <div class="stepper"><button type="button" data-people="-1" aria-label="-">−</button><b>${sel.people}</b><button type="button" data-people="1" aria-label="+">＋</button></div>
          </div>
        </div>
        <button class="btn primary block" data-go="list">${t('search')}</button>
        <button class="btn block" data-go="map">${t('searchMap')}</button>
      </section>`;
  };
  draw();

  const go = (mode) => {
    Object.assign(state.search, sel);
    saveSearch();
    state.view = mode;
    try { localStorage.setItem('tlm.view', JSON.stringify(mode)); } catch { /* ignore */ }
    location.hash = '#/';
  };
  view.onclick = (e) => {
    const d = e.target.closest('[data-crumb],[data-region],[data-pref],[data-tile],[data-near],[data-people],[data-go],[data-nodate]')?.dataset;
    if (!d) return;
    if (d.nodate !== undefined) sel.date = '';
    if (d.crumb === 'all') Object.assign(sel, { region: '', pref: '', near: null });
    if (d.crumb === 'region') Object.assign(sel, { pref: '', near: null });
    if (d.region !== undefined && d.tile === undefined) Object.assign(sel, { region: d.region, pref: '', near: null });
    if (d.tile) {
      // 地方を選ぶ前はタイルで地方を選び、選んだ後は都道府県を選ぶ
      if (!sel.region || sel.region !== d.region) Object.assign(sel, { region: d.region, pref: '', near: null });
      else Object.assign(sel, { pref: sel.pref === d.tile ? '' : d.tile, near: null });
    }
    if (d.pref) Object.assign(sel, { pref: sel.pref === d.pref ? '' : d.pref, near: null });
    if (d.people) sel.people = Math.min(LIMITS.maxCapacity, Math.max(1, sel.people + Number(d.people)));
    if (d.near !== undefined) {
      if (sel.near) { sel.near = null; draw(); return; }
      if (!navigator.geolocation) return toast(t('geoFail'));
      navigator.geolocation.getCurrentPosition(
        (pos) => { Object.assign(sel, { region: '', pref: '', near: { lat: pos.coords.latitude, lng: pos.coords.longitude } }); draw(); },
        () => toast(t('geoFail')), { timeout: 8000 },
      );
      return;
    }
    if (d.go) return go(d.go);
    draw();
  };
  view.onchange = (e) => { if (e.target.dataset.f === 'date') { sel.date = e.target.value; draw(); } };
  view.onkeydown = (e) => { if (e.key === 'Enter' && e.target.closest('[data-tile]')) e.target.closest('[data-tile]').dispatchEvent(new MouseEvent('click', { bubbles: true })); };
}
