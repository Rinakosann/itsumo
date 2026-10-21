// 事業者画面：予約一覧・チャット・受付停止日・アカウント・規約
import { $, esc, toast, openSheet, closeSheet } from '../../common/ui.js';
import { get, post } from '../../common/api.js';
import { TERMS_JA, PRIVACY_JA, legalHtml } from '../../common/legal.js';
import { DIETARY, CANCEL_REASONS, LIMITS, OPERATOR } from '../../../shared/constants.js';
import { todayJST, weekday } from '../../../shared/time.js';

export const ERR = {
  offline: 'インターネットに接続できません。通信状況を確認して、もう一度お試しください。',
  server_error: 'エラーが発生しました。少し待ってから、もう一度お試しください。',
  cannot_cancel: 'この予約はキャンセルできません（すでに開始時刻を過ぎているか、キャンセル済みです）。',
  has_future_bookings: '先に、これからの予約をすべてキャンセルしてください。',
  wrong_password: 'パスワードが違います。',
};
export const errJa = (e) => ERR[e?.code] ?? ERR.server_error;
const fmtDate = (d) => new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
const fmt = (iso) => new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }).format(new Date(iso));
const STATUS = { confirmed: ['確定', 'ok'], completed: ['完了', ''], cancelled_traveler: ['お客様がキャンセル', 'muted'], cancelled_business: ['こちらでキャンセル', 'muted'] };

// ---------- 予約一覧 ----------

export async function renderBookings(view) {
  const { items } = await get('biz', 'bookings');
  document.dispatchEvent(new CustomEvent('badges-changed'));
  const upcoming = items.filter((b) => b.status === 'confirmed');
  const others = items.filter((b) => b.status !== 'confirmed').reverse();
  const card = (b) => `
    <div class="card col">
      <div class="row-between"><h3>${fmtDate(b.date)} ${b.time}〜 ${b.isNew ? '<span class="badge-new">新着</span>' : ''}${b.isNewCancel ? '<span class="badge-new">キャンセル</span>' : ''}</h3>
        <span class="badge ${STATUS[b.status][1]}">${STATUS[b.status][0]}</span></div>
      <div class="sub">🏪 ${esc(b.shopName)} · 👥 ${b.people}名</div>
      <div class="sub">👤 ${esc(b.travelerName)}${b.travelerEmail ? `（${esc(b.travelerEmail)}）` : ''}</div>
      ${b.dietary.length ? `<div class="notice warn small"><b>食事制限：</b>${b.dietary.map((d) => esc(DIETARY.find((x) => x.id === d)?.ja ?? d)).join('、')}</div>` : ''}
      ${b.message ? `<div class="quote">💬 ${esc(b.message.ja || b.message.original)}${b.message.failed ? '<br><span class="small muted">（翻訳できなかったため原文のまま）</span>' : `<details class="small"><summary>原文（${{ en: '英語', zh: '中国語', ko: '韓国語' }[b.message.lang] ?? '外国語'}）</summary>${esc(b.message.original)}</details>`}</div>` : ''}
      <div class="btn-row">
        ${b.threadId ? `<a class="btn small" href="#/chat/${b.threadId}">💬 チャット</a>` : ''}
        ${b.status === 'confirmed' ? `<button class="btn small danger" data-cancel="${b.id}">キャンセルする</button>` : ''}
      </div>
    </div>`;
  view.innerHTML = `
    <section>
      <h2>予約</h2>
      <p class="muted small">時間枠の上限人数の範囲で、予約はすぐに確定します。お休みの日は「受付停止」で止められます。</p>
      <div class="list">${upcoming.map(card).join('') || '<p class="empty">これからの予約はありません</p>'}</div>
      ${others.length ? `<details><summary>過去・キャンセル（${others.length}）</summary><div class="list">${others.map(card).join('')}</div></details>` : ''}
    </section>`;
  view.onclick = (e) => {
    const id = e.target.closest('[data-cancel]')?.dataset.cancel;
    if (!id) return;
    const content = openSheet(`
      <h3>予約をキャンセル</h3>
      <p class="small">理由を選んでください。理由はお客様の言語（英語・中国語・韓国語）に翻訳して、マイ予約に表示されます。</p>
      <form class="form" id="cf">
        ${CANCEL_REASONS.map((r, i) => `<label class="check radio"><input type="radio" name="reason" value="${r.id}" ${i === 0 ? 'checked' : ''}/> <span>${r.ja}</span></label>`).join('')}
        <label>ひとこと（任意・日本語で）<input name="note" maxlength="300" placeholder="例：台風のため臨時休業します。申し訳ありません。" /></label>
        <button class="btn danger block" type="submit">キャンセルする</button>
      </form>`);
    content.querySelector('#cf').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const btn = ev.target.querySelector('button[type=submit]');
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = 'キャンセル中…'; // 連打で2回送らない（理由の翻訳も1回だけ）
      try { await post('biz', 'cancel', { id, reason: fd.get('reason'), note: fd.get('note') }); closeSheet(); toast('キャンセルしました'); renderBookings(view); }
      catch (er) { toast(errJa(er)); btn.disabled = false; btn.textContent = 'キャンセルする'; }
    };
  };
}

