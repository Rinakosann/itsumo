// ============================================================
//  旅行者画面（英語・中国語・韓国語・日本語）の入口。画面は URL の # で切り替える（ROUTES）。
//  左上の ☰ メニュー（引き出し）から、探す・予約・メッセージ・言語と通貨などへ行く。
//  閲覧にログインは不要。チャットと予約を始めるときにログインを求める。
// ============================================================
import '../common/style.css';
import { $, esc, setReturnTo, closeSheet, openSheet, store } from '../common/ui.js';
import { get, post } from '../common/api.js';
import { sushi, AVATAR_NINJA } from '../common/character-art.js';
import { state, refreshMe, setLang, setCurrency } from './state.js';
import { t, errText } from './strings.js';
import { LANGS, OPERATOR } from '../../shared/constants.js';
import { langCurHtml } from './components.js';
import * as list from './screens/list.js';
import * as where from './screens/where.js';
import * as shop from './screens/shop.js';
import * as book from './screens/book.js';
import * as bookings from './screens/bookings.js';
import * as chat from './screens/chat.js';
import * as auth from './screens/auth.js';
import * as account from './screens/account.js';

const ROUTES = {
  '': list.render,
  where: where.render,
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
// 画面ごとのケロのひとこと
const KERO_LINE = { '': 'keroList', shop: 'keroShop' };
const NO_FLOAT = ['where']; // この画面ではケロは見出しの横に出す

const routeName = () => location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];

