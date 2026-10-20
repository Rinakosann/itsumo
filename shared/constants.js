// ============================================================
//  選択肢と設定値（画面とサーバーの両方で使う）。値を変えたいときはここ。
// ============================================================

// エリア：運営が決めた一覧。エリアごとに主要駅を1つ（事業者は主要駅からの距離だけを入れる）
// lat/lng は駅の位置（Googleマップで店舗を選んだとき、直線距離を参考値として入れるため）
export const AREAS = [
  { id: 'uji', ja: '宇治', en: 'Uji', zh: '宇治', ko: '우지', stationJa: 'JR宇治駅', stationEn: 'JR Uji Station', stationZh: 'JR宇治站', stationKo: 'JR 우지역', lat: 34.8894, lng: 135.8003 },
  { id: 'kyoto', ja: '京都市内', en: 'Kyoto City', zh: '京都市区', ko: '교토 시내', stationJa: '京都駅', stationEn: 'Kyoto Station', stationZh: '京都站', stationKo: '교토역', lat: 34.9858, lng: 135.7588 },
  { id: 'osaka', ja: '大阪市内', en: 'Osaka City', zh: '大阪市区', ko: '오사카 시내', stationJa: '大阪駅', stationEn: 'Osaka Station', stationZh: '大阪站', stationKo: '오사카역', lat: 34.7025, lng: 135.4959 },
  { id: 'nara', ja: '奈良', en: 'Nara', zh: '奈良', ko: '나라', stationJa: '近鉄奈良駅', stationEn: 'Kintetsu-Nara Station', stationZh: '近铁奈良站', stationKo: '긴테쓰나라역', lat: 34.6845, lng: 135.8279 },
];
export const areaOf = (id) => AREAS.find((a) => a.id === id);

export const CATEGORIES = [
  { id: 'experience', ja: '体験', en: 'Experience', zh: '体验', ko: '체험' },
  { id: 'restaurant', ja: '飲食店', en: 'Restaurant', zh: '餐厅', ko: '음식점' },
];

// 地元らしさの情報（点数は付けない。事実として載せる）
export const CUSTOMERS = [
  { id: 'local', ja: 'ほぼ地元の人', en: 'Mostly locals', zh: '大多是本地人', ko: '대부분 현지인' },
  { id: 'mixed', ja: '半々', en: 'Locals and tourists', zh: '本地人和游客各半', ko: '현지인과 관광객 반반' },
  { id: 'tourist', ja: '観光客が多い', en: 'Mostly tourists', zh: '游客较多', ko: '관광객이 많음' },
];
export const YEARS = [
  { id: '<10', ja: '10年未満', en: 'Under 10 years', zh: '不到10年', ko: '10년 미만' },
  { id: '10-30', ja: '10〜30年', en: '10–30 years', zh: '10–30年', ko: '10~30년' },
  { id: '30+', ja: '30年以上', en: 'Over 30 years', zh: '30年以上', ko: '30년 이상' },
];
export const DISTANCES = [1, 3, 10]; // 主要駅から ○km以内

// 予算（1人あたりの料金）の絞り込み
export const BUDGETS = [
  { id: 'b1', max: 3000, en: 'Under ¥3,000', zh: '¥3,000以下', ko: '¥3,000 미만' },
  { id: 'b2', min: 3000, max: 5000, en: '¥3,000–5,000', zh: '¥3,000–5,000', ko: '¥3,000~5,000' },
  { id: 'b3', min: 5000, max: 10000, en: '¥5,000–10,000', zh: '¥5,000–10,000', ko: '¥5,000~10,000' },
  { id: 'b4', min: 10000, en: 'Over ¥10,000', zh: '¥10,000以上', ko: '¥10,000 이상' },
];

export const PAYMENTS = [
  { id: 'cash', ja: '現金のみ', en: 'Cash only', zh: '仅限现金', ko: '현금만' },
  { id: 'card', ja: 'カード可', en: 'Cash or card', zh: '现金或刷卡', ko: '현금 또는 카드' },
];

