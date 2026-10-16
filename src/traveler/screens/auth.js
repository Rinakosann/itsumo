// 登録・ログイン・パスワード再設定。終わったら、押したボタンの画面（チャットか予約）に戻る。
import { esc, takeReturnTo } from '../../common/ui.js';
import { post } from '../../common/api.js';
import { state, refreshMe } from '../state.js';
import { t, errText } from '../strings.js';

async function done() {
  await refreshMe();
  document.dispatchEvent(new CustomEvent('auth-changed'));
  location.hash = takeReturnTo('#/');
}

export function renderLogin(view) {
  if (state.user) return done();
  view.innerHTML = `
    <section class="login-box">
      <h2>${t('loginTitle')}</h2>
      <form class="form" id="f" novalidate>
        <label>${t('email')}<input name="email" type="email" autocomplete="email" required /></label>
        <label>${t('password')}<input name="password" type="password" autocomplete="current-password" required /></label>
        <p class="error" id="err" role="alert"></p>
        <button class="btn primary block" type="submit">${t('login')}</button>
      </form>
      <a class="btn block" href="#/register">${t('noAccount')}</a>
      <a class="btn block" href="#/forgot">${t('forgot')}</a>
    </section>`;
  const f = view.querySelector('#f');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const btn = f.querySelector('button'); btn.disabled = true;
    try { await post('auth', 'login', { email: f.email.value, password: f.password.value, role: 'traveler' }); await done(); }
    catch (err) { view.querySelector('#err').textContent = errText(err); btn.disabled = false; }
  };
}

export function renderRegister(view) {
  if (state.user) return done();
  const link = (key, href) => `<a href="${href}" target="_blank">${t(key)}</a>`;
  view.innerHTML = `
    <section class="login-box">
      <h2>${t('registerTitle')}</h2>
      <form class="form" id="f" novalidate>
        <label>${t('name')}<input name="name" autocomplete="name" maxlength="60" required /></label>
        <label>${t('email')}<input name="email" type="email" autocomplete="email" required /></label>
        <label>${t('password')}<input name="password" type="password" autocomplete="new-password" minlength="8" required /><span class="muted small">${t('passwordHint')}</span></label>
        <label class="check"><input type="checkbox" name="agree" /> <span>${t('agree', { terms: link('terms', '#/terms'), privacy: link('privacy', '#/privacy') })}</span></label>
        <p class="error" id="err" role="alert"></p>
        <button class="btn primary block" type="submit">${t('register')}</button>
      </form>
      <a class="btn block" href="#/login">${t('haveAccount')}</a>
    </section>`;
  const f = view.querySelector('#f');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const err = view.querySelector('#err');
    if (!f.name.value.trim()) { err.textContent = t('name'); return; }
    if (!f.agree.checked) { err.textContent = t('err_terms_required'); return; }
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await post('auth', 'register', { role: 'traveler', name: f.name.value, email: f.email.value, password: f.password.value, termsAgreed: true, currency: state.currency });
      await done();
    } catch (er) { err.textContent = errText(er); btn.disabled = false; }
  };
}

export function renderForgot(view) {
  view.innerHTML = `
    <section class="login-box">
      <h2>${t('forgotTitle')}</h2>
      <form class="form" id="f"><label>${t('email')}<input name="email" type="email" required /></label>
      <button class="btn primary block" type="submit">${t('sendLink')}</button></form>
      <a class="btn block" href="#/login">${t('back')}</a>
    </section>`;
  const f = view.querySelector('#f');
  f.onsubmit = async (e) => {
    e.preventDefault();
    await post('auth', 'forgot', { email: f.email.value }).catch(() => {});
    f.outerHTML = `<p class="notice info">${esc(t('sent'))}</p>`;
  };
}

export function renderReset(view, _id, query) {
  view.innerHTML = `
    <section class="login-box">
      <h2>${t('forgotTitle')}</h2>
      <form class="form" id="f"><label>${t('newPassword')}<input name="password" type="password" minlength="8" autocomplete="new-password" required /><span class="muted small">${t('passwordHint')}</span></label>
      <p class="error" id="err" role="alert"></p><button class="btn primary block" type="submit">${t('save')}</button></form>
    </section>`;
  const f = view.querySelector('#f');
  f.onsubmit = async (e) => {
    e.preventDefault();
    try { await post('auth', 'reset', { token: query.get('token'), password: f.password.value }); await done(); }
    catch (er) { view.querySelector('#err').textContent = errText(er); }
  };
}
