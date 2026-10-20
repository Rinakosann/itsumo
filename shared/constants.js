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
// 旅行者の表示言語（お店の文は日本語から自動翻訳。mm＝MyMemoryの言語コード）
export const LANGS = [
  { id: 'en', label: 'English', short: 'EN', mm: 'en', locale: 'en' },
  { id: 'zh', label: '中文', short: '中', mm: 'zh-CN', locale: 'zh-CN' },
  { id: 'ko', label: '한국어', short: '한', mm: 'ko', locale: 'ko' },
];
export const LANG_IDS = LANGS.map((l) => l.id);

// 地元のお客さんの割合（お店の申告・10刻み）
export const LOCAL_PCTS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

export const CURRENCIES = ['SGD', 'USD', 'CNY', 'HKD', 'TWD', 'KRW', 'EUR'];

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
