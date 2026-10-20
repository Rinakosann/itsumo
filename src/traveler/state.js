// 旅行者画面の状態
import { get, post } from '../common/api.js';
import { storage, store } from '../common/ui.js';
import { setMapsConfig } from '../common/maps.js';
import { CURRENCIES, LANGS, LANG_IDS } from '../../shared/constants.js';

function guessCurrency() {
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return { SG: 'SGD', US: 'USD', CN: 'CNY', HK: 'HKD', TW: 'TWD', KR: 'KRW', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR' }[region] ?? 'USD';
}

function guessLang() {
  const l = (navigator.language || '').toLowerCase();
  return l.startsWith('zh') ? 'zh' : l.startsWith('ko') ? 'ko' : 'en';
}

export const state = {
  user: null,
  lang: LANG_IDS.includes(storage('tlm.lang', null)) ? storage('tlm.lang', null) : guessLang(),
  currency: storage('tlm.currency', null), // null = まだ選んでいない（初回に選ぶ）
  rates: null,
  shops: null,
  filters: storage('tlm.filters', {}),
  view: storage('tlm.view', 'list'),
  greetClosed: storage('tlm.greetClosed', false),
  // 探す条件（日本全国から）：地方・都道府県・現在地・日付・人数
  search: { region: '', pref: '', near: null, date: '', people: 2, ...storage('tlm.search', {}) },
  keroOn: storage('tlm.kero', true), // 右下のケロを表示するか（メニューで切り替え）
  unread: 0,
  visitorId: storage('tlm.visitor', null) ?? (() => { const v = Math.random().toString(36).slice(2); store('tlm.visitor', v); return v; })(),
};

export const guessedCurrency = guessCurrency;

export function setCurrency(c) {
  if (!CURRENCIES.includes(c)) return;
  state.currency = c;
  store('tlm.currency', c);
}
export const saveFilters = () => store('tlm.filters', state.filters);
export const saveSearch = () => { store('tlm.search', state.search); state.shops = null; };

/** 表示言語を変える（お店の文は日本語から自動翻訳されたものに切り替わる） */
export function setLang(l) {
  if (!LANG_IDS.includes(l)) return;
  state.lang = l;
  state.shops = null;
  store('tlm.lang', l);
  document.documentElement.lang = LANGS.find((x) => x.id === l).locale;
}
/** 日付の書式に使う言語 */
export const locale = () => LANGS.find((x) => x.id === state.lang)?.locale ?? 'en';

export async function refreshMe() {
  const me = await get('auth', 'me');
  state.user = me.user?.role === 'traveler' ? me.user : null;
  state.otherRole = me.user && me.user.role !== 'traveler';
  setMapsConfig(me.maps ?? {});
  if (state.user?.currency && !state.currency) setCurrency(state.user.currency);
  if (state.user && state.user.lang !== state.lang) post('auth', 'profile', { lang: state.lang }).catch(() => {}); // チャットの翻訳先をそろえる
  return me;
}

export async function loadRates() {
  if (state.rates) return state.rates;
  try { state.rates = await get('rates', 'get'); } catch { state.rates = { rates: null }; }
  return state.rates;
}

export async function loadShops(force) {
  if (!state.shops || force) {
    const { date, people } = state.search;
    state.shops = (await get('shops', 'list', { lang: state.lang, date: date || '', people: people || 1 })).items;
  }
  return state.shops;
}