// 食事制限（旅行者が選ぶ・飲食店が対応を登録）
export const DIETARY = [
  { id: 'vegetarian', ja: 'ベジタリアン', en: 'Vegetarian', zh: '素食', ko: '채식' },
  { id: 'vegan', ja: 'ヴィーガン', en: 'Vegan', zh: '纯素', ko: '비건' },
  { id: 'halal', ja: 'ハラール', en: 'Halal', zh: '清真', ko: '할랄' },
  { id: 'no-pork', ja: '豚肉なし', en: 'No pork', zh: '不含猪肉', ko: '돼지고기 없음' },
  { id: 'no-alcohol', ja: 'アルコールなし', en: 'No alcohol', zh: '不含酒精', ko: '알코올 없음' },
  { id: 'gluten-free', ja: 'グルテンフリー', en: 'Gluten-free', zh: '无麸质', ko: '글루텐 프리' },
  { id: 'allergy', ja: 'アレルギーあり（メッセージで伝える）', en: 'Food allergy (please tell the shop in your message)', zh: '有食物过敏（请在留言中告诉店家）', ko: '식품 알레르기 있음(메시지로 가게에 알려 주세요)' },
];
export const MENU_STYLES = [
  { id: 'course', ja: 'コース', en: 'Set course', zh: '套餐', ko: '코스' },
  { id: 'alacarte', ja: 'アラカルト', en: 'À la carte', zh: '单点', ko: '단품' },
  { id: 'both', ja: 'コース・アラカルト', en: 'Set course or à la carte', zh: '套餐或单点', ko: '코스 또는 단품' },
];

// 受付締切
export const CUTOFFS = [
  { id: 'same_day', days: 0, ja: '当日OK', en: 'Same-day booking OK', zh: '可当天预约', ko: '당일 예약 가능' },
  { id: 'day_before', days: 1, ja: '前日まで', en: 'Book by the day before', zh: '需提前一天预约', ko: '전날까지 예약' },
  { id: 'two_days', days: 2, ja: '2日前まで', en: 'Book at least 2 days ahead', zh: '需至少提前两天预约', ko: '최소 2일 전까지 예약' },
];

// 事業者のキャンセル理由
export const CANCEL_REASONS = [
  { id: 'closed', ja: '臨時休業', en: 'Temporarily closed', zh: '临时休息', ko: '임시 휴업' },
  { id: 'weather', ja: '天候', en: 'Weather', zh: '天气原因', ko: '날씨' },
  { id: 'other', ja: 'その他', en: 'Other', zh: '其他', ko: '기타' },
];

// 来る前に知ってほしいこと（店主が選ぶ）。支払い方法（現金のみ）は自動で出す
export const TIPS = [
  { id: 'shoes', ja: '靴を脱いで上がります', en: 'You take your shoes off inside — wear socks you are happy to show.', zh: '进店需要脱鞋——请穿干净好看的袜子。', ko: '안에서는 신발을 벗어요. 보여도 괜찮은 양말을 신고 오세요.' },
  { id: 'small', ja: '小さなお店です（席が少ない）', en: 'It is a small place with few seats. Please come on time.', zh: '店面很小、座位不多，请准时到达。', ko: '좌석이 적은 작은 가게예요. 시간에 맞춰 와 주세요.' },
  { id: 'counter', ja: 'カウンター席です', en: 'You sit at the counter, close to the owner.', zh: '坐在吧台，离店主很近。', ko: '주인과 가까운 카운터석에 앉아요.' },
  { id: 'quiet', ja: '静かに過ごしてください', en: 'Regulars enjoy a quiet atmosphere here.', zh: '这里的常客喜欢安静的氛围。', ko: '단골손님들이 조용한 분위기를 좋아해요.' },
  { id: 'nophoto', ja: '店内の撮影はご遠慮ください', en: 'Please do not take photos inside.', zh: '店内请勿拍照。', ko: '가게 안에서는 사진 촬영을 삼가 주세요.' },
  { id: 'askphoto', ja: '撮影は一声かけてから', en: 'Ask before taking photos — a smile and pointing at your camera works.', zh: '拍照前请先打个招呼——微笑着指指相机就可以。', ko: '사진을 찍기 전에 물어봐 주세요. 웃으며 카메라를 가리키면 돼요.' },
  { id: 'smoking', ja: '喫煙できる席があります', en: 'Smoking is allowed in some seats.', zh: '部分座位可以吸烟。', ko: '일부 좌석에서는 흡연할 수 있어요.' },
  { id: 'japanese', ja: '店内の表示は日本語だけです', en: 'Signs and menus are only in Japanese — that is part of the fun.', zh: '店内的标示和菜单只有日语——这也是乐趣之一。', ko: '가게 안내와 메뉴는 일본어뿐이에요. 그것도 재미예요.' },
];

