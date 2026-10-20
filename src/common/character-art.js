// ============================================================
//  キャラクターの絵（SVG）。旅のカエル「ケロ」（仮）。
//  カエル＝「無事カエル」で、旅の縁起物。テーマカラーは緑。
//  ちびキャラ体型（大きな頭・小さな体）、キラキラの目、ほっぺ、ω口。
//  - AVATAR：顔まわり（吹き出し横・右下のボタン用、小さく表示）
//  - FULL：全身（最初の画面で大きく表示）
//  画像ファイルに差し替えるときは、例えば '<img src="/chara.png" alt="">' の文字列にする。
// ============================================================

const C = {
  body: '#7fd98d', // パステルの若草色
  bodyLight: '#a6e8b0',
  belly: '#fbfdf1',
  line: '#3f8a52', // やわらかい緑の線
  leaf: '#3fa560',
  leafVein: '#9fe0ab',
  bud: '#ffa8c5', // 葉っぱの上の花のつぼみ
  cheek: '#ff9fb2',
  eye: '#2b2a33',
  mouth: '#3f8a52',
  tongue: '#ff8a9a',
  scarf: '#fff4c7',
  scarfLine: '#e8d58a',
};

/** キラキラの目（出っぱり＋大きな黒目＋ハイライト2つ） */
const EYE = (x, y, r) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="${C.body}" stroke="${C.line}" stroke-width="${r * 0.12}"/>
  <circle cx="${x}" cy="${y + r * 0.05}" r="${r * 0.78}" fill="#fff"/>
  <circle cx="${x}" cy="${y + r * 0.12}" r="${r * 0.6}" fill="${C.eye}"/>
  <circle cx="${x + r * 0.2}" cy="${y - r * 0.12}" r="${r * 0.22}" fill="#fff"/>
  <circle cx="${x - r * 0.22}" cy="${y + r * 0.35}" r="${r * 0.1}" fill="#fff"/>`;

/** 蓮の葉の帽子＋花のつぼみ */
const LEAF = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s}) rotate(-12)">
    <path d="M-16 4q2-14 16-14t16 14q-8-4-16-4t-16 4z" fill="${C.leaf}" stroke="${C.line}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M0-9v11M-8-5l5 6M8-5l-5 6" stroke="${C.leafVein}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M0-10q-1-6 1-9" stroke="${C.line}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M1-19q-5-5 0-10q5 5 0 10z" fill="${C.bud}" stroke="#e57fa0" stroke-width="1"/>
  </g>`;

