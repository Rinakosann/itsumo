// トップページ：夜の富士山を背に、ちょうちん「い・つ・も・の」が1つずつ灯り、名前とコピーが浮かび上がる。
// 下では回転寿司が流れ、最後に忍者のケロが手裏剣を投げて登場する。
// そのあと、旅行者／お店の2つの入口だけを出す。タップで演出を飛ばせる（動きを減らす設定の人には最初から点灯）。
import '../common/style.css';
import { lantern, FULL_NINJA, FUJI, MOON, SHURIKEN, sushi } from '../common/character-art.js';

const PLATES = ['maguro', 'salmon', 'tamago', 'ikura', 'ebi', 'maguro', 'salmon', 'tamago'];
const plates = PLATES.map((k, i) => `<span class="plate">${sushi(k, i % 2 ? '#f2d7a6' : '#e0e6f5')}</span>`).join('');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const view = document.getElementById('view');

view.innerHTML = `
  <section class="night-top ${reduce ? 'lit-all' : ''}" id="top">
    <div class="stars" aria-hidden="true"></div>
    <div class="moon" aria-hidden="true">${MOON}</div>
    <div class="fuji" aria-hidden="true">${FUJI}</div>
    <div class="lanterns" aria-hidden="true">
      ${['い', 'つ', 'も', 'の'].map((c, i) => `<div class="lantern l${i}" style="--d:${0.5 + i * 0.55}s">${lantern(c, { id: `t${i}` })}</div>`).join('')}
    </div>
    <h1 class="logo"><span>ITSUMO</span></h1>
    <p class="copy">地元の「いつもの」に、まざろう。</p>
    <p class="copy-en">Join the locals' usual.</p>
    <div class="entrances">
      <a class="entrance traveler" href="/traveler">
        <span class="emo">🧳</span>
        <span><b>I'm a traveler</b><small>Find the locals' favorite little shops, chat in English and book</small></span>
      </a>
      <a class="entrance business" href="/business">
        <span class="emo">🏮</span>
        <span><b>お店の方</b><small>日本語だけで、海外のお客様を迎えられます</small></span>
      </a>
    </div>
    <div class="ninja-kero" title="Kero">${FULL_NINJA}</div>
    <div class="flying-shuriken" aria-hidden="true"><svg viewBox="-16 -16 32 32">${SHURIKEN(0, 0, 14)}</svg></div>
    <div class="kaiten" aria-hidden="true"><div class="belt">${plates}${plates}</div></div>
    <p class="footer-links">
      <a href="/traveler#/terms">Terms</a> · <a href="/traveler#/privacy">Privacy</a> ·
      <a href="/business#/terms">利用規約</a> · <a href="/business#/privacy">プライバシーポリシー</a>
    </p>
  </section>`;

// タップで演出を飛ばす
const top = document.getElementById('top');
top.addEventListener('click', (e) => { if (!e.target.closest('a')) top.classList.add('lit-all'); }, { once: true });