// お店で使える日本語（旅行者向け・確定画面と詳細に出す）
export const PHRASES = [
  { ja: 'こんにちは。ITSUMOで予約した{name}です。', romaji: 'Konnichiwa. ITSUMO de yoyaku shita {name} desu.', en: "Hello. I'm {name}, I booked on ITSUMO.", zh: '你好，我是在ITSUMO上预约的{name}。', ko: '안녕하세요. ITSUMO에서 예약한 {name}입니다.' },
  { ja: 'おすすめは何ですか？', romaji: 'Osusume wa nan desu ka?', en: 'What do you recommend?', zh: '有什么推荐的吗？', ko: '추천 메뉴가 뭐예요?' },
  { ja: '地元の人がよく頼むものをください。', romaji: 'Jimoto no hito ga yoku tanomu mono o kudasai.', en: 'I would like what the locals usually order.', zh: '请给我本地人常点的。', ko: '현지 사람들이 자주 시키는 걸로 주세요.' },
  { ja: 'これは食べられません。', romaji: 'Kore wa taberaremasen.', en: "I can't eat this.", zh: '这个我不能吃。', ko: '이건 못 먹어요.' },
  { ja: 'とてもおいしかったです。ありがとうございました！', romaji: 'Totemo oishikatta desu. Arigatou gozaimashita!', en: 'It was delicious. Thank you very much!', zh: '非常好吃，谢谢！', ko: '정말 맛있었어요. 감사합니다!' },
];

// 表示通貨（日本円が正。ほかは目安）
// 旅行者の表示言語（お店の文は日本語から自動翻訳。mm＝MyMemoryの言語コード）。日本語を選ぶと原文のまま出す
export const LANGS = [
  { id: 'en', label: 'English', short: 'EN', mm: 'en', locale: 'en' },
  { id: 'zh', label: '简体中文', short: '中', mm: 'zh-CN', locale: 'zh-CN' },
  { id: 'ko', label: '한국어', short: '한', mm: 'ko', locale: 'ko' },
  { id: 'ja', label: '日本語', short: '日', mm: 'ja', locale: 'ja' },
];
export const LANG_IDS = LANGS.map((l) => l.id);
/** 日本語から自動翻訳する言語 */
export const TR_LANGS = LANGS.filter((l) => l.id !== 'ja');

// 地元のお客さんの割合（お店の申告・10刻み）
export const LOCAL_PCTS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

export const CURRENCIES = ['JPY', 'SGD', 'USD', 'CNY', 'HKD', 'TWD', 'KRW', 'EUR']; // JPY＝円だけ表示

export const LIMITS = {
  messageMaxChars: 500, // チャット・予約メッセージ（翻訳APIへの過剰な入力を防ぐ）
  descriptionMaxChars: 1500,
  maxFutureBookings: 5, // 1人の旅行者が同時に持てる未来の予約
  maxSlots: 12, // 1店舗の時間枠の数
  maxCapacity: 20, // 1枠の上限人数
  bookingDaysAhead: 90, // 何日先まで予約できるか
  loginFailLock: 5, // ログイン失敗がこの回数続くと
  loginLockMinutes: 15, // この時間ログインできない
  resetMailPerHour: 3, // パスワード再設定メール：同じメールアドレスへ1時間に
  resetLinkMinutes: 60, // 再設定リンクの有効期限
};

// 運営者と問い合わせ先（TODO: 仮。GitHubに上げる前に確認する）
export const OPERATOR = {
  nameJa: 'ITSUMO 運営事務局（仮）',
  nameEn: 'ITSUMO Operations Office (provisional)',
  email: 'support@example.com',
};