// ---------- チャット ----------

export async function renderChats(view) {
  const { items } = await get('chat', 'threads');
  view.innerHTML = `
    <section>
      <h2>チャット</h2>
      <p class="muted small">お客様のメッセージは日本語に翻訳されて届きます。日本語で返信すると、お客様の言語（英語・中国語・韓国語）に翻訳されます。</p>
      <div class="list">${items.map((th) => `
        <a class="card" href="#/chat/${th.id}"><div class="card-body">
          <h3>${esc(th.travelerName)} ${th.unread ? `<span class="dot">${th.unread}</span>` : ''}</h3>
          <div class="sub">🏪 ${esc(th.shopName)}</div><div class="sub ellipsis">${esc(th.last)}</div>
        </div></a>`).join('') || '<p class="empty">まだメッセージはありません</p>'}</div>
    </section>`;
}

export async function renderThread(view, id) {
  const { thread, messages } = await get('chat', 'thread', { id });
  document.dispatchEvent(new CustomEvent('badges-changed'));
  view.innerHTML = `
    <section class="thread">
      <a class="back" href="#/chats">← チャット一覧</a>
      <h2>${esc(thread.travelerName)} <small class="muted">（${esc(thread.shopName)}）</small></h2>
      <div class="messages">${messages.map((m) => `
        <div class="msg ${m.mine ? 'mine' : 'theirs'}">
          <div class="msg-body">${esc(m.text)}</div>
          ${!m.mine ? (m.translateFailed ? '<div class="tr-tools">⚠️ 翻訳できませんでした（原文のまま）</div>' : `<div class="tr-tools">🌐 自動翻訳 · <button class="link" data-original="${esc(m.original)}">原文を見る</button></div>`) : ''}
          <div class="msg-time">${fmt(m.createdAt)}</div>
        </div>`).join('')}</div>
      ${thread.travelerDeleted ? '<p class="notice warn">このお客様は退会しました。</p>' : `
      <form class="form compose" id="f">
        <textarea name="text" maxlength="${LIMITS.messageMaxChars}" placeholder="日本語で入力してください" required></textarea>
        <div class="row-between"><span class="muted small" id="cnt"></span><button class="btn primary" type="submit">送信</button></div>
      </form>`}
      <button class="btn small" data-block style="margin-top:12px">${thread.blocked ? 'ブロックを解除' : '🚫 このお客様をブロック'}</button>
    </section>`;
  const f = $('#f');
  if (f) {
    const cnt = () => { $('#cnt').textContent = `あと${LIMITS.messageMaxChars - f.text.value.length}文字`; };
    f.text.addEventListener('input', cnt); cnt();
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!f.text.value.trim() || f.querySelector('button').disabled) return; // 送信中は二重に送らない
      f.querySelector('button').disabled = true;
      try { const r = await post('chat', 'send', { threadId: id, text: f.text.value }); if (r.translateFailed) toast('翻訳できなかったため、日本語のまま届きます'); renderThread(view, id); }
      catch (er) { toast(errJa(er)); f.querySelector('button').disabled = false; }
    };
  }
  view.onclick = async (e) => {
    const b = e.target.closest('[data-original]');
    if (b) { b.closest('.tr-tools').insertAdjacentHTML('afterend', `<span class="original">${esc(b.dataset.original)}</span>`); b.remove(); }
    if (e.target.closest('[data-block]') && (thread.blocked || confirm('このお客様をブロックしますか？メッセージが届かなくなります。'))) {
      await post('chat', 'block', { threadId: id, blocked: !thread.blocked }); renderThread(view, id);
    }
  };
  $('.messages')?.lastElementChild?.scrollIntoView({ block: 'end' });
}

// ---------- 受付停止日 ----------

let closureShop = null;
let month = null;

