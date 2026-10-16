// 画面共通の部品：エスケープ、トースト、シート（モーダル）、端末への保存。
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** 画面に出す文字は必ずこれを通す（スクリプト埋め込み対策） */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function toast(msg) {
  let el = $('#toast');
  if (!el) {
    el = Object.assign(document.createElement('div'), { id: 'toast', className: 'toast' });
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 3500);
}

export function openSheet(html) {
  let sheet = $('#sheet');
  if (!sheet) {
    sheet = Object.assign(document.createElement('div'), { id: 'sheet', className: 'sheet' });
    sheet.innerHTML = '<div class="sheet-backdrop" data-close-sheet></div><div class="sheet-panel" role="dialog" aria-modal="true"><button class="sheet-close" data-close-sheet aria-label="Close">✕</button><div class="sheet-content"></div></div>';
    document.body.append(sheet);
    sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close-sheet]')) closeSheet(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  }
  $('.sheet-content', sheet).innerHTML = html;
  sheet.hidden = false;
  return $('.sheet-content', sheet);
}

export function closeSheet() {
  const s = $('#sheet');
  if (s) s.hidden = true;
}

export function storage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function store(key, value) {
  try { if (value === undefined) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* 保存できない環境 */ }
}

/** 予約・チャットの途中でログインを求めたとき、ログイン後に戻る場所 */
export function setReturnTo(hash) { try { sessionStorage.setItem('returnTo', hash); } catch { /* ignore */ } }
export function takeReturnTo(fallback) {
  try { const v = sessionStorage.getItem('returnTo'); sessionStorage.removeItem('returnTo'); return v || fallback; } catch { return fallback; }
}