// ============================================================
//  日本全国：地方と都道府県（id は JIS の都道府県コード）。
//  x, y は「タイル地図」（四角を並べた日本地図）での位置。
// ============================================================
export const REGIONS = [
  { id: 'hokkaido', ja: '北海道', en: 'Hokkaido', zh: '北海道', ko: '홋카이도', color: '#7ec8e3' },
  { id: 'tohoku', ja: '東北', en: 'Tohoku', zh: '东北', ko: '도호쿠', color: '#8fd1a8' },
  { id: 'kanto', ja: '関東', en: 'Kanto', zh: '关东', ko: '간토', color: '#f2c46d' },
  { id: 'chubu', ja: '中部', en: 'Chubu', zh: '中部', ko: '주부', color: '#b7d36b' },
  { id: 'kinki', ja: '近畿', en: 'Kansai', zh: '关西', ko: '간사이', color: '#ff9f6b' },
  { id: 'chugoku', ja: '中国', en: 'Chugoku', zh: '中国地区', ko: '주고쿠', color: '#c9a3e6' },
  { id: 'shikoku', ja: '四国', en: 'Shikoku', zh: '四国', ko: '시코쿠', color: '#7fd6c8' },
  { id: 'kyushu', ja: '九州・沖縄', en: 'Kyushu & Okinawa', zh: '九州・冲绳', ko: '규슈・오키나와', color: '#ff8fa3' },
];

