// ============================================================
//  Googleマップ（Maps JavaScript API ＋ Places API (New)）
//  キーはサーバーの環境変数 GOOGLE_MAPS_API_KEY（/api/auth?action=me で受け取る）。
//  キーがないときは、無料の OpenStreetMap（Leaflet）で地図を出す（お店の検索は住所の手入力）。
// ============================================================

let loading = null;
let config = { key: null, mapId: 'DEMO_MAP_ID' };

export function setMapsConfig(c) { config = { ...config, ...c }; }
export const mapsEnabled = () => true; // Googleのキーがなくても OpenStreetMap で地図は出せる
export const placesEnabled = () => Boolean(config.key); // お店の名前検索は Google だけ

let leaflet = null;
/** Leaflet（OpenStreetMap）の読み込み */
function loadLeaflet() {
  if (leaflet) return leaflet;
  leaflet = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.append(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error('load_failed'));
    document.head.append(s);
  });
  return leaflet;
}

async function makeLeafletMap(el, { center, zoom, markers }) {
  const L = await loadLeaflet();
  el.innerHTML = '';
  const map = L.map(el, { scrollWheelZoom: false }).setView([center.lat, center.lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  const pts = [];
  for (const m of markers) {
    if (m.lat == null || m.lng == null) continue;
    const icon = L.divIcon({ className: 'pin', html: `<span>${m.label ?? '🏮'}</span>`, iconSize: [34, 34], iconAnchor: [17, 32] });
    const mk = L.marker([m.lat, m.lng], { icon, title: m.title ?? '' }).addTo(map);
    if (m.onClick) mk.on('click', m.onClick);
    pts.push([m.lat, m.lng]);
  }
  if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
  else if (pts.length === 1) map.setView(pts[0], 15);
  setTimeout(() => map.invalidateSize(), 50);
  // Googleマップと同じ形で使えるようにする
  return { map: { setCenter: ({ lat, lng }) => map.panTo([lat, lng]), setZoom: (z) => map.setZoom(z) }, markers: pts };
}

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
export async function makeMap(el, { center = { lat: 36.2, lng: 138.2 }, zoom = 5, markers = [], language } = {}) {
  if (!config.key) return makeLeafletMap(el, { center, zoom, markers });
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
