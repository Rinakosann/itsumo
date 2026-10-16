// ============================================================
//  選択肢と設定値（画面とサーバーの両方で使う）。値を変えたいときはここ。
// ============================================================

// エリア：運営が決めた一覧。エリアごとに主要駅を1つ（事業者は主要駅からの距離だけを入れる）
// lat/lng は駅の位置（Googleマップで店舗を選んだとき、直線距離を参考値として入れるため）
export const AREAS = [
  { id: 'uji', ja: '宇治', en: 'Uji', stationJa: 'JR宇治駅', stationEn: 'JR Uji Station', lat: 34.8894, lng: 135.8003 },
  { id: 'kyoto', ja: '京都市内', en: 'Kyoto City', stationJa: '京都駅', stationEn: 'Kyoto Station', lat: 34.9858, lng: 135.7588 },
  { id: 'osaka', ja: '大阪市内', en: 'Osaka City', stationJa: '大阪駅', stationEn: 'Osaka Station', lat: 34.7025, lng: 135.4959 },
  { id: 'nara', ja: '奈良', en: 'Nara', stationJa: '近鉄奈良駅', stationEn: 'Kintetsu-Nara Station', lat: 34.6845, lng: 135.8279 },
];
export const areaOf = (id) => AREAS.find((a) => a.id === id);

export const CATEGORIES = [
  { id: 'experience', ja: '体験', en: 'Experience' },
  { id: 'restaurant', ja: '飲食店', en: 'Restaurant' },
];

// 地元らしさの情報（点数は付けない。事実として載せる）
export const CUSTOMERS = [
  { id: 'local', ja: 'ほぼ地元の人', en: 'Mostly locals' },
  { id: 'mixed', ja: '半々', en: 'Locals and tourists' },
  { id: 'tourist', ja: '観光客が多い', en: 'Mostly tourists' },
];
export const YEARS = [
  { id: '<10', ja: '10年未満', en: 'Under 10 years' },
  { id: '10-30', ja: '10〜30年', en: '10–30 years' },
  { id: '30+', ja: '30年以上', en: 'Over 30 years' },
];
export const DISTANCES = [1, 3, 10]; // 主要駅から ○km以内

// 予算（1人あたりの料金）の絞り込み
export const BUDGETS = [
  { id: 'b1', max: 3000, en: 'Under ¥3,000' },
  { id: 'b2', min: 3000, max: 5000, en: '¥3,000–5,000' },
  { id: 'b3', min: 5000, max: 10000, en: '¥5,000–10,000' },
  { id: 'b4', min: 10000, en: 'Over ¥10,000' },
];

export const PAYMENTS = [
  { id: 'cash', ja: '現金のみ', en: 'Cash only' },
  { id: 'card', ja: 'カード可', en: 'Cash or card' },
];

// 食事制限（旅行者が選ぶ・飲食店が対応を登録）
export const DIETARY = [
  { id: 'vegetarian', ja: 'ベジタリアン', en: 'Vegetarian' },
  { id: 'vegan', ja: 'ヴィーガン', en: 'Vegan' },
  { id: 'halal', ja: 'ハラール', en: 'Halal' },
  { id: 'no-pork', ja: '豚肉なし', en: 'No pork' },
  { id: 'no-alcohol', ja: 'アルコールなし', en: 'No alcohol' },
  { id: 'gluten-free', ja: 'グルテンフリー', en: 'Gluten-free' },
  { id: 'allergy', ja: 'アレルギーあり（メッセージで伝える）', en: 'Food allergy (please tell the shop in your message)' },
];
export const MENU_STYLES = [
  { id: 'course', ja: 'コース', en: 'Set course' },
  { id: 'alacarte', ja: 'アラカルト', en: 'À la carte' },
  { id: 'both', ja: 'コース・アラカルト', en: 'Set course or à la carte' },
];

// 受付締切
export const CUTOFFS = [
  { id: 'same_day', days: 0, ja: '当日OK', en: 'Same-day booking OK' },
  { id: 'day_before', days: 1, ja: '前日まで', en: 'Book by the day before' },
  { id: 'two_days', days: 2, ja: '2日前まで', en: 'Book at least 2 days ahead' },
];

// 事業者のキャンセル理由
export const CANCEL_REASONS = [
  { id: 'closed', ja: '臨時休業', en: 'Temporarily closed' },
  { id: 'weather', ja: '天候', en: 'Weather' },
  { id: 'other', ja: 'その他', en: 'Other' },
];

// 来る前に知ってほしいこと（店主が選ぶ）。支払い方法（現金のみ）は自動で出す
export const TIPS = [
  { id: 'shoes', ja: '靴を脱いで上がります', en: 'You take your shoes off inside — wear socks you are happy to show.' },
  { id: 'small', ja: '小さなお店です（席が少ない）', en: 'It is a small place with few seats. Please come on time.' },
  { id: 'counter', ja: 'カウンター席です', en: 'You sit at the counter, close to the owner.' },
  { id: 'quiet', ja: '静かに過ごしてください', en: 'Regulars enjoy a quiet atmosphere here.' },
  { id: 'nophoto', ja: '店内の撮影はご遠慮ください', en: 'Please do not take photos inside.' },
  { id: 'askphoto', ja: '撮影は一声かけてから', en: 'Ask before taking photos — a smile and pointing at your camera works.' },
  { id: 'smoking', ja: '喫煙できる席があります', en: 'Smoking is allowed in some seats.' },
  { id: 'japanese', ja: '店内の表示は日本語だけです', en: 'Signs and menus are only in Japanese — that is part of the fun.' },
];

// お店で使える日本語（旅行者向け・確定画面と詳細に出す）
export const PHRASES = [
  { ja: 'こんにちは。Tabi Localで予約した{name}です。', romaji: 'Konnichiwa. Tabi Local de yoyaku shita {name} desu.', en: "Hello. I'm {name}, I booked on Tabi Local." },
  { ja: 'おすすめは何ですか？', romaji: 'Osusume wa nan desu ka?', en: 'What do you recommend?' },
  { ja: '地元の人がよく頼むものをください。', romaji: 'Jimoto no hito ga yoku tanomu mono o kudasai.', en: 'I would like what the locals usually order.' },
  { ja: 'これは食べられません。', romaji: 'Kore wa taberaremasen.', en: "I can't eat this." },
  { ja: 'とてもおいしかったです。ありがとうございました！', romaji: 'Totemo oishikatta desu. Arigatou gozaimashita!', en: 'It was delicious. Thank you very much!' },
];

// 表示通貨（日本円が正。ほかは目安）
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
  nameJa: 'Tabi Local 運営事務局（仮）',
  nameEn: 'Tabi Local Operations Office (provisional)',
  email: 'support@example.com',
};
