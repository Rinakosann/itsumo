// ============================================================
//  事業者画面（日本語・スマホファースト）。画面は URL の # で切り替える。
//    #/          予約一覧（新着表示）    #/chats  #/chat/:id  チャット
//    #/shops     店舗一覧                #/shop/:id（new で新規）店舗の登録・編集
//    #/closures  受付停止日              #/account  アカウント（退会）
// ============================================================
import '../common/style.css';
import { $, $$, esc, toast } from '../common/ui.js';
import { get, post } from '../common/api.js';
import { setMapsConfig } from '../common/maps.js';
import { renderList as renderShops, renderEdit as renderShop } from './screens/shop-edit.js';
import { renderBookings, renderChats, renderThread, renderClosures, renderAccount, renderTerms, renderPrivacy, errJa } from './screens/main-screens.js';

const app = { user: null, badges: { bookings: 0, messages: 0 } };
const view = () => $('#view');
const AUTH_ERR = {
  email_taken: 'このメールアドレスはすでに登録されています。ログインしてください。', wrong_login: 'メールアドレスかパスワードが違います。',
  locked: 'ログインの失敗が続いたため、15分間ログインできません。パスワードの再設定もできます。', wrong_role: 'このメールアドレスは旅行者として登録されています。',
  weak_password: 'パスワードは8文字以上にしてください。', invalid_email: 'メールアドレスを確認してください。', terms_required: '利用規約とプライバシーポリシーへの同意が必要です。',
  invalid_token: 'このリンクは期限切れか、すでに使われています。もう一度再設定を申し込んでください。',
  invalid_kana: 'フリガナはカタカナで入力してください。', invalid_phone: '電話番号を確認してください（0から始まる10〜11桁。フリーダイヤルは使えません）。',
  missing: '入力されていない項目があります。', rate_limited: 'アクセスが集中しています。1分ほど待ってからお試しください。',
};
const authErr = (e) => AUTH_ERR[e?.code] ?? errJa(e);

// ---------- ログイン・登録・パスワード再設定 ----------

function renderAuth(mode) {
  $('#nav').hidden = true;
  const box = (inner) => { view().innerHTML = `<section class="login-box">${inner}<p class="footer-links" style="text-align:center"><a href="#/terms">利用規約</a> · <a href="#/privacy">プライバシーポリシー</a> · <a href="/">トップへ</a></p></section>`; };
  if (mode === 'register') {
    box(`<h2>事業者の登録</h2>
      <form class="form" id="f" novalidate>
        <label>お名前（店主・担当の方）<input name="name" maxlength="60" required placeholder="例：山田 花子" /></label>
        <label>フリガナ<input name="nameKana" maxlength="60" required placeholder="例：ヤマダ ハナコ" /></label>
        <label>電話番号（運営からの連絡用・お客様には表示しません）<input name="phone" type="tel" inputmode="tel" maxlength="15" required placeholder="例：0774-12-3456" /></label>
        <label>メールアドレス<input name="email" type="email" autocomplete="email" required /></label>
        <label>パスワード（8文字以上）<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
        <label class="check"><input type="checkbox" name="agree" /> <span><a href="#/terms" target="_blank">利用規約</a>と<a href="#/privacy" target="_blank">プライバシーポリシー</a>に同意する</span></label>
        <p class="error" id="err" role="alert"></p><button class="btn primary block" type="submit">登録する</button>
      </form><a class="btn block" href="#/login">登録済みの方はログイン</a>`);
  } else if (mode === 'forgot') {
    box(`<h2>パスワードの再設定</h2><form class="form" id="f"><label>登録したメールアドレス<input name="email" type="email" required /></label>
      <button class="btn primary block" type="submit">再設定のリンクを送る</button></form><a class="btn block" href="#/login">戻る</a>`);
  } else if (mode === 'reset') {
    box(`<h2>新しいパスワード</h2><form class="form" id="f"><label>パスワード（8文字以上）<input name="password" type="password" minlength="8" required /></label>
      <p class="error" id="err" role="alert"></p><button class="btn primary block" type="submit">保存</button></form>`);
  } else {
    box(`<h2>ITSUMO 事業者</h2>
      <p>海外からのお客様の予約を、<b>日本語だけ</b>で受けられます。言葉のやり取りは自動で翻訳します。</p>
      <details class="flow" ${localStorage.getItem('tlm.biz.seen') ? '' : 'open'}><summary>はじめての方へ：予約を受けるまでの流れ</summary>
        <ol class="flow-steps">
          <li><b>登録する</b><span>お名前・電話番号・メールアドレスとパスワードを入れます。ご家族で同じアカウントを使えます。</span></li>
          <li><b>お店を登録する</b><span>Googleマップでお店の名前を検索するか、郵便番号から住所を入れます。住所は実在するか確かめます。</span></li>
          <li><b>日本語で紹介を書く</b><span>「地元の人がいつも頼むもの」や「店主からのひとこと」を書くと、英語・中国語・韓国語に自動で翻訳されて公開されます。</span></li>
          <li><b>受け入れる時間と人数を決める</b><span>時間枠ごとの上限人数の範囲で、予約はすぐに確定します。休みの日は「受付停止」で止められます。</span></li>
          <li><b>予約とチャットが届く</b><span>お客様の英語・中国語・韓国語は日本語に訳して表示し、日本語で返信すればお客様の言葉に訳して届けます。</span></li>
          <li><b>当日</b><span>お客様が来店し、代金はいつもどおり現地で受け取ります（アプリでの支払いはありません）。</span></li>
        </ol></details>
      <a class="btn primary block big-btn" href="#/register">はじめての方：登録する</a>
      <h3 style="margin-top:20px">登録済みの方：ログイン</h3>
      <form class="form" id="f" novalidate>
        <label>メールアドレス<input name="email" type="email" autocomplete="email" required /></label>
        <label>パスワード<input name="password" type="password" autocomplete="current-password" required /></label>
        <p class="error" id="err" role="alert"></p><button class="btn primary block" type="submit">ログイン</button>
      </form>
      <a class="btn block" href="#/forgot">パスワードを忘れた方</a>`);
    try { localStorage.setItem('tlm.biz.seen', '1'); } catch { /* ignore */ }
  }
  const f = $('#f');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#err');
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      if (mode === 'register') {
        if (!f.agree.checked) throw Object.assign(new Error(), { code: 'terms_required' });
        await post('auth', 'register', { role: 'business', name: f.name.value, nameKana: f.nameKana.value, phone: f.phone.value, email: f.email.value, password: f.password.value, termsAgreed: true });
        location.hash = '#/shop/new';
      } else if (mode === 'forgot') {
        await post('auth', 'forgot', { email: f.email.value }).catch(() => {});
        f.outerHTML = '<p class="notice info">登録されていれば、再設定のリンクをメールで送りました。メールを確認してください。</p>';
        return;
      } else if (mode === 'reset') {
        await post('auth', 'reset', { token: new URLSearchParams(location.hash.split('?')[1]).get('token'), password: f.password.value });
        location.hash = '#/';
      } else {
        await post('auth', 'login', { email: f.email.value, password: f.password.value, role: 'business' });
        location.hash = '#/';
      }
      await start();
    } catch (er) { if (err) err.textContent = authErr(er); btn.disabled = false; }
  };
}

