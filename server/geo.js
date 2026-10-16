// 住所 → 実在の確認と位置（国土地理院の住所検索・無料・キー不要）。見つからなければ null
export async function geocodeJa(address) {
  try {
    const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`, { signal: AbortSignal.timeout(6000) });
    const list = await res.json();
    const hit = Array.isArray(list) ? list[0] : null;
    if (!hit) return null;
    const [lng, lat] = hit.geometry.coordinates;
    return { lat, lng, title: hit.properties.title };
  } catch {
    return null;
  }
}
