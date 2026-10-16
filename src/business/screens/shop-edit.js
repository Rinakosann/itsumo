// ============================================================
//  店舗の登録・編集（日本語で入力 → 保存すると英語に自動翻訳して即公開）
//  Googleマップで実在のお店を検索して選ぶと、店名・住所・位置・HP・主要駅からの距離（参考値）が入る。
//  必須項目が空なら下書きとして保存（公開しない）。
// ============================================================
import { $, $$, esc, toast } from '../../common/ui.js';
import { get, post } from '../../common/api.js';
import { placeSearch, makeMap, mapsEnabled, distanceKm } from '../../common/maps.js';
import { AREAS, CATEGORIES, CUSTOMERS, YEARS, PAYMENTS, DIETARY, MENU_STYLES, CUTOFFS, LIMITS, TIPS } from '../../../shared/constants.js';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const ERR = { invalid_link: '外部リンクは http:// か https:// で始まるURLを入れてください。' };

export async function renderList(view) {
  const { items } = await get('biz', 'shops');
  view.innerHTML = `
    <section>
      <h2>店舗</h2>
      <div class="list">${items.map((s) => `
        <a class="card" href="#/shop/${s.id}"><div class="card-body">
          <h3>${esc(s.name.ja || '（店名未入力）')}</h3>
          <div class="sub">${s.status === 'published' ? '<span class="badge ok">公開中</span>' : s.status === 'hidden' ? '<span class="badge warn">運営が非公開にしました</span>' : '<span class="badge muted">下書き（非公開）</span>'}
          ${s.name.ja && !s.name.en ? ' <span class="badge warn">英語に翻訳できませんでした</span>' : ''}</div>
        </div></a>`).join('') || '<p class="empty">まだ店舗がありません。最初の店舗を登録しましょう。</p>'}</div>
      <a class="btn primary block" href="#/shop/new">＋ 店舗を登録する</a>
    </section>`;
}

