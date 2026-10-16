// トップページ：旅行者か事業者かの2つに分岐するだけ。
import '../common/style.css';
import { FULL } from '../common/character-art.js';

document.getElementById('view').innerHTML = `
  <section class="top">
    <div class="char-hero">${FULL}</div>
    <h1>Tabi Local</h1>
    <p class="lead">Local Japan, in English.<br>地域の小さなお店と、海外の旅行者をつなぎます。</p>
    <div class="split">
      <a class="traveler" href="/traveler">
        <span class="emo">🧳</span>
        <span><b>I'm a traveler</b><small>Find local shops, chat in English and book</small></span>
      </a>
      <a class="business" href="/business">
        <span class="emo">🏪</span>
        <span><b>お店の方（事業者）</b><small>日本語だけで店舗を登録し、海外のお客様の予約を受ける</small></span>
      </a>
    </div>
    <p class="footer-links">
      <a href="/traveler#/terms">Terms</a> · <a href="/traveler#/privacy">Privacy</a> ·
      <a href="/business#/terms">利用規約</a> · <a href="/business#/privacy">プライバシーポリシー</a>
    </p>
  </section>`;