/** 顔まわり（64×64） */
export const AVATAR = `
<svg viewBox="0 0 64 64" aria-hidden="true">
  <ellipse cx="32" cy="40" rx="29" ry="21" fill="${C.body}" stroke="${C.line}" stroke-width="1.6"/>
  ${EYE(18, 23, 10.5)}
  ${EYE(46, 23, 10.5)}
  ${LEAF(32, 15, 0.55)}
  <ellipse cx="32" cy="50" rx="16" ry="9" fill="${C.belly}" opacity=".9"/>
  <ellipse cx="11" cy="42" rx="5.5" ry="3.4" fill="${C.cheek}" opacity=".85"/>
  <ellipse cx="53" cy="42" rx="5.5" ry="3.4" fill="${C.cheek}" opacity=".85"/>
  <path d="M26 40q3 4 6 0q3 4 6 0" stroke="${C.mouth}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SHURIKEN = (x, y, r, cls = '') => `
  <g transform="translate(${x} ${y})"><g class="${cls}">
    <path d="M0 ${-r}L${r * 0.28} ${-r * 0.28}L${r} 0L${r * 0.28} ${r * 0.28}L0 ${r}L${-r * 0.28} ${r * 0.28}L${-r} 0L${-r * 0.28} ${-r * 0.28}Z" fill="#cfd6e6" stroke="#4a5470" stroke-width="${r * 0.1}" stroke-linejoin="round"/>
    <circle r="${r * 0.22}" fill="#4a5470"/>
  </g></g>`;

/** 持ち物ごとの腕 */
const HANDS = {
  phone: `<!-- スマホを持つ腕 -->
  <path d="M110 132q14 2 24-6" stroke="${C.body}" stroke-width="12" fill="none" stroke-linecap="round"/>
  <g transform="translate(10 14) rotate(-8 132 106)">
    <rect x="122" y="90" width="20" height="32" rx="5" fill="#33405c" stroke="${C.line}" stroke-width="1.8"/>
    <rect x="125" y="94" width="14" height="23" rx="2" fill="#e6f7e9"/>
    <path d="M129 103q0-4 3-4t3 4q0 2-3 6q-3-4-3-6z" fill="#ff6b6b"/>
  </g>
  <circle cx="137" cy="128" r="8" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>`,
  lantern: `<!-- ちょうちんを持つ腕 -->
  <path d="M110 132q14 2 22-10" stroke="${C.body}" stroke-width="12" fill="none" stroke-linecap="round"/>
  <g transform="translate(118 64) scale(.42)">${lantern('', { id: 'kero' }).replace(/<\/?svg[^>]*>/g, '')}</g>
  <circle cx="134" cy="121" r="8" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>`,
  shuriken: `<!-- 手裏剣を持つ腕 -->
  <path d="M110 132q14 2 22-10" stroke="${C.body}" stroke-width="12" fill="none" stroke-linecap="round"/>
  ${SHURIKEN(140, 106, 13, 'spin')}
  <circle cx="134" cy="121" r="8" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>`,
};

/** 忍者のはちまき（額当てつき・結び目の布が風になびく） */
const NINJA_BAND = `
  <path d="M30 70q-16-2-26-14q12 4 22 2z" fill="#2b3a67"/><path d="M30 74q-14 4-26 0q12-2 22-6z" fill="#34477d"/>
  <path d="M24 60Q80 76 136 60L136 72Q80 88 24 72Z" fill="#2b3a67" stroke="#1c2648" stroke-width="1.6" stroke-linejoin="round"/>
  <rect x="70" y="64" width="20" height="13" rx="3" fill="#cfd6e6" stroke="#4a5470" stroke-width="1.4"/>
  <path d="M80 67q-4 3 0 7q4-4 0-7z" fill="#4a5470"/>`;

/** 忍者の首巻き */
const NINJA_SCARF = `<!-- 忍者の首巻き -->
  <path d="M48 110q32 14 64 0l-1 10q-31 10-62 0z" fill="#2b3a67" stroke="#1c2648" stroke-width="1.4"/>
  <path d="M100 118l10 16l-8 1z" fill="#34477d" stroke="#1c2648" stroke-width="1.2" stroke-linejoin="round"/>`;

/** 全身（160×180）：ちび体型。片手をふって、もう片方の手に hand（phone | lantern | shuriken）。ninja で忍者の格好 */
function frogFull({ hand = 'phone', ninja = false } = {}) {
  return `
<svg viewBox="0 0 160 180" aria-hidden="true">
  <!-- 足 -->
  <ellipse cx="60" cy="166" rx="15" ry="8" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>
  <ellipse cx="100" cy="166" rx="15" ry="8" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>
  <!-- 小さな体 -->
  <ellipse cx="80" cy="136" rx="34" ry="30" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>
  <ellipse cx="80" cy="142" rx="22" ry="21" fill="${C.belly}"/>
  <!-- ちいさなポシェット -->
  <path d="M58 118q18 20 40 34" stroke="#d9a35b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="92" y="146" width="18" height="15" rx="6" fill="#f2c27a" stroke="${C.line}" stroke-width="1.6"/>
  <circle cx="101" cy="153" r="1.8" fill="${C.line}"/>
  <!-- 手をふる腕（短め・まるい手） -->
  <path d="M50 128q-12-4-16-18" stroke="${C.body}" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M50 128q-12-4-16-18" stroke="${C.line}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>
  <circle cx="33" cy="106" r="8.5" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>
  <path d="M20 94q-3 4 0 8M15 97q-2 3 0 6" stroke="${C.line}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>
  ${HANDS[hand]}
  <!-- 大きな頭 -->
  <ellipse cx="80" cy="76" rx="58" ry="42" fill="${C.body}" stroke="${C.line}" stroke-width="2"/>
  <ellipse cx="80" cy="66" rx="40" ry="18" fill="${C.bodyLight}" opacity=".5"/>
  ${ninja ? NINJA_BAND : ''}
  ${EYE(52, 42, 22)}
  ${EYE(108, 42, 22)}
  ${LEAF(80, 30, 1.05)}
  <!-- ほっぺと口 -->
  <ellipse cx="38" cy="86" rx="11" ry="6.5" fill="${C.cheek}" opacity=".85"/>
  <ellipse cx="122" cy="86" rx="11" ry="6.5" fill="${C.cheek}" opacity=".85"/>
  <path d="M68 86q6 7 12 0q6 7 12 0" stroke="${C.mouth}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M75 90q5 6 10 0" fill="${C.tongue}"/>
  ${ninja ? NINJA_SCARF : `  <!-- ちいさなスカーフ -->
  <path d="M50 112q30 12 60 0l-1 7q-29 9-58 0z" fill="${C.scarf}" stroke="${C.scarfLine}" stroke-width="1.4"/>
  <circle cx="64" cy="117" r="1.6" fill="${C.leaf}"/><circle cx="80" cy="119" r="1.6" fill="${C.leaf}"/><circle cx="96" cy="117" r="1.6" fill="${C.leaf}"/>`}
