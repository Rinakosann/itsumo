// アカウント（名前・通貨・ログアウト・退会）と、利用規約・プライバシーポリシー
import { esc, toast } from '../../common/ui.js';
import { post } from '../../common/api.js';
import { state, setCurrency, refreshMe } from '../state.js';
import { t, errText } from '../strings.js';
import { TERMS_EN, PRIVACY_EN, legalHtml } from '../../common/legal.js';
import { CURRENCIES, OPERATOR } from '../../../shared/constants.js';

export function render(view) {
  const u = state.user;
  view.innerHTML = `
    <section>
      <h2>${t('accountTitle')}</h2>
      ${u ? `
      <form class="form" id="f">
        <label>${t('name')}<input name="name" value="${esc(u.name)}" maxlength="60" /></label>
        <p class="muted small">${esc(u.email)}</p>
        <button class="btn" type="submit">${t('save')}</button>
      </form>` : `<a class="btn primary block" href="#/login">${t('login')}</a><a class="btn block" href="#/register">${t('register')}</a>`}
      <div class="section">
        <label class="label">${t('currency')}<select id="cur">${CURRENCIES.map((c) => `<option ${state.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      </div>
      <div class="section">
        <a class="btn block" href="#/terms">${t('terms')}</a>
        <a class="btn block" href="#/privacy">${t('privacy')}</a>
        <p class="small muted">${t('contact')}: <a href="mailto:${OPERATOR.email}">${OPERATOR.email}</a></p>
      </div>
      ${u ? `<div class="section"><button class="btn block" data-logout>${t('logout')}</button><button class="btn block danger" data-delete>${t('deleteAccount')}</button></div>` : ''}
    </section>`;
  const f = view.querySelector('#f');
  if (f) f.onsubmit = async (e) => {
    e.preventDefault();
    const btn = f.querySelector('button'); if (btn.disabled) return; btn.disabled = true;
    try { await post('auth', 'profile', { name: f.name.value }); await refreshMe(); toast(t('saved')); } catch (er) { toast(errText(er)); } finally { btn.disabled = false; }
  };
  view.querySelector('#cur').onchange = async (e) => {
    setCurrency(e.target.value);
    if (u) await post('auth', 'profile', { currency: e.target.value }).catch(() => {});
    toast(t('saved'));
  };
  view.onclick = async (e) => {
    if (e.target.closest('[data-logout]')) { await post('auth', 'logout'); await refreshMe(); document.dispatchEvent(new CustomEvent('auth-changed')); location.hash = '#/'; }
    if (e.target.closest('[data-delete]')) {
      const pw = prompt(t('deleteConfirm'));
      if (!pw) return;
      try { await post('auth', 'delete', { password: pw }); await refreshMe(); document.dispatchEvent(new CustomEvent('auth-changed')); toast(t('deleted')); location.hash = '#/'; }
      catch (er) { toast(errText(er)); if (er.code === 'has_future_bookings') location.hash = '#/bookings'; }
    }
  };
}

export const renderTerms = (view) => { view.innerHTML = `<section><a class="back" href="javascript:history.back()">← ${t('back')}</a>${legalHtml(TERMS_EN, esc)}</section>`; };
export const renderPrivacy = (view) => { view.innerHTML = `<section><a class="back" href="javascript:history.back()">← ${t('back')}</a>${legalHtml(PRIVACY_EN, esc)}</section>`; };