export async function renderEdit(view, id) {
  const s = id === 'new' ? { slots: [{ time: '10:00', capacity: 4 }], closedDays: [], cutoff: 'same_day', category: 'experience', extra: {} } : (await get('biz', 'shop', { id })).item;
  const x = s.extra ?? {};
  let currentId = id === 'new' ? null : id;
  const opt = (list, cur, key = 'ja') => list.map((o) => `<option value="${o.id}" ${o.id === cur ? 'selected' : ''}>${esc(o[key])}</option>`).join('');
  const pos = { lat: s.lat ?? null, lng: s.lng ?? null, placeId: s.placeId ?? null, verified: Boolean(s.addressVerified) };

  const slotRow = (sl = { time: '', capacity: 4 }) => `
    <div class="slot-row"><label class="label">開始時刻<input type="time" name="slotTime" value="${esc(sl.time)}" step="900" /></label>
    <label class="label">上限人数<input type="number" name="slotCap" min="1" max="${LIMITS.maxCapacity}" value="${sl.capacity}" /></label>
    <button type="button" class="btn small" data-del-slot>削除</button></div>`;

  view.innerHTML = `
    <section>
      <a class="back" href="#/shops">← 店舗一覧</a>
      <h2>${id === 'new' ? '店舗を登録' : '店舗を編集'}</h2>
      <p class="notice info small">日本語だけで入力してください。保存すると英語に自動翻訳され、必須項目（＊）がそろっていればすぐに公開されます。</p>

      <form class="form" id="f" novalidate>
        <h4>① Googleマップでお店を探す</h4>
        ${mapsEnabled() ? `<div id="place" class="place-search"></div><p class="muted small">お店の名前で検索して選ぶと、店名・住所・地図の位置・HPが自動で入ります（あとで直せます）。</p>` : '<p class="muted small">（地図の設定がまだのため、住所を手で入力してください）</p>'}
        <div id="edit-map" class="map small" ${mapsEnabled() && pos.lat != null ? '' : 'hidden'}></div>

        <h4>② 基本情報</h4>
        <label>店名＊<input name="name" maxlength="60" value="${esc(s.name?.ja)}" /></label>
        <div class="form-row">
          <label>カテゴリ＊<select name="category">${opt(CATEGORIES, s.category)}</select></label>
          <label>エリア＊<select name="area"><option value="">選ぶ</option>${AREAS.map((a) => `<option value="${a.id}" ${a.id === s.area ? 'selected' : ''}>${a.ja}（主要駅：${a.stationJa}）</option>`).join('')}</select></label>
        </div>
        <div class="form-row">
          <label>郵便番号<input name="postal" inputmode="numeric" maxlength="8" placeholder="611-0021" value="${esc(s.postal ?? '')}" /></label>
          <label>&nbsp;<button type="button" class="btn" data-zip>郵便番号から住所を入れる</button></label>
        </div>
        <label>住所＊<input name="address" maxlength="200" value="${esc(s.address)}" placeholder="都道府県から番地まで" /></label>
        <div class="row-between"><button type="button" class="btn" data-verify>📍 住所を確認する</button><span id="verified" class="small">${s.addressVerified ? '✅ 実在する住所を確認しました' : '<span class="muted">未確認（公開には確認が必要です）</span>'}</span></div>
        <p class="muted small">国土地理院の住所検索で、住所が実在するかを確かめます。確認できると地図の位置と駅からの距離も入ります。</p>
        <label>説明文＊<textarea name="description" maxlength="${LIMITS.descriptionMaxChars}" rows="5" placeholder="どんなお店・体験か、旅行者に伝えたいこと">${esc(s.description?.ja)}</textarea></label>
        <div class="form-row">
          <label>料金（1人・円）＊<input name="priceJPY" type="number" min="0" step="100" value="${s.priceJPY ?? ''}" /></label>
          <label>所要時間（分）＊<input name="durationMin" type="number" min="10" step="10" value="${s.durationMin ?? ''}" /></label>
        </div>
        <label>現地での支払い方法＊<select name="payment"><option value="">選ぶ</option>${opt(PAYMENTS, s.payment)}</select></label>
        <label>外部リンク（HPかInstagram・任意）<input name="link" type="url" maxlength="300" placeholder="https://" value="${esc(s.link ?? '')}" /></label>

        <h4>③ 地元らしさの情報（事実を入力）</h4>
        <div class="form-row">
          <label>客層＊<select name="customers"><option value="">選ぶ</option>${opt(CUSTOMERS, s.customers)}</select></label>
          <label>営業年数＊<select name="years"><option value="">選ぶ</option>${opt(YEARS, s.years)}</select></label>
        </div>
        <label>主要駅からの距離（km・道のりの目安）＊<input name="stationKm" type="number" min="0" max="100" step="0.1" value="${s.stationKm ?? ''}" />
          <span class="muted small" id="km-hint">エリアの主要駅からの道のり。Googleマップでお店を選ぶと直線距離が参考として入ります。</span></label>

        <label>地元の人がいつも頼むもの・すること（任意）<input name="localsOrder" maxlength="100" value="${esc(s.localsOrder?.ja ?? '')}" placeholder="例：常連さんはいつも、おでんの大根と熱燗" />
          <span class="muted small">星の評価ではなく、地元の人のふだんの楽しみ方を伝えます。一覧とお店のページに大きく出ます。</span></label>
        <label class="check"><input type="checkbox" name="notInGuidebooks" ${s.notInGuidebooks ? 'checked' : ''}/> ガイドブックや旅行サイトには載っていない</label>

        <h4>👋 海外のお客様へ（任意）</h4>
        <label>店主からのひとこと<input name="welcome" maxlength="100" value="${esc(s.welcome?.ja ?? '')}" placeholder="例：英語は話せませんが、海外の方も大歓迎です！" />
          <span class="muted small">「断られたらどうしよう」という不安をなくすためのひとことです。英語に翻訳して表示します。</span></label>
        <div class="label">来る前に知っておいてほしいこと</div>
        <div class="checks">${TIPS.map((tp) => `<label class="chip-check"><input type="checkbox" name="tips" value="${tp.id}" ${s.tips?.includes(tp.id) ? 'checked' : ''}/> ${esc(tp.ja)}</label>`).join('')}</div>
        <label>そのほか（任意）<input name="tipsNote" maxlength="200" value="${esc(s.tipsNote?.ja ?? '')}" placeholder="例：入口は路地の奥、赤いのれんが目印です" /></label>

        <h4>④ カテゴリ別の項目</h4>
        <div data-cat="experience">
          <label>持ち物<input name="bring" maxlength="200" value="${esc(x.bring?.ja ?? '')}" /></label>
          <label>最少催行人数<input name="minPeople" type="number" min="1" max="${LIMITS.maxCapacity}" value="${x.minPeople ?? ''}" /></label>
        </div>
        <div data-cat="restaurant">
          <div class="label">食事制限への対応</div>
          <div class="checks">${DIETARY.filter((d) => d.id !== 'allergy').map((d) => `<label class="chip-check"><input type="checkbox" name="dietary" value="${d.id}" ${x.dietary?.includes(d.id) ? 'checked' : ''}/> ${esc(d.ja)}</label>`).join('')}
            <label class="chip-check"><input type="checkbox" name="allergyOk" ${x.allergyOk ? 'checked' : ''}/> アレルギーに対応できる</label></div>
          <label>メニュー<select name="menuStyle"><option value="">選ぶ</option>${opt(MENU_STYLES, x.menuStyle)}</select></label>
        </div>

        <h4>⑤ 予約の設定</h4>
        <p class="muted small">時間枠（開始時刻）ごとに、受け入れる上限人数を決めます。上限内なら予約はすぐに確定します。枠がないと、予約は受けずチャットだけになります。</p>
        <div id="slots" class="list">${(s.slots ?? []).map(slotRow).join('')}</div>
        <button type="button" class="btn small" data-add-slot>＋ 時間枠を追加</button>
        <div class="label" style="margin-top:10px">定休日</div>
        <div class="checks">${WEEK.map((w, i) => `<label class="chip-check"><input type="checkbox" name="closedDays" value="${i}" ${s.closedDays?.includes(i) ? 'checked' : ''}/> ${w}</label>`).join('')}</div>
        <label>受付締切<select name="cutoff">${opt(CUTOFFS, s.cutoff)}</select></label>

        <p class="error" id="err" role="alert"></p>
        <div class="btn-row">
          <button class="btn" type="submit" value="draft">下書き保存</button>
          <button class="btn primary" type="submit" value="publish">${s.status === 'published' ? '保存（公開中）' : '保存して公開'}</button>
        </div>
        ${s.status === 'published' ? '<button type="button" class="btn block" data-unpublish>非公開にする</button>' : ''}
      </form>
      ${s.name?.en ? `<div class="section"><h4>🌐 英語の表示（自動翻訳）</h4><p><b>${esc(s.name.en)}</b><br><span class="small">${esc(s.description?.en ?? '')}</span></p></div>` : ''}
    </section>`;

  const f = $('#f');
  const showCat = () => $$('[data-cat]').forEach((el) => { el.hidden = el.dataset.cat !== f.category.value; });
  showCat();
  f.category.onchange = showCat;

  // いちばん近い主要駅のエリアを選び、直線距離を参考値として入れる
  const suggestStation = (p) => {
    const nearest = AREAS.map((a) => ({ a, km: distanceKm(a, p) })).sort((u, v) => u.km - v.km)[0];
    if (!f.area.value && nearest.km < 30) f.area.value = nearest.a.id;
    const area = AREAS.find((a) => a.id === f.area.value);
    if (area) { const km = Math.round(distanceKm(area, p) * 10) / 10; if (!f.stationKm.value) f.stationKm.value = km; $('#km-hint').textContent = `${area.stationJa}からの直線距離は 約${km}km です。道のりに合わせて直してください。`; }
  };
  let map = null;
  const drawMap = () => {
    if (!mapsEnabled() || pos.lat == null) return;
    $('#edit-map').hidden = false;
    makeMap($('#edit-map'), { language: 'ja', markers: [{ lat: pos.lat, lng: pos.lng, title: f.name.value }] }).then((m) => { map = m; }).catch(() => {});
  };
  drawMap();
  if (mapsEnabled()) {
    placeSearch($('#place'), (p) => {
      pos.lat = p.lat; pos.lng = p.lng; pos.placeId = p.placeId; pos.verified = p.lat != null;
      $('#verified').innerHTML = '✅ Googleマップで実在を確認しました';
      if (p.name) f.name.value = p.name;
      if (p.address) f.address.value = p.address.replace(/^日本、?\s*/, '');
      if (p.website && !f.link.value) f.link.value = p.website;
      if (p.lat != null) suggestStation(p);
      drawMap();
      toast('Googleマップの情報を入れました');
    }, { language: 'ja', placeholder: 'お店の名前で検索（例：中村藤吉 本店）' }).catch(() => {});
  }

  f.address.addEventListener('input', () => { pos.verified = false; $('#verified').innerHTML = '<span class="muted">住所が変わりました。もう一度確認してください</span>'; });
  view.onclick = async (e) => {
    if (e.target.closest('[data-zip]')) {
      const r = await get('geo', 'zip', { code: f.postal.value }).catch(() => ({ found: false }));
      if (r.found) { f.address.value = r.address; f.address.focus(); toast('住所を入れました。続けて番地を入れてください'); } else toast('郵便番号から住所が見つかりませんでした');
    }
    if (e.target.closest('[data-verify]')) {
      if (!f.address.value.trim()) return toast('住所を入れてください');
      const r = await get('geo', 'address', { q: f.address.value }).catch(() => ({ found: false }));
      if (r.found) {
        if (!pos.placeId) { pos.lat = r.lat; pos.lng = r.lng; }
        pos.verified = true;
        $('#verified').innerHTML = `✅ 実在する住所を確認しました（${esc(r.title)}）`;
        suggestStation(r); drawMap();
      } else { $('#verified').innerHTML = '<span class="error">住所が見つかりませんでした。番地まで正しく入っているか確認してください</span>'; }
    }
    if (e.target.closest('[data-add-slot]')) {
      if ($$('.slot-row').length >= LIMITS.maxSlots) return toast(`時間枠は${LIMITS.maxSlots}個までです`);
      $('#slots').insertAdjacentHTML('beforeend', slotRow());
    }
    if (e.target.closest('[data-del-slot]')) e.target.closest('.slot-row').remove();
    if (e.target.closest('[data-unpublish]') && confirm('非公開にしますか？旅行者の一覧に表示されなくなります（予約済みの分はそのままです）。')) {
      await post('biz', 'shop-unpublish', { id: currentId }); toast('非公開にしました'); location.hash = '#/shops';
    }
  };

  f.onsubmit = async (e) => {
    e.preventDefault();
    const publish = e.submitter?.value === 'publish';
    const fd = new FormData(f);
    const shop = {
      name: fd.get('name'), category: fd.get('category'), area: fd.get('area'), address: fd.get('address'), description: fd.get('description'),
      priceJPY: fd.get('priceJPY'), durationMin: fd.get('durationMin'), payment: fd.get('payment'), link: fd.get('link'),
      customers: fd.get('customers'), years: fd.get('years'), stationKm: fd.get('stationKm'),
      bring: fd.get('bring'), minPeople: fd.get('minPeople'), dietary: fd.getAll('dietary'), allergyOk: fd.has('allergyOk'), menuStyle: fd.get('menuStyle'),
      slots: $$('.slot-row').map((r) => ({ time: r.querySelector('[name=slotTime]').value, capacity: r.querySelector('[name=slotCap]').value })).filter((x2) => x2.time),
      closedDays: fd.getAll('closedDays').map(Number), cutoff: fd.get('cutoff'),
      localsOrder: fd.get('localsOrder'), notInGuidebooks: fd.has('notInGuidebooks'), welcome: fd.get('welcome'), tips: fd.getAll('tips'), tipsNote: fd.get('tipsNote'),
      lat: pos.lat, lng: pos.lng, placeId: pos.placeId, postal: fd.get('postal'), addressVerified: pos.verified,
    };
    const btn = e.submitter; btn.disabled = true; const label = btn.textContent; btn.textContent = '保存・翻訳中…';
    try {
      const res = await post('biz', 'shop-save', { id: currentId, shop, publish });
      currentId = res.id;
      history.replaceState(null, '', `#/shop/${res.id}`);
      if (res.missing.length) $('#err').textContent = `下書きとして保存しました。公開するには次を入力してください：${res.missing.join('、')}`;
      else {
        toast(res.status === 'published' ? '保存して公開しました' : '下書きを保存しました');
        if (res.translateFailed) toast('英語への翻訳に失敗した項目があります。旅行者には日本語のまま表示されます。もう一度保存すると翻訳を試します。');
        renderEdit(view, res.id);
        return;
      }
    } catch (er) { $('#err').textContent = ERR[er.code] ?? '保存できませんでした。入力内容と通信状況を確認して、もう一度お試しください。'; }
    btn.disabled = false; btn.textContent = label;
  };
}
