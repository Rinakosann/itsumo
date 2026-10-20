// ============================================================
//  旅行者画面（英語・中国語・韓国語）の入口。画面は URL の # で切り替える（ROUTES）。
//  閲覧にログインは不要。チャットと予約を始めるときにログインを求める。
// ============================================================
import '../common/style.css';
import { $, $$, esc, setReturnTo, closeSheet } from '../common/ui.js';
import { get } from '../common/api.js';
import { state, refreshMe, setLang } from './state.js';
import { post } from '../common/api.js';
import { sushi } from '../common/character-art.js';
import { LANGS } from '../../shared/constants.js';
import { t, errText } from './strings.js';
import * as list from './screens/list.js';
import * as shop from './screens/shop.js';
import * as book from './screens/book.js';
import * as bookings from './screens/bookings.js';
import * as chat from './screens/chat.js';
import * as auth from './screens/auth.js';
import * as account from './screens/account.js';

const ROUTES = {
  '': list.render,
  shop: shop.render,
  book: book.render,
  bookings: bookings.renderList,
  booking: bookings.renderOne,
  chats: chat.renderList,
  chat: chat.renderThread,
  login: auth.renderLogin,
  register: auth.renderRegister,
  forgot: auth.renderForgot,
  reset: auth.renderReset,
  account: account.render,
  terms: account.renderTerms,
  privacy: account.renderPrivacy,
};
const NEEDS_LOGIN = ['book', 'bookings', 'booking', 'chats', 'chat'];
const TAB = { '': 'explore', shop: 'explore', book: 'explore', bookings: 'bookings', booking: 'bookings', chats: 'chats', chat: 'chats', account: 'account', login: 'account', register: 'account', terms: 'account', privacy: 'account' };

function renderNav() {
  const tabs = [['explore', '#/', '🗺️', t('navExplore')], ['bookings', '#/bookings', '🎫', t('navBookings')], ['chats', '#/chats', '💬', t('navChats'), state.unread], ['account', '#/account', '👤', t('navAccount')]];
  $('#nav').innerHTML = tabs.map(([k, href, icon, label, badge]) => `<a class="tab" data-tab="${k}" href="${href}"><span class="icon">${icon}${badge ? `<span class="dot">${badge}</span>` : ''}</span><span>${esc(label)}</span></a>`).join('');
  const [path] = location.hash.replace(/^#\/?/, '').split('?');
  $$('.tab').forEach((a) => a.classList.toggle('active', a.dataset.tab === TAB[path.split('/')[0]]));
}

async function refreshBadges() {
  if (!state.user) { state.unread = 0; return renderNav(); }
  const { items } = await get('chat', 'threads').catch(() => ({ items: [] }));
  state.unread = items.reduce((n, x) => n + x.unread, 0);
  renderNav();
}

async function route() {
  closeSheet();
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const [name = '', id] = path.split('/');
  const view = $('#view');
  if (NEEDS_LOGIN.includes(name) && !state.user) { setReturnTo(location.hash); location.hash = '#/login'; return; }
  view.onclick = null; view.onchange = null; view.oninput = null;
  renderNav();
  view.innerHTML = `<div class="loader"><div class="lane">${['maguro', 'salmon', 'tamago', 'ebi', 'ikura'].map((k) => `<span>${sushi(k)}</span>`).join('')}</div><p>${t('loadingSushi')}</p></div>`;
  try {
    await (ROUTES[name] ?? list.render)(view, id, new URLSearchParams(qs));
  } catch (e) {
    console.error(e);
    // 何が起きたかと、次にできること
    view.innerHTML = `<p class="empty">${esc(errText(e))}</p><button class="btn block" data-retry>${t('retry')}</button>`;
    view.onclick = (ev) => { if (ev.target.closest('[data-retry]')) route(); };
  }
  window.scrollTo(0, 0);
}

/** 表示言語の切り替え（右上）。お店の文も選んだ言語の翻訳に変わる */
function renderLangSwitch() {
  const sel = $('#lang-switch');
  sel.innerHTML = LANGS.map((l) => `<option value="${l.id}" ${l.id === state.lang ? 'selected' : ''}>🌐 ${l.label}</option>`).join('');
}
$('#lang-switch').onchange = (e) => {
  setLang(e.target.value);
  if (state.user) post('auth', 'profile', { lang: state.lang }).catch(() => {});
  document.dispatchEvent(new CustomEvent('lang-changed'));
  route();
};
document.addEventListener('lang-changed', () => { renderLangSwitch(); renderNav(); });

window.addEventListener('hashchange', route);
document.addEventListener('auth-changed', refreshBadges);
document.addEventListener('badges-changed', refreshBadges);
setInterval(() => { if (!document.hidden) refreshBadges(); }, 30000); // 新着メッセージ（画面上の未読バッジ）

(async () => {
  setLang(state.lang);
  renderLangSwitch();
  await refreshMe().catch(() => {});
  renderNav();
  route();
  refreshBadges();
})();
