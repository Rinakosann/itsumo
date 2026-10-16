// 翻訳チャット：英語で書くと事業者には日本語で届く。返信は英語で表示（原文も見られる）
import { esc, toast } from '../../common/ui.js';
import { get, post } from '../../common/api.js';
import { t, errText } from '../strings.js';
import { LIMITS } from '../../../shared/constants.js';

const fmt = (iso) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }).format(new Date(iso));

export async function renderList(view) {
  const { items } = await get('chat', 'threads');
  view.innerHTML = `
    <section>
      <h2>${t('chatsTitle')}</h2>
      <div class="list">${items.map((th) => `
        <a class="card" href="#/chat/${th.id}"><div class="card-body">
          <h3>${esc(th.shopName)} ${th.unread ? `<span class="dot">${th.unread}</span>` : ''}</h3>
          <div class="sub ellipsis">${esc(th.last)}</div>
        </div></a>`).join('') || `<p class="empty">${t('noChats')}</p>`}</div>
    </section>`;
}

/** id = スレッド、または 'new'（?shop= で最初のメッセージを送る） */
export async function renderThread(view, id, query) {
  let thread = null;
  let messages = [];
  if (id !== 'new') {
    try { ({ thread, messages } = await get('chat', 'thread', { id })); } catch (e) { view.innerHTML = `<p class="empty">${esc(errText(e))}</p>`; return; }
    document.dispatchEvent(new CustomEvent('badges-changed'));
  } else {
    const shop = await get('shops', 'get', { id: query.get('shop') }).then((r) => r.item).catch(() => null);
    if (!shop) { view.innerHTML = `<p class="empty">${t('err_not_found')}</p>`; return; }
    const existing = (await get('chat', 'threads')).items.find((x) => x.shopId === shop.id);
    if (existing) { location.replace(`#/chat/${existing.id}`); return; }
    thread = { shopName: shop.name.text, blocked: false };
  }
  const draftKey = `tlm.chatdraft.${id === 'new' ? query.get('shop') : id}`;
  view.innerHTML = `
    <section class="thread">
      <a class="back" href="#/chats">← ${t('chatsTitle')}</a>
      <h2>${esc(thread.shopName)}</h2>
      <div class="messages">${messages.map((m) => `
        <div class="msg ${m.mine ? 'mine' : 'theirs'}">
          <div class="msg-body">${esc(m.text)}</div>
          ${!m.mine ? (m.translateFailed ? `<div class="tr-tools">⚠️ ${t('notTranslated')}</div>` : `<div class="tr-tools">🌐 ${t('translated')} · <button class="link" data-original="${esc(m.original)}">${t('showOriginal')}</button></div>`) : ''}
          <div class="msg-time">${fmt(m.createdAt)}</div>
        </div>`).join('')}</div>
      ${thread.blocked ? `<p class="notice warn">${t('blocked')}</p>` : `
      <form class="form compose" id="f">
        <textarea name="text" maxlength="${LIMITS.messageMaxChars}" placeholder="${esc(t('writeMessage'))}" required>${esc(sessionStorage.getItem(draftKey) ?? '')}</textarea>
        <div class="row-between"><span class="muted small" id="cnt"></span><button class="btn primary" type="submit">${t('send')}</button></div>
      </form>`}
    </section>`;
  const f = view.querySelector('#f');
  if (f) {
    const cnt = () => { view.querySelector('#cnt').textContent = t('charsLeft', { n: LIMITS.messageMaxChars - f.text.value.length }); sessionStorage.setItem(draftKey, f.text.value); };
    f.text.addEventListener('input', cnt); cnt();
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!f.text.value.trim()) return;
      f.querySelector('button').disabled = true;
      try {
        const res = await post('chat', 'send', id === 'new' ? { shopId: query.get('shop'), text: f.text.value } : { threadId: id, text: f.text.value });
        sessionStorage.removeItem(draftKey);
        if (id === 'new') location.replace(`#/chat/${res.threadId}`); else renderThread(view, id, query);
      } catch (err) { toast(errText(err)); f.querySelector('button').disabled = false; }
    };
  }
  view.onclick = (e) => {
    const b = e.target.closest('[data-original]');
    if (b) { b.closest('.tr-tools').insertAdjacentHTML('afterend', `<span class="original">🇯🇵 ${esc(b.dataset.original)}</span>`); b.remove(); }
  };
  view.querySelector('.messages')?.lastElementChild?.scrollIntoView({ block: 'end' });
}