const P = (id, region, ja, en, zh, ko, x, y) => ({ id, region, ja, en, zh, ko, x, y });
export const PREFS = [
  P('01', 'hokkaido', '北海道', 'Hokkaido', '北海道', '홋카이도', 12, 0),
  P('02', 'tohoku', '青森県', 'Aomori', '青森县', '아오모리현', 12, 2),
  P('03', 'tohoku', '岩手県', 'Iwate', '岩手县', '이와테현', 12, 3),
  P('04', 'tohoku', '宮城県', 'Miyagi', '宫城县', '미야기현', 12, 4),
  P('05', 'tohoku', '秋田県', 'Akita', '秋田县', '아키타현', 11, 3),
  P('06', 'tohoku', '山形県', 'Yamagata', '山形县', '야마가타현', 11, 4),
  P('07', 'tohoku', '福島県', 'Fukushima', '福岛县', '후쿠시마현', 12, 5),
  P('08', 'kanto', '茨城県', 'Ibaraki', '茨城县', '이바라키현', 12, 7),
  P('09', 'kanto', '栃木県', 'Tochigi', '栃木县', '도치기현', 12, 6),
  P('10', 'kanto', '群馬県', 'Gunma', '群马县', '군마현', 11, 6),
  P('11', 'kanto', '埼玉県', 'Saitama', '埼玉县', '사이타마현', 11, 7),
  P('12', 'kanto', '千葉県', 'Chiba', '千叶县', '지바현', 12, 8),
  P('13', 'kanto', '東京都', 'Tokyo', '东京都', '도쿄도', 11, 8),
  P('14', 'kanto', '神奈川県', 'Kanagawa', '神奈川县', '가나가와현', 11, 9),
  P('15', 'chubu', '新潟県', 'Niigata', '新潟县', '니가타현', 11, 5),
  P('16', 'chubu', '富山県', 'Toyama', '富山县', '도야마현', 10, 5),
  P('17', 'chubu', '石川県', 'Ishikawa', '石川县', '이시카와현', 9, 5),
  P('18', 'chubu', '福井県', 'Fukui', '福井县', '후쿠이현', 8, 6),
  P('19', 'chubu', '山梨県', 'Yamanashi', '山梨县', '야마나시현', 10, 7),
  P('20', 'chubu', '長野県', 'Nagano', '长野县', '나가노현', 10, 6),
  P('21', 'chubu', '岐阜県', 'Gifu', '岐阜县', '기후현', 9, 6),
  P('22', 'chubu', '静岡県', 'Shizuoka', '静冈县', '시즈오카현', 10, 8),
  P('23', 'chubu', '愛知県', 'Aichi', '爱知县', '아이치현', 9, 7),
  P('24', 'kinki', '三重県', 'Mie', '三重县', '미에현', 9, 8),
  P('25', 'kinki', '滋賀県', 'Shiga', '滋贺县', '시가현', 8, 7),
  P('26', 'kinki', '京都府', 'Kyoto', '京都府', '교토부', 7, 7),
  P('27', 'kinki', '大阪府', 'Osaka', '大阪府', '오사카부', 7, 8),
  P('28', 'kinki', '兵庫県', 'Hyogo', '兵库县', '효고현', 6, 7),
  P('29', 'kinki', '奈良県', 'Nara', '奈良县', '나라현', 8, 8),
  P('30', 'kinki', '和歌山県', 'Wakayama', '和歌山县', '와카야마현', 8, 9),
  P('31', 'chugoku', '鳥取県', 'Tottori', '鸟取县', '돗토리현', 5, 6),
  P('32', 'chugoku', '島根県', 'Shimane', '岛根县', '시마네현', 4, 6),
  P('33', 'chugoku', '岡山県', 'Okayama', '冈山县', '오카야마현', 5, 7),
  P('34', 'chugoku', '広島県', 'Hiroshima', '广岛县', '히로시마현', 4, 7),
  P('35', 'chugoku', '山口県', 'Yamaguchi', '山口县', '야마구치현', 3, 7),
  P('36', 'shikoku', '徳島県', 'Tokushima', '德岛县', '도쿠시마현', 5, 10),
  P('37', 'shikoku', '香川県', 'Kagawa', '香川县', '가가와현', 5, 9),
  P('38', 'shikoku', '愛媛県', 'Ehime', '爱媛县', '에히메현', 4, 9),
  P('39', 'shikoku', '高知県', 'Kochi', '高知县', '고치현', 4, 10),
  P('40', 'kyushu', '福岡県', 'Fukuoka', '福冈县', '후쿠오카현', 2, 8),
  P('41', 'kyushu', '佐賀県', 'Saga', '佐贺县', '사가현', 1, 8),
  P('42', 'kyushu', '長崎県', 'Nagasaki', '长崎县', '나가사키현', 1, 9),
  P('43', 'kyushu', '熊本県', 'Kumamoto', '熊本县', '구마모토현', 2, 9),
  P('44', 'kyushu', '大分県', 'Oita', '大分县', '오이타현', 3, 8),
  P('45', 'kyushu', '宮崎県', 'Miyazaki', '宫崎县', '미야자키현', 3, 9),
  P('46', 'kyushu', '鹿児島県', 'Kagoshima', '鹿儿岛县', '가고시마현', 2, 10),
  P('47', 'kyushu', '沖縄県', 'Okinawa', '冲绳县', '오키나와현', 0, 12),
];
export const prefOf = (id) => PREFS.find((p) => p.id === id);
/** 住所の先頭から都道府県を見つける */
export const prefFromAddress = (addr = '') => PREFS.find((p) => String(addr).replace(/^日本、?\s*(〒?\d{3}-?\d{4}\s*)?/, '').startsWith(p.ja)) ?? null;
/** 住所から市区町村（「〇〇郡〇〇町」「〇〇市」「〇〇区」など）を取り出す */
export function cityFromAddress(addr = '') {
  const p = prefFromAddress(addr);
  if (!p) return '';
  const rest = String(addr).slice(String(addr).indexOf(p.ja) + p.ja.length);
  const m = rest.match(/^(.+?郡.+?[町村]|.+?市|.+?区|.+?[町村])/);
  return m ? m[1] : '';
}

// 前の版の「エリア」（uji / kyoto / osaka / nara）で登録された店舗の、都道府県・市・駅
export const LEGACY_AREAS = {
  uji: { pref: '26', city: { ja: '宇治市', en: 'Uji', zh: '宇治市', ko: '우지시' }, station: { ja: 'JR宇治駅', en: 'JR Uji Station', zh: 'JR宇治站', ko: 'JR 우지역' } },
  kyoto: { pref: '26', city: { ja: '京都市', en: 'Kyoto', zh: '京都市', ko: '교토시' }, station: { ja: '京都駅', en: 'Kyoto Station', zh: '京都站', ko: '교토역' } },
  osaka: { pref: '27', city: { ja: '大阪市', en: 'Osaka', zh: '大阪市', ko: '오사카시' }, station: { ja: '大阪駅', en: 'Osaka Station', zh: '大阪站', ko: '오사카역' } },
  nara: { pref: '29', city: { ja: '奈良市', en: 'Nara', zh: '奈良市', ko: '나라시' }, station: { ja: '近鉄奈良駅', en: 'Kintetsu-Nara Station', zh: '近铁奈良站', ko: '긴테쓰나라역' } },
};
