// 住所 → 実在の確認と位置（国土地理院の住所検索・無料・キー不要）。見つからなければ null
// 位置 → 近くの駅（HeartRails Express・日本全国・無料・キー不要）
import { prefFromAddress, cityFromAddress } from '../shared/constants.js';

const norm = (s) => String(s ?? '')
  .replace(/^日本、?\s*/, '').replace(/〒?\d{3}-?\d{4}/, '').replace(/[\s　]/g, '')
  .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0)).replace(/[－‐ー―−]/g, '-');

/** 市区町村より後ろ（町名・番地）。区も外す */
function afterCity(addr) {
  const city = cityFromAddress(addr);
  if (!city) return '';
  return addr.slice(addr.indexOf(city) + city.length).replace(/^[^区]{1,6}区/, '');
}
/** 町名だけ（数字・丁目・番地より前） */
const townOf = (rest) => rest.replace(/[0-9一二三四五六七八九十〇-].*$/, '').replace(/(丁目|番地|番|号)$/, '');

/**
 * 国土地理院の検索は、町名が見つからなくても市まで一致すれば結果を返す。
 * 入力に町名があるのに、結果が市（区）までしかないときは「見つからない」とする。
 */
export function sameTown(query, title) {
  const q = norm(query);
  let t = norm(title);
  const pref = prefFromAddress(t)?.ja;
  const qq = pref && !q.startsWith(pref) ? pref + q : q;
  const qTown = townOf(afterCity(qq));
  if (!qTown) return true; // 入力が市までなら、市まで合っていればよい
  const tTown = townOf(afterCity(t));
  if (!tTown) return false;
  return qq.includes(tTown) || tTown.includes(qTown);
}

export async function geocodeJa(address) {
  try {
    const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`, { signal: AbortSignal.timeout(6000) });
    const list = await res.json();
    const hit = (Array.isArray(list) ? list : []).find((h) => sameTown(address, h.properties?.title));
    if (!hit) return null;
    const [lng, lat] = hit.geometry.coordinates;
    return { lat, lng, title: hit.properties.title };
  } catch {
    return null;
  }
}

/** 近くの駅（同じ駅名の路線違いはまとめる）。距離は直線距離 km。失敗したら [] */
export async function nearStations(lat, lng) {
  try {
    const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&x=${lng}&y=${lat}`, { signal: AbortSignal.timeout(6000) });
    const list = (await res.json())?.response?.station ?? [];
    const seen = new Map();
    for (const s of list) {
      const name = `${s.name}駅`;
      const m = Number(String(s.distance).replace(/[^0-9]/g, '')) || 0;
      if (!seen.has(name) || seen.get(name).m > m) seen.set(name, { name, line: s.line, m });
    }
    // 0.1km 未満でも 0 にはしない（「About 0 km」と出ないように）
    return [...seen.values()].sort((a, b) => a.m - b.m).slice(0, 4).map((s) => ({ name: s.name, line: s.line, km: Math.max(0.1, Math.round(s.m / 100) / 10) }));
  } catch {
    return [];
  }
}