</svg>`;
}


export const FULL = frogFull({ hand: 'phone' });
/** ケロ（忍者）：はちまきと首巻き、手に手裏剣（回る） */
export const FULL_NINJA = frogFull({ hand: 'shuriken', ninja: true });

// ============================================================
//  もう一つの案：湯呑みの「ゆのみん」（仮）。抹茶色の湯呑みから湯気、お茶には茶柱（縁起物）。
// ============================================================

const Y = {
  cup: '#6cc483', // 抹茶色の釉薬
  cupLight: '#9fdcae',
  band: '#3f9d5e',
  line: '#3a7d4c',
  tea: '#b9d96a', // お茶の水面
  teaDark: '#94bf45',
  stalk: '#c79a4b', // 茶柱
  steam: '#cfe9d6',
  cheek: '#ff9fb2',
  eye: '#2b2a33',
  foot: '#e9dcc0',
};

const YEYE = (x, y, r) => `
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="${Y.eye}"/>
  <circle cx="${x + r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff"/>
  <circle cx="${x - r * 0.3}" cy="${y + r * 0.4}" r="${r * 0.16}" fill="#fff"/>`;

/** 顔まわり（64×64） */
export const AVATAR_YUNOMI = `
<svg viewBox="0 0 64 64" aria-hidden="true">
  <g fill="${Y.steam}"><circle cx="24" cy="9" r="4"/><circle cx="28" cy="4" r="3.5"/><circle cx="40" cy="8" r="3.5"/><circle cx="43" cy="3" r="3"/></g>
  <path d="M8 19q-3 24 7 38q3 4 9 4h16q6 0 9-4q10-14 7-38z" fill="${Y.cup}" stroke="${Y.line}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M9 20q0 6 1 8q2 2 3-1q1 4 4 3q2-1 2-4q2 3 4 1q1 3 4 2q2-1 2-4q2 3 4 1q2 4 4 2q1-3 2-4q2 3 4 1q2 2 4 0q1-4 0-6z" fill="${Y.band}" opacity=".75"/>
  <ellipse cx="32" cy="19" rx="24" ry="5" fill="${Y.tea}" stroke="${Y.line}" stroke-width="1.6"/>
  <path d="M35 21l1.5-8" stroke="${Y.stalk}" stroke-width="2" stroke-linecap="round"/>
  ${YEYE(23, 39, 4.6)}
  ${YEYE(41, 39, 4.6)}
  <ellipse cx="15" cy="46" rx="4.5" ry="2.8" fill="${Y.cheek}" opacity=".85"/>
  <ellipse cx="49" cy="46" rx="4.5" ry="2.8" fill="${Y.cheek}" opacity=".85"/>
  <path d="M26 46q3 4 6 0q3 4 6 0" stroke="${Y.line}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** 全身（160×180）：ずんぐりした湯呑み。ふわふわの湯気、茶柱、片手をふって、片手にスマホ */
