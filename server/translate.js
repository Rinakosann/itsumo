// ============================================================
//  翻訳（日本語 ⇔ 英語・中国語（簡体字）・韓国語）。プロバイダを差し替えられる。
//  TRANSLATION_PROVIDER = gemini（AI翻訳・GEMINI_API_KEY が必要）| mymemory（無料の機械翻訳）| claude（ANTHROPIC_API_KEY が必要）
//  GEMINI_API_KEY があれば gemini を優先（TRANSLATION_PROVIDER が claude のときだけ claude）。キーがなければ mymemory。
//  AIの翻訳が失敗したら（無料枠の上限など）、mymemory で訳し直す。
//  それでも失敗したら null を返す → 画面では原文を出し「翻訳できませんでした」と示す。
// ============================================================
import Anthropic from '@anthropic-ai/sdk';
import { LANGS, TR_LANGS } from '../shared/constants.js';

const NAMES = { ja: 'Japanese', en: 'English', zh: 'Simplified Chinese', ko: 'Korean' };
const MM = { ja: 'ja', ...Object.fromEntries(LANGS.map((l) => [l.id, l.mm])) };

async function mymemory(text, from, to) {
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${MM[from] ?? from}|${MM[to] ?? to}${email}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (Number(data.responseStatus) !== 200 || !out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error(data.responseDetails || 'failed');
  return out;
}

// ---------- Gemini（Google AI Studio の API キー）----------
// モデルは GEMINI_MODEL で変えられる
const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

async function geminiCall(system, user) {
  const res = await fetch(GEMINI_URL(process.env.GEMINI_MODEL || 'gemini-2.5-flash'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`gemini HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error(`gemini empty (${data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? 'unknown'})`);
  return JSON.parse(text);
}

const glossaryText = () => GLOSSARY.map(([ja, en]) => `${ja} = ${en}`).join('\n');
const SYSTEM = (extra) => `You translate text for ITSUMO, a booking app between foreign travelers and small local shops in Japan.
Translate naturally and politely, as a friendly local would say it. Keep names, numbers, dates, times and prices exactly.
For Japanese food and culture words, use this glossary (keep the Japanese word in romaji with a short explanation when helpful):
${glossaryText()}
${extra}`;

/** 1つの文を from → to に訳す */
async function gemini(text, from, to) {
  const out = await geminiCall(
    SYSTEM(`Translate from ${NAMES[from]} to ${NAMES[to]}. Reply as JSON: {"t": "<translation>"}`),
    text,
  );
  if (typeof out?.t !== 'string' || !out.t.trim()) throw new Error('gemini bad json');
  return out.t.trim();
}

/** 日本語の文をいくつか、まとめて英語・中国語（簡体字）・韓国語に訳す（1回の呼び出し） */
async function geminiMany(list) {
  const langs = TR_LANGS.map((l) => l.id);
  const out = await geminiCall(
    SYSTEM(`Translate each Japanese text in the JSON array into ${langs.map((l) => `${NAMES[l]} ("${l}")`).join(', ')}.
Reply as a JSON array with exactly ${list.length} objects in the same order, each like {${langs.map((l) => `"${l}": "..."`).join(', ')}}.`),
    JSON.stringify(list),
  );
  if (!Array.isArray(out) || out.length !== list.length) throw new Error('gemini bad array');
  return out.map((o) => Object.fromEntries(langs.map((l) => [l, typeof o?.[l] === 'string' && o[l].trim() ? o[l].trim() : null])));
}

// claude / gemini を指定したらそれを使う。それ以外（空・mymemory）は、Gemini のキーがあれば gemini を優先する
const provider = () => {
  const p = process.env.TRANSLATION_PROVIDER;
  if (p === 'claude' || p === 'gemini') return p;
  return process.env.GEMINI_API_KEY ? 'gemini' : 'mymemory';
};

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

/** 無料の機械翻訳（MyMemory は1回500文字までなので、長い文は段落ごとに分けて訳す） */
async function mymemoryLong(src, from, to) {
  const input = from === 'ja' && to === 'en' ? applyGlossary(src) : src;
  const parts = input.length > 450 ? input.split(/(?<=[。．！？\n])/).reduce((acc, x) => {
    if (!acc.length || (acc.at(-1) + x).length > 450) acc.push(x); else acc[acc.length - 1] += x;
    return acc;
  }, []) : [input];
  const out = [];
  for (const p of parts) out.push(p.trim() ? await mymemory(p.trim(), from, to) : p);
  return out.join(' ').trim();
}

/** 失敗したら null */
export async function translate(text, from, to) {
  const src = String(text ?? '').trim();
  if (!src) return '';
  if (from === to) return src;
  const pv = provider();
  if (pv === 'gemini' || pv === 'claude') {
    try {
      return pv === 'gemini' ? await gemini(src, from, to) : await claude(src, from, to);
    } catch (e) {
      console.error(`translate (${pv}) failed, falling back to mymemory:`, e.message);
    }
  }
  try {
    return await mymemoryLong(src, from, to);
  } catch (e) {
    console.error('translate failed', e.message);
    return null;
  }
}

/**
 * 日本語の文をいくつか → [{ ja, en, zh, ko }]（null の言語は翻訳失敗。画面では英語→原文の順で代わりに出す）
 * Gemini なら1回の呼び出しでまとめて訳す（無料枠の回数制限に当たりにくい）。訳せなかった所だけ1つずつ訳し直す
 */
export async function jaToAllMany(list) {
  const items = list.map((ja) => String(ja ?? '').trim());
  const result = items.map((ja) => ({ ja, ...Object.fromEntries(TR_LANGS.map((l) => [l.id, ja ? null : ''])) }));
  const todo = items.map((ja, i) => [ja, i]).filter(([ja]) => ja);
  if (!todo.length) return result;
  if (provider() === 'gemini') {
    try {
      const out = await geminiMany(todo.map(([ja]) => ja));
      todo.forEach(([, i], k) => Object.assign(result[i], out[k]));
    } catch (e) {
      console.error('gemini batch failed, translating one by one:', e.message);
    }
  }
  await Promise.all(todo.flatMap(([ja, i]) => TR_LANGS.filter((l) => !result[i][l.id]).map(async (l) => { result[i][l.id] = await translate(ja, 'ja', l.id); })));
  return result;
}

/** 日本語 → { ja, en, zh, ko } */
export async function jaToAll(ja) {
  return (await jaToAllMany([ja]))[0];
}
export const jaToEn = jaToAll; // 旧名（互換のため）

/** すべての言語の訳がそろっているか */
export const fullyTranslated = (o) => Boolean(o?.ja) && TR_LANGS.every((l) => o[l.id]);