// ---------- 外枠 ----------

function renderNav() {
  const nav = $('#nav');
  nav.hidden = false;
  const b = app.badges;
  nav.innerHTML = [['', '📥', '予約', b.bookings], ['chats', '💬', 'チャット', b.messages], ['shops', '🏪', '店舗'], ['closures', '📅', '受付停止'], ['account', '⚙️', 'アカウント']]
    .map(([r, icon, label, badge]) => `<a class="tab" data-r="${r}" href="#/${r}"><span class="icon">${icon}${badge ? `<span class="dot">${badge}</span>` : ''}</span><span>${label}</span></a>`).join('');
  const name = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  const active = { chat: 'chats', shop: 'shops' }[name] ?? name;
  $$('.tab', nav).forEach((a) => a.classList.toggle('active', a.dataset.r === active));
  $('#who').textContent = app.user ? `${app.user.name} さん` : '';
}

async function refreshBadges() {
  if (!app.user) return;
  try { app.badges = await get('biz', 'badges'); } catch { /* ignore */ }
  renderNav();
}

const ROUTES = {
  '': renderBookings, chats: renderChats, chat: renderThread, shops: renderShops, shop: renderShop,
  closures: renderClosures, account: (v) => renderAccount(v, app.user, () => { app.user = null; location.hash = '#/login'; start(); }),
};

async function route() {
  const [path] = location.hash.replace(/^#\/?/, '').split('?');
  const [name = '', id] = path.split('/');
  if (name === 'terms') { $('#nav').hidden = !app.user; return renderTerms(view()); }
  if (name === 'privacy') { $('#nav').hidden = !app.user; return renderPrivacy(view()); }
  if (['login', 'register', 'forgot', 'reset'].includes(name)) return renderAuth(name);
  if (!app.user) return renderAuth('login');
  view().onclick = null; view().onchange = null;
  renderNav();
  view().innerHTML = '<p class="empty">読み込み中…</p>';
  try {
    await (ROUTES[name] ?? renderBookings)(view(), id);
  } catch (e) {
    if (e.status === 401) { app.user = null; return renderAuth('login'); }
    view().innerHTML = `<p class="empty">${esc(errJa(e))}</p><button class="btn block" onclick="location.reload()">もう一度読み込む</button>`;
  }
  window.scrollTo(0, 0);
}

async function start() {
  const me = await get('auth', 'me').catch(() => ({}));
  setMapsConfig(me.maps ?? {});
  app.user = me.user?.role === 'business' ? me.user : null;
  if (me.user && me.user.role !== 'business') toast('旅行者のアカウントでログイン中です。事業者のアカウントでログインしてください。');
  await route();
  refreshBadges();
}

window.addEventListener('hashchange', route);
document.addEventListener('badges-changed', refreshBadges);
// 新しい予約・キャンセル・チャットは画面上の新着表示で知らせる（30秒ごとに確認）
setInterval(() => { if (!document.hidden) refreshBadges(); }, 30000);
start();