// ---------- 左上のメニュー（引き出し） ----------
function renderDrawer() {
  const cur = routeName();
  const item = (href, icon, key, extra = '') => `<a class="drawer-item ${cur === href.replace(/^#\/?/, '').split('/')[0] ? 'on' : ''}" href="${href}"><span class="di-icon">${icon}</span><span>${esc(t(key))}</span>${extra}</a>`;
  $('#drawer-panel').innerHTML = `
    <div class="drawer-head"><b>${t('menu')}</b><button class="sheet-close" data-close-drawer aria-label="${esc(t('menuClose'))}">✕</button></div>
    ${item('#/where', '🗾', 'menuSearch')}
    ${item('#/bookings', '🎫', 'navBookings')}
    ${item('#/chats', '💬', 'navChats', state.unread ? `<span class="dot">${state.unread}</span>` : '')}
    ${state.user ? item('#/account', '👤', 'navAccount') : item('#/login', '🔑', 'login')}
    <button class="drawer-item" data-langcur><span class="di-icon">🌐</span><span>${esc(t('menuLangCur'))}</span><span class="di-val">${esc(LANGS.find((l) => l.id === state.lang).label)} · ${esc(state.currency ?? 'JPY')}</span></button>
    <button class="drawer-item" data-kero-toggle><span class="di-icon">🐸</span><span>${esc(t('menuKero'))}</span><span class="toggle ${state.keroOn ? 'on' : ''}">${state.keroOn ? 'ON' : 'OFF'}</span></button>
    <hr />
    ${item('#/terms', '📄', 'terms')}
    ${item('#/privacy', '🔒', 'privacy')}
    <a class="drawer-item" href="mailto:${OPERATOR.email}"><span class="di-icon">✉️</span><span>${esc(t('contact'))}</span></a>
    <a class="drawer-item" href="/business"><span class="di-icon">🏮</span><span>${esc(t('menuForShops'))}</span></a>
    <a class="drawer-item" href="/"><span class="di-icon">🗻</span><span>${esc(t('menuTop'))}</span></a>`;
}
function openDrawer() { renderDrawer(); $('#drawer').hidden = false; $('#menu-btn').setAttribute('aria-expanded', 'true'); }
function closeDrawer() { $('#drawer').hidden = true; $('#menu-btn').setAttribute('aria-expanded', 'false'); }
$('#menu-btn').onclick = openDrawer;
$('#drawer').addEventListener('click', (e) => {
  if (e.target.closest('[data-close-drawer]') || e.target.closest('a')) return closeDrawer();
  if (e.target.closest('[data-langcur]')) { closeDrawer(); openLangCur(); }
  if (e.target.closest('[data-kero-toggle]')) { state.keroOn = !state.keroOn; store('tlm.kero', state.keroOn); renderDrawer(); renderKero(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

// ---------- 言語と通貨（右上のボタン・メニューから） ----------
function changeLang(l) {
  setLang(l);
  if (state.user) post('auth', 'profile', { lang: state.lang }).catch(() => {});
  document.dispatchEvent(new CustomEvent('lang-changed'));
}
function openLangCur() {
  const draw = () => {
    const c = openSheet(`<h3>${t('langCurTitle')}</h3>${langCurHtml()}<button class="btn primary block" data-done style="margin-top:16px">${t('done')}</button>`);
    c.onclick = (e) => {
      const l = e.target.closest('[data-lang]')?.dataset.lang;
      if (l) { changeLang(l); draw(); return; }
      const cur = e.target.closest('[data-cur]')?.dataset.cur;
      if (cur) { setCurrency(cur); if (state.user) post('auth', 'profile', { currency: cur }).catch(() => {}); draw(); return; }
      if (e.target.closest('[data-done]')) { closeSheet(); route(); }
    };
  };
  draw();
}
$('#langcur-btn').onclick = openLangCur;
function renderHeader() {
  $('#langcur-btn').innerHTML = `🌐 ${esc(LANGS.find((l) => l.id === state.lang).short)} · ${esc(state.currency ?? 'JPY')}`;
  $('#menu-dot').hidden = !state.unread;
  $('#menu-btn').setAttribute('aria-label', t('menu'));
}
document.addEventListener('lang-changed', () => { renderHeader(); renderKero(); });

// ---------- 右下の忍者ケロ（画面ごとにひとこと。メニューで消せる） ----------
let keroBubble = true;
function renderKero() {
  const el = $('#kero');
  const line = KERO_LINE[routeName()];
  el.hidden = !state.keroOn || document.querySelector('.intro') != null || NO_FLOAT.includes(routeName());
  el.innerHTML = `${keroBubble && line ? `<div class="kero-bubble"><p>${esc(t(line))}</p><button class="link" data-kero-hide>${t('keroHide')}</button></div>` : ''}<button class="kero-btn" data-kero-tap aria-label="Kero">${AVATAR_NINJA}</button>`;
  // 吹き出しは少したったら消える（画面のボタンにかぶらないように）。ケロを押すとまた出る
  clearTimeout(renderKero.timer);
  if (keroBubble && line) renderKero.timer = setTimeout(() => { keroBubble = false; renderKero(); }, 6000);
}
$('#kero').addEventListener('click', (e) => {
  if (e.target.closest('[data-kero-hide]')) { keroBubble = false; renderKero(); }
  else if (e.target.closest('[data-kero-tap]')) { keroBubble = !keroBubble; renderKero(); }
});

async function refreshBadges() {
  if (!state.user) { state.unread = 0; return renderHeader(); }
  const { items } = await get('chat', 'threads').catch(() => ({ items: [] }));
  state.unread = items.reduce((n, x) => n + x.unread, 0);
  renderHeader();
}

async function route() {
  closeSheet();
  closeDrawer();
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const [name = '', id] = path.split('/');
  const view = $('#view');
  if (NEEDS_LOGIN.includes(name) && !state.user) { setReturnTo(location.hash); location.hash = '#/login'; return; }
  view.onclick = null; view.onchange = null; view.oninput = null; view.onkeydown = null;
  document.body.dataset.route = name;
  renderHeader();
  keroBubble = true;
  renderKero();
  view.innerHTML = `<div class="loader"><div class="lane">${['maguro', 'salmon', 'tamago', 'ebi', 'ikura'].map((k) => `<span>${sushi(k)}</span>`).join('')}</div><p>${t('loadingSushi')}</p></div>`;
  try {
    await (ROUTES[name] ?? list.render)(view, id, new URLSearchParams(qs));
  } catch (e) {
    console.error(e);
    // 何が起きたかと、次にできること
    view.innerHTML = `<p class="empty">${esc(errText(e))}</p><button class="btn block" data-retry>${t('retry')}</button>`;
    view.onclick = (ev) => { if (ev.target.closest('[data-retry]')) route(); };
  }
  renderKero();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
document.addEventListener('auth-changed', refreshBadges);
document.addEventListener('badges-changed', refreshBadges);
document.addEventListener('intro-done', () => { renderHeader(); renderKero(); });
setInterval(() => { if (!document.hidden) refreshBadges(); }, 30000); // 新着メッセージ（メニューの未読）

(async () => {
  setLang(state.lang);
  renderHeader();
  await refreshMe().catch(() => {});
  route();
  refreshBadges();
})();