export const FULL_YUNOMI = `
<svg viewBox="0 0 160 180" aria-hidden="true">
  <!-- ふわふわの湯気 -->
  <g fill="${Y.steam}" opacity=".95">
    <circle cx="62" cy="34" r="7"/><circle cx="70" cy="26" r="8"/><circle cx="66" cy="16" r="6"/>
    <circle cx="96" cy="30" r="6"/><circle cx="102" cy="21" r="7"/><circle cx="98" cy="12" r="5"/>
  </g>
  <!-- 足 -->
  <ellipse cx="62" cy="168" rx="13" ry="7" fill="${Y.cup}" stroke="${Y.line}" stroke-width="2"/>
  <ellipse cx="98" cy="168" rx="13" ry="7" fill="${Y.cup}" stroke="${Y.line}" stroke-width="2"/>
  <!-- 手をふる腕 -->
  <path d="M30 108q-12-6-14-22" stroke="${Y.cup}" stroke-width="11" fill="none" stroke-linecap="round"/>
  <circle cx="15" cy="82" r="8" fill="${Y.cup}" stroke="${Y.line}" stroke-width="2"/>
  <path d="M4 70q-3 4 0 8M-1 73q-2 3 0 6" stroke="${Y.line}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>
  <!-- スマホを持つ腕 -->
  <path d="M130 112q14 2 18-10" stroke="${Y.cup}" stroke-width="11" fill="none" stroke-linecap="round"/>
  <g transform="rotate(-8 148 88)">
    <rect x="138" y="70" width="20" height="32" rx="5" fill="#33405c" stroke="${Y.line}" stroke-width="1.8"/>
    <rect x="141" y="74" width="14" height="23" rx="2" fill="#e6f7e9"/>
    <path d="M145 83q0-4 3-4t3 4q0 2-3 6q-3-4-3-6z" fill="#ff6b6b"/>
  </g>
  <circle cx="147" cy="102" r="8" fill="${Y.cup}" stroke="${Y.line}" stroke-width="2"/>
  <!-- 高台 -->
  <path d="M58 152h44l-3 10H61z" fill="${Y.foot}" stroke="${Y.line}" stroke-width="2" stroke-linejoin="round"/>
  <!-- ずんぐりした湯呑みの体 -->
  <path d="M26 52q-6 52 16 92q6 10 20 10h36q14 0 20-10q22-40 16-92z" fill="${Y.cup}" stroke="${Y.line}" stroke-width="2.2" stroke-linejoin="round"/>
  <!-- 縁の釉薬のたれ -->
  <path d="M27 54q-1 12 1 18q4 4 7-2q2 10 8 8q4-2 4-10q4 8 9 2q3 8 9 6q4-2 4-10q5 8 10 2q4 10 10 4q2-6 3-8q4 8 9 2q4 6 8 0q2-6 1-14z" fill="${Y.band}" opacity=".75"/>
  <path d="M38 76q-2 34 12 60" stroke="${Y.cupLight}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>
  <!-- お茶の水面と茶柱 -->
  <ellipse cx="80" cy="52" rx="54" ry="11" fill="${Y.tea}" stroke="${Y.line}" stroke-width="2.2"/>
  <ellipse cx="80" cy="54" rx="42" ry="6" fill="${Y.teaDark}" opacity=".45"/>
  <path d="M88 56l3-16" stroke="${Y.stalk}" stroke-width="3.5" stroke-linecap="round"/>
  <!-- 顔（キラキラの目） -->
  <ellipse cx="60" cy="104" rx="10" ry="11" fill="${Y.eye}"/>
  <ellipse cx="100" cy="104" rx="10" ry="11" fill="${Y.eye}"/>
  <circle cx="63" cy="100" r="3.6" fill="#fff"/><circle cx="103" cy="100" r="3.6" fill="#fff"/>
  <circle cx="57" cy="109" r="1.6" fill="#fff"/><circle cx="97" cy="109" r="1.6" fill="#fff"/>
  <ellipse cx="44" cy="120" rx="9" ry="5.5" fill="${Y.cheek}" opacity=".85"/>
  <ellipse cx="116" cy="120" rx="9" ry="5.5" fill="${Y.cheek}" opacity=".85"/>
  <path d="M70 118q5 6 10 0q5 6 10 0" stroke="${Y.line}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M76 121q4 5 8 0" fill="#ff8a9a"/>
</svg>`;

// ============================================================
//  ITSUMO（夜の街）用：ちょうちん
//  lantern(char, lit)：文字入りの提灯。lit=false で消えた状態（トップの演出で灯す）
// ============================================================
export function lantern(char = '', { id = 'l', color = '#e8452f' } = {}) {
  return `
<svg viewBox="0 0 80 120" class="lantern-svg" aria-hidden="true">
  <defs>
    <radialGradient id="g-${id}" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#ffe7a8"/><stop offset="45%" stop-color="#ffb347"/><stop offset="100%" stop-color="${color}"/>
    </radialGradient>
  </defs>
  <line x1="40" y1="0" x2="40" y2="14" stroke="#3a2a1a" stroke-width="2"/>
  <rect x="24" y="12" width="32" height="9" rx="2" fill="#2a1d14"/>
  <ellipse class="lantern-body" cx="40" cy="62" rx="32" ry="42" fill="url(#g-${id})"/>
  ${[30, 42, 54, 66, 78, 90].map((y) => `<path d="M${40 - Math.sqrt(1 - ((y - 62) / 42) ** 2) * 32} ${y}h${Math.sqrt(1 - ((y - 62) / 42) ** 2) * 64}" stroke="#7a2a12" stroke-opacity=".35" stroke-width="1.2"/>`).join('')}
  <rect x="24" y="101" width="32" height="9" rx="2" fill="#2a1d14"/>
  <path d="M34 110v8M40 110v10M46 110v8" stroke="#2a1d14" stroke-width="2" stroke-linecap="round"/>
  ${char ? `<text x="40" y="74" text-anchor="middle" font-size="34" font-weight="700" fill="#2a1208" font-family="'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',serif">${char}</text>` : ''}
</svg>`;
}

