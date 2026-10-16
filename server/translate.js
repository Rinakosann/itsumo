// ============================================================
//  翻訳（日本語 ⇔ 英語）。プロバイダを差し替えられる。
//  TRANSLATION_PROVIDER = mymemory（無料の機械翻訳・当面）| claude（AI翻訳・ANTHROPIC_API_KEY が必要）
//  失敗したら null を返す → 画面では原文を出し「翻訳できませんでした」と示す。
// ============================================================
import Anthropic from '@anthropic-ai/sdk';

const NAMES = { ja: 'Japanese', en: 'English' };

async function mymemory(text, from, to) {
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}${email}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (Number(data.responseStatus) !== 200 || !out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error(data.responseDetails || 'failed');
  return out;
}

let client;
async function claude(text, from, to) {
  client ??= new Anthropic();
  const res = await client.beta.messages.create({
    model: process.env.AI_MODEL || 'claude-opus-5-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: `Translate the user's text from ${NAMES[from]} to ${NAMES[to]} for a booking app between foreign travelers and small Japanese shops. Keep it natural and polite. Keep names, numbers, dates, times and prices exactly. Output only the translation.`,
    messages: [{ role: 'user', content: text }],
  });
  if (res.stop_reason === 'refusal') throw new Error('refused');
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

// 用語集：機械翻訳で崩れやすい語（日本語 → 英語の固定訳）。誤訳を見つけたらここに足す
const GLOSSARY = [
  ['熱燗', 'hot sake'], ['冷酒', 'cold sake'], ['日本酒', 'sake'], ['焼酎', 'shochu'], ['お通し', 'otoshi (small starter)'],
  ['常連さん', 'regulars'], ['常連', 'regulars'], ['一見さん', 'first-time guests'], ['おでん', 'oden'], ['大根', 'daikon radish'],
  ['のれん', 'noren curtain'], ['暖簾', 'noren curtain'], ['座敷', 'tatami seating'], ['抹茶', 'matcha'], ['女将', 'okami (proprietress)'],
  ['大将', 'the owner-chef'], ['おばんざい', 'obanzai (Kyoto home cooking)'], ['居酒屋', 'izakaya'], ['串カツ', 'kushikatsu'], ['焼き鳥', 'yakitori'],
];
const applyGlossary = (text) => GLOSSARY.reduce((t, [ja, en]) => t.replaceAll(ja, ` ${en} `), text);

/** 失敗したら null */
export async function translate(text, from, to) {
  const src = String(text ?? '').trim();
  if (!src) return '';
  if (from === to) return src;
  const provider = process.env.TRANSLATION_PROVIDER || 'mymemory';
  try {
    // MyMemory は1回500文字までなので、長い文は段落ごとに分けて訳す
    if (provider === 'claude') return await claude(src, from, to);
    const input = from === 'ja' && to === 'en' ? applyGlossary(src) : src;
    const parts = input.length > 450 ? input.split(/(?<=[。．！？\n])/).reduce((acc, s) => {
      if (!acc.length || (acc.at(-1) + s).length > 450) acc.push(s); else acc[acc.length - 1] += s;
      return acc;
    }, []) : [input];
    const out = [];
    for (const p of parts) out.push(p.trim() ? await mymemory(p.trim(), from, to) : p);
    return out.join(' ').trim();
  } catch (e) {
    console.error('translate failed', e.message);
    return null;
  }
}

/** 日本語 → { ja, en }（en が null なら翻訳失敗） */
export async function jaToEn(ja) {
  return { ja, en: ja ? await translate(ja, 'ja', 'en') : '' };
}