export async function renderClosures(view) {
  const { items } = await get('biz', 'shops');
  if (!items.length) { view.innerHTML = '<section><p class="empty">先に店舗を登録してください</p><a class="btn primary block" href="#/shop/new">＋ 店舗を登録する</a></section>'; return; }
  if (!items.some((s) => s.id === closureShop)) closureShop = items[0].id;
  month ??= todayJST().slice(0, 7);
  const data = await get('biz', 'blocked', { shopId: closureShop });
  const stopped = new Set(data.dates);
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const today = todayJST();
  const first = `${month}-01`;
  view.innerHTML = `
    <section>
      <h2>受付停止日</h2>
      <label class="label">店舗<select id="shop">${items.map((s) => `<option value="${s.id}" ${s.id === closureShop ? 'selected' : ''}>${esc(s.name.ja || '（無題）')}</option>`).join('')}</select></label>
      <p class="muted small">日をタップすると、その日の受付を止めます（もう一度タップで再開）。定休日（${data.shop.closedDays.map((d) => '日月火水木金土'[d]).join('・') || 'なし'}）は店舗の設定で変えられます。</p>
      <div class="cal-nav"><button class="btn small" data-month="-1" ${month <= today.slice(0, 7) ? 'disabled' : ''}>‹</button><b>${y}年${m}月</b><button class="btn small" data-month="1">›</button></div>
      <div class="cal">${'日月火水木金土'.split('').map((w) => `<div class="h">${w}</div>`).join('')}${'<div></div>'.repeat(weekday(first))}
        ${Array.from({ length: days }, (_, i) => {
          const d = `${month}-${String(i + 1).padStart(2, '0')}`;
          const past = d < today;
          const closed = data.shop.closedDays.includes(weekday(d));
          return `<button data-day="${d}" class="${stopped.has(d) ? 'stop' : ''}" ${past || closed ? 'disabled' : ''} title="${data.booked[d] ? `予約${data.booked[d]}件` : ''}">${i + 1}${data.booked[d] ? '•' : ''}</button>`;
        }).join('')}</div>
      <p class="note">赤＝受付停止 ／ • ＝予約あり（停止しても、すでにある予約はキャンセルされません）</p>
      <h4>期間をまとめて止める</h4>
      <form class="form" id="range"><div class="form-row"><label>開始日<input type="date" name="from" min="${today}" required /></label><label>終了日<input type="date" name="to" min="${today}" required /></label></div>
        <button class="btn" type="submit">この期間の受付を止める</button></form>
    </section>`;
  $('#shop').onchange = (e) => { closureShop = e.target.value; renderClosures(view); };
  $('#range').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('to') < fd.get('from')) return toast('終了日は開始日より後にしてください');
    await post('biz', 'blocked', { shopId: closureShop, from: fd.get('from'), to: fd.get('to'), stop: true });
    toast('受付を止めました'); renderClosures(view);
  };
  view.onclick = async (e) => {
    const mv = e.target.closest('[data-month]')?.dataset.month;
    if (mv) { const d = new Date(Date.UTC(y, m - 1 + Number(mv), 1)); month = d.toISOString().slice(0, 7); return renderClosures(view); }
    const day = e.target.closest('[data-day]')?.dataset.day;
    if (day) { await post('biz', 'blocked', { shopId: closureShop, dates: [day], stop: !stopped.has(day) }); renderClosures(view); }
  };
}

// ---------- アカウント・規約 ----------

export function renderAccount(view, user, onLogout) {
  view.innerHTML = `
    <section>
      <h2>アカウント</h2>
      <form class="form" id="f"><label>お名前<input name="name" value="${esc(user.name)}" maxlength="60" /></label>
        <p class="muted small">${esc(user.email)}</p><button class="btn" type="submit">保存</button></form>
      <div class="section">
        <p class="small">同じアカウントで、ご家族など複数の端末からログインできます。</p>
        <a class="btn block" href="#/terms">利用規約</a><a class="btn block" href="#/privacy">プライバシーポリシー</a>
        <p class="small muted">運営への問い合わせ：<a href="mailto:${OPERATOR.email}">${OPERATOR.email}</a></p>
      </div>
      <div class="section"><button class="btn block" data-logout>ログアウト</button><button class="btn block danger" data-delete>退会する</button></div>
    </section>`;
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); if (btn.disabled) return; btn.disabled = true;
    try { await post('auth', 'profile', { name: e.target.name.value }); toast('保存しました'); } finally { btn.disabled = false; }
  };
  view.onclick = async (e) => {
    if (e.target.closest('[data-logout]')) { await post('auth', 'logout'); onLogout(); }
    if (e.target.closest('[data-delete]')) {
      const pw = prompt('退会すると元に戻せません。確認のためパスワードを入力してください。\n（店舗は非公開になります。これからの予約がある場合は、先にキャンセルしてください）');
      if (!pw) return;
      try { await post('auth', 'delete', { password: pw }); toast('退会しました'); onLogout(); }
      catch (er) { toast(errJa(er)); if (er.code === 'has_future_bookings') location.hash = '#/'; }
    }
  };
}

export const renderTerms = (view) => { view.innerHTML = `<section><a class="back" href="javascript:history.back()">← 戻る</a>${legalHtml(TERMS_JA, esc)}</section>`; };
export const renderPrivacy = (view) => { view.innerHTML = `<section><a class="back" href="javascript:history.back()">← 戻る</a>${legalHtml(PRIVACY_JA, esc)}</section>`; };