/** ケロ（夜の街）：スマホの代わりに、ちょうちんを持つ */
export const FULL_LANTERN = frogFull({ hand: 'lantern' });

/** 顔まわり（忍者）：はちまきつき */
export const AVATAR_NINJA = AVATAR.replace(`${EYE(18, 23, 10.5)}`, `
  <path d="M8 36q-7 1-8-6q4 3 8 2z" fill="#2b3a67"/>
  <path d="M5 30Q32 40 59 30L59 36Q32 46 5 36Z" fill="#2b3a67" stroke="#1c2648" stroke-width="1"/>
  <rect x="27" y="32" width="10" height="7" rx="1.5" fill="#cfd6e6" stroke="#4a5470" stroke-width=".8"/>
  ${EYE(18, 23, 10.5)}`);

export { SHURIKEN };

// ============================================================
//  日本らしさ：夜の富士山・お寿司（回転寿司のお皿）
// ============================================================

/** 夜の富士山（横長・下に置く背景用）。fit = slice（はみ出して埋める）| meet（全体を見せる） */
export const fuji = (fit = 'slice') => `
<svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMax ${fit}" class="fuji-svg" aria-hidden="true">
  <defs>
    <linearGradient id="fj-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4785"/><stop offset="1" stop-color="#161c3c"/></linearGradient>
    <linearGradient id="fj-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d3f2"/></linearGradient>
  </defs>
  <path d="M0 140L0 118Q60 104 110 112L170 46Q200 30 230 46L290 112Q340 104 400 116L400 140Z" fill="url(#fj-m)"/>
  <path d="M170 46Q200 30 230 46L250 68Q240 62 232 70Q222 60 212 72Q202 62 192 72Q182 62 172 70Q160 62 150 68Z" fill="url(#fj-s)"/>
  <path d="M0 140L0 128Q100 116 200 126Q300 116 400 128L400 140Z" fill="#10152e"/>
</svg>`;
export const FUJI = fuji('slice');

/** お月さま */
export const MOON = `<svg viewBox="0 0 40 40" class="moon-svg" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="#fff4cf"/><circle cx="14" cy="16" r="3" fill="#f1e2b0"/><circle cx="25" cy="25" r="2.2" fill="#f1e2b0"/></svg>`;

const NETA = {
  maguro: { fish: '#e8475a', line: '#ff8090' },
  salmon: { fish: '#ff9a62', line: '#ffe2cf' },
  tamago: { fish: '#ffd84a', line: '#f2b92a', nori: true },
  ebi: { fish: '#ff7b54', line: '#fff0e6', tail: true },
};

/** お寿司1皿（回転寿司のお皿つき）。kind = maguro | salmon | tamago | ebi | ikura */
export function sushi(kind = 'maguro', plate = '#e0e6f5') {
  const n = NETA[kind];
  const top = kind === 'ikura'
    ? `<rect x="18" y="12" width="28" height="18" rx="4" fill="#1f2d24"/><g fill="#ff7a1a" stroke="#c94f00" stroke-width=".6">${[[23, 12], [29, 10], [35, 12], [41, 10], [26, 15], [38, 15], [32, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join('')}</g>`
    : `<rect x="16" y="17" width="32" height="13" rx="6" fill="#fffaf0" stroke="#e8dcc6" stroke-width="1"/>
       <path d="M12 19q20-14 40 0q-2 5-20 4q-18 1-20-4z" fill="${n.fish}"/>
       <path d="M20 15l5 5M29 13l4 6M38 14l3 5" stroke="${n.line}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
       ${n.nori ? '<rect x="28" y="13" width="8" height="17" fill="#1f2d24"/>' : ''}
       ${n.tail ? '<path d="M52 18l8-6l-2 9z" fill="#ff5a3a"/>' : ''}`;
  return `<svg viewBox="0 0 64 40" class="sushi-svg" aria-hidden="true">
  <ellipse cx="32" cy="32" rx="30" ry="7" fill="${plate}" stroke="#9aa6c8" stroke-width="1.2"/>
  <ellipse cx="32" cy="31" rx="20" ry="4" fill="none" stroke="#9aa6c8" stroke-width="1" opacity=".7"/>
  ${top}
</svg>`;
}
