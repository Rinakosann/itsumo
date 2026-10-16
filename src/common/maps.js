// ============================================================
//  Googleマップ（Maps JavaScript API ＋ Places API (New)）
//  キーはサーバーの環境変数 GOOGLE_MAPS_API_KEY（/api/auth?action=me で受け取る）。
//  キーがないときは地図を出さず、住所の手入力だけで動く。
// ============================================================

let loading = null;
let config = { key: null, mapId: 'DEMO_MAP_ID' };

export function setMapsConfig(c) { config = { ...config, ...c }; }
export const mapsEnabled = () => Boolean(config.key);

/** Google公式の読み込み方（dynamic library import） */
export function loadMaps(language = 'en') {
  if (!config.key) return Promise.reject(new Error('no_key'));
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    window.__gmapsReady = () => resolve(window.google.maps);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.key)}&v=weekly&loading=async&language=${language}&region=JP&callback=__gmapsReady`;
    s.async = true;
    s.onerror = () => reject(new Error('load_failed'));
    document.head.append(s);
  });
  return loading;
}

/** 地図を作る。markers: [{ lat, lng, title, onClick }] */
export async function makeMap(el, { center = { lat: 34.95, lng: 135.72 }, zoom = 10, markers = [], language } = {}) {
  await loadMaps(language);
  const { Map } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');
  const map = new Map(el, { center, zoom, mapId: config.mapId, gestureHandling: 'cooperative', streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
  const bounds = new google.maps.LatLngBounds();
  const items = [];
  for (const m of markers) {
    if (m.lat == null || m.lng == null) continue;
    const pin = new PinElement({ background: '#2f6b3b', borderColor: '#1f4a28', glyphColor: '#ffffff' });
    const mk = new AdvancedMarkerElement({ map, position: { lat: m.lat, lng: m.lng }, title: m.title ?? '', content: pin.element, gmpClickable: true });
    if (m.onClick) mk.addListener('gmp-click', m.onClick);
    bounds.extend({ lat: m.lat, lng: m.lng });
    items.push(mk);
  }
  if (items.length > 1) map.fitBounds(bounds, 40);
  else if (items.length === 1) { map.setCenter(items[0].position); map.setZoom(15); }
  return { map, markers: items };
}

/**
 * 実在のお店・場所の検索（Places Autocomplete）。選ぶと onSelect({ name, address, lat, lng, placeId, website })
 */
export async function placeSearch(container, onSelect, { language = 'en', placeholder } = {}) {
  await loadMaps(language);
  const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');
  const el = new PlaceAutocompleteElement({ includedRegionCodes: ['jp'] });
  if (placeholder) el.setAttribute('placeholder', placeholder);
  el.style.width = '100%';
  container.replaceChildren(el);
  el.addEventListener('gmp-select', async ({ placePrediction }) => {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'websiteURI', 'id'] });
    onSelect({
      name: place.displayName ?? '', address: place.formattedAddress ?? '',
      lat: place.location?.lat(), lng: place.location?.lng(), placeId: place.id, website: place.websiteURI ?? '',
    });
  });
  return el;
}

/** Googleマップで開く（スマホではアプリ、なければブラウザ版） */
export function googleMapsLink({ name, lat, lng, placeId, address }) {
  if (placeId) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || address || '')}&query_place_id=${encodeURIComponent(placeId)}`;
  if (lat != null && lng != null) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name || '')}`;
}

/** 2点の直線距離（km） */
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
