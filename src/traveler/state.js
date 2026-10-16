// 旅行者画面の状態
import { get } from '../common/api.js';
import { storage, store } from '../common/ui.js';
import { setMapsConfig } from '../common/maps.js';
import { CURRENCIES } from '../../shared/constants.js';

function guessCurrency() {
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return { SG: 'SGD', US: 'USD', CN: 'CNY', HK: 'HKD', TW: 'TWD', KR: 'KRW', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR' }[region] ?? 'USD';
}

export const state = {
  user: null,
  currency: storage('tlm.currency', null), // null = まだ選んでいない（初回に選ぶ）
  rates: null,
  shops: null,
  filters: storage('tlm.filters', {}),
  view: storage('tlm.view', 'list'),
  greetClosed: storage('tlm.greetClosed', false),
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

export async function refreshMe() {
  const me = await get('auth', 'me');
  state.user = me.user?.role === 'traveler' ? me.user : null;
  state.otherRole = me.user && me.user.role !== 'traveler';
  setMapsConfig(me.maps ?? {});
  if (state.user?.currency && !state.currency) setCurrency(state.user.currency);
  return me;
}

export async function loadRates() {
  if (state.rates) return state.rates;
  try { state.rates = await get('rates', 'get'); } catch { state.rates = { rates: null }; }
  return state.rates;
}

export async function loadShops(force) {
  if (!state.shops || force) state.shops = (await get('shops', 'list')).items;
  return state.shops;
}
