// ============================================================
//  デモ用の架空の店舗（発表・デモ用）。画面には「DEMO（架空のお店）」と出る。
//  入れる：npm run demo:add   消す：npm run demo:remove
//  本物の店舗とは Shop.isDemo で見分けている（本物には触らない）。
// ============================================================
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import { translate } from '../server/translate.js';
import { LANGS } from '../shared/constants.js';

const prisma = new PrismaClient();
const OWNER_EMAIL = 'demo-owner@itsumo.invalid'; // ログインできない（パスワードは誰も知らない）
const t = (ja, en) => ({ ja, en });
const every = (times, cap) => times.map((time) => ({ time, capacity: cap }));

const SHOPS = [
  {
    category: 'restaurant', area: 'osaka', name: t('立ち飲み とり吉', 'Torikichi standing bar'),
    address: '大阪府大阪市北区天神橋4丁目（デモ）', lat: 34.7036, lng: 135.5122,
    description: t('天満の路地裏で40年。仕事帰りの常連さんが肩を並べる、カウンターだけの立ち飲み焼き鳥屋です。', 'For 40 years in a Tenma back alley — a counter-only standing yakitori bar where regulars stop by after work, shoulder to shoulder.'),
    localsOrder: t('仕事帰りに、ねぎま2本と瓶ビール', 'After work: two negima skewers and a bottle of beer'),
    welcome: t('英語はできひんけど、指さしで大丈夫！一緒に乾杯しましょう', "I don't speak English, but pointing works fine! Let's have a toast together."),
    tips: ['counter', 'small', 'japanese'], tipsNote: t('赤ちょうちんが目印です', 'Look for the red lantern.'),
    localPct: 90, popular: { name: t('ねぎま（2本）', 'Negima skewers (2)'), priceJPY: 300 }, perk: t('最初の一杯は、店主と乾杯（ビール1杯サービス）', 'Your first drink is a toast with the owner — one beer on the house'),
    priceJPY: 2500, durationMin: 90, payment: 'cash', customers: 'local', years: '30+', stationKm: 1.3, notInGuidebooks: true,
    slots: every(['17:00', '18:30', '20:00'], 4), closedDays: [0], cutoff: 'same_day',
    extra: { dietary: ['no-pork'], allergyOk: false, menuStyle: 'alacarte' },
  },
  {
    category: 'experience', area: 'uji', name: t('山田茶園 茶摘みと抹茶づくり', 'Yamada Tea Farm — picking & making matcha'),
    address: '京都府宇治市白川（デモ）', lat: 34.8786, lng: 135.8199,
    description: t('親子三代で営む小さな茶畑。茶畑を歩き、石臼で碾茶を挽いて、自分で点てた抹茶を縁側でいただきます。', 'A small tea farm run by three generations. Walk the fields, grind tencha in a stone mill and whisk your own matcha on the veranda.'),
    localsOrder: t('近所の人は毎朝、急須で淹れた煎茶を一杯', 'Neighbors start every morning with a cup of sencha brewed in a kyusu teapot'),
    welcome: t('お茶の時間を一緒に過ごしましょう。言葉はなくても、お茶はおいしいです', "Let's share a tea break. Even without words, the tea tastes good."),
    tips: ['shoes', 'askphoto'], tipsNote: t('宇治駅まで車でお迎えします', 'We pick you up by car at Uji Station.'),
    localPct: 80, popular: { name: t('石臼挽き抹茶と季節の和菓子', 'Stone-ground matcha with a seasonal sweet'), priceJPY: 1200 }, perk: t('自分で挽いた抹茶をお土産に（30g）', 'Take home 30g of the matcha you ground yourself'),
    priceJPY: 6000, durationMin: 120, payment: 'cash', customers: 'local', years: '30+', stationKm: 4.2, notInGuidebooks: true,
    slots: every(['10:00', '14:00'], 6), closedDays: [1], cutoff: 'day_before',
    extra: { bring: t('歩きやすい靴', 'Comfortable walking shoes'), minPeople: 1 },
  },
  {
    category: 'restaurant', area: 'kyoto', name: t('おばんざい 小春', 'Obanzai Koharu'),
    address: '京都府京都市下京区（デモ）', lat: 34.9985, lng: 135.7605,
    description: t('築100年の町家で、女将が毎朝市場で選んだ京野菜のおばんざいを出しています。', 'In a 100-year-old townhouse, the okami serves obanzai made with Kyoto vegetables she picks at the market every morning.'),
    localsOrder: t('常連さんは、その日のおばんざい3品と白ごはん', 'Regulars get three obanzai dishes of the day with white rice'),
    welcome: t('はじめての方も、ようこそ。京都の家のごはんを食べに来てください', 'First-timers are welcome. Come and eat Kyoto home cooking.'),
    tips: ['shoes', 'quiet'], tipsNote: null,
    localPct: 60, popular: { name: t('おばんざい三品盛り', 'Three-dish obanzai plate'), priceJPY: 1500 }, perk: t('食後に、女将手作りのわらび餅', "After your meal: the okami's homemade warabi-mochi"),
    priceJPY: 3500, durationMin: 90, payment: 'card', customers: 'mixed', years: '10-30', stationKm: 1.0, notInGuidebooks: true,
    slots: every(['12:00', '18:00'], 4), closedDays: [2], cutoff: 'same_day',
    extra: { dietary: ['vegetarian', 'vegan'], allergyOk: true, menuStyle: 'course' },
  },
  {
    category: 'restaurant', area: 'kyoto', name: t('喫茶 ひだまり', 'Kissa Hidamari (retro coffee shop)'),
    address: '京都府京都市上京区（デモ）', lat: 35.0305, lng: 135.7468,
    description: t('1975年から続く、西陣の小さな喫茶店。新聞を読む常連さんと、ゆっくり流れる朝の時間。', 'A small Nishijin coffee shop since 1975. Regulars reading the newspaper, and a slow morning.'),
    localsOrder: t('朝はゆで卵付きのモーニングと、濃いめのブレンド', 'In the morning: the breakfast set with a boiled egg, and a strong blend coffee'),
    welcome: t('ゆっくりしていってください', 'Please take your time and relax.'),
    tips: ['quiet', 'japanese', 'smoking'], tipsNote: null,
    localPct: 90, popular: { name: t('モーニングセット', 'Morning set'), priceJPY: 600 },
    priceJPY: 800, durationMin: 60, payment: 'cash', customers: 'local', years: '30+', stationKm: 4.6, notInGuidebooks: true,
    slots: every(['08:00', '10:00'], 3), closedDays: [0], cutoff: 'same_day',
    extra: { dietary: ['vegetarian'], allergyOk: false, menuStyle: 'alacarte' },
  },
  {
    category: 'experience', area: 'nara', name: t('森の手打ちそば教室', 'Hand-made soba class in the woods'),
    address: '奈良県奈良市（デモ）', lat: 34.6702, lng: 135.8452,
    description: t('築150年の古民家で、そば打ちを習います。打ちたてを囲炉裏端でいただきます。', 'Learn to make soba in a 150-year-old farmhouse, then eat it fresh by the sunken hearth.'),
    localsOrder: t('地元の人は、打ちたてのざるそばに野菜の天ぷら', 'Locals have freshly made zaru soba with vegetable tempura'),
    welcome: t('粉まみれになって、一緒に楽しみましょう！', "Let's get covered in flour and have fun together!"),
    tips: ['shoes'], tipsNote: t('エプロンはお貸しします', 'We lend you an apron.'),
    localPct: 70, popular: { name: t('ざるそばと野菜天ぷら', 'Zaru soba with vegetable tempura'), priceJPY: 1800 }, perk: t('打ったそばをお土産に（2人前）', 'Take home the soba you made (2 servings)'),
    priceJPY: 4000, durationMin: 120, payment: 'cash', customers: 'local', years: '30+', stationKm: 2.4, notInGuidebooks: false,
    slots: every(['11:00'], 6), closedDays: [1, 2], cutoff: 'two_days',
    extra: { bring: t('なし', 'Nothing'), minPeople: 2 },
  },
  {
    category: 'restaurant', area: 'osaka', name: t('串かつ だるま屋 新世界横丁', 'Kushikatsu Darumaya Shinsekai Alley'),
    address: '大阪府大阪市浪速区恵美須東（デモ）', lat: 34.6525, lng: 135.5063,
    description: t('銭湯帰りの地元客が立ち寄る、横丁の小さな串かつ屋。ソースの二度づけは禁止です。', 'A little kushikatsu shop in the alley where locals drop in after the public bath. No double-dipping in the sauce!'),
    localsOrder: t('風呂上がりに、どて焼きとハイボール', 'After the bath: doteyaki stew and a highball'),
    welcome: t('ソースの二度づけ禁止だけ守ってくれたら、あとは自由に楽しんで！', 'Just no double-dipping in the sauce — otherwise, enjoy!'),
    tips: ['counter', 'smoking'], tipsNote: t('ソースの二度づけは禁止です', 'No double-dipping in the shared sauce.'),
    localPct: 50, popular: { name: t('どて焼き', 'Doteyaki (beef tendon stew)'), priceJPY: 450 },
    priceJPY: 3000, durationMin: 90, payment: 'cash', customers: 'mixed', years: '10-30', stationKm: 3.5, notInGuidebooks: false,
    slots: every(['18:00', '19:30'], 6), closedDays: [3], cutoff: 'same_day',
    extra: { dietary: [], allergyOk: true, menuStyle: 'alacarte' },
  },
];


// デモ店舗の中国語・韓国語（発表で見せるので手で書いた訳。ここにない文は自動翻訳）
const ZH_KO = {
  '立ち飲み とり吉': ['站着喝的小酒馆 鸟吉', '서서 마시는 술집 토리키치'],
  '天満の路地裏で40年。仕事帰りの常連さんが肩を並べる、カウンターだけの立ち飲み焼き鳥屋です。': ['在天满的小巷里开了40年。下班后的常客们肩并肩站在吧台前，是一家只有吧台的站立式烤鸡串店。', '덴마 골목에서 40년. 퇴근길 단골들이 어깨를 나란히 하는, 카운터만 있는 서서 마시는 야키토리 가게예요.'],
  '仕事帰りに、ねぎま2本と瓶ビール': ['下班后：两串葱段鸡肉串配一瓶啤酒', '퇴근길에: 네기마 꼬치 2개와 병맥주'],
  '英語はできひんけど、指さしで大丈夫！一緒に乾杯しましょう': ['我不会说英语，不过用手指一指就没问题！一起干杯吧', '영어는 못하지만 손가락으로 가리키면 괜찮아요! 같이 건배해요'],
  '赤ちょうちんが目印です': ['认准门口的红灯笼。', '빨간 초롱이 표시예요.'],
  'ねぎま（2本）': ['葱段鸡肉串（2串）', '네기마 꼬치(2개)'],
  '最初の一杯は、店主と乾杯（ビール1杯サービス）': ['第一杯和店主一起干杯（免费送一杯啤酒）', '첫 잔은 주인과 건배(맥주 1잔 서비스)'],
  '山田茶園 茶摘みと抹茶づくり': ['山田茶园 采茶与抹茶制作', '야마다 차밭 찻잎 따기와 말차 만들기'],
  '親子三代で営む小さな茶畑。茶畑を歩き、石臼で碾茶を挽いて、自分で点てた抹茶を縁側でいただきます。': ['祖孙三代经营的小茶园。漫步茶田，用石磨研磨碾茶，再在檐廊上品尝自己点的抹茶。', '3대째 이어 오는 작은 차밭. 차밭을 걷고, 맷돌로 찻잎을 갈아, 직접 저은 말차를 툇마루에서 마셔요.'],
  '近所の人は毎朝、急須で淹れた煎茶を一杯': ['邻居们每天早上都会用茶壶泡一杯煎茶', '이웃들은 매일 아침 찻주전자로 우린 센차 한 잔'],
  'お茶の時間を一緒に過ごしましょう。言葉はなくても、お茶はおいしいです': ['一起享受喝茶的时光吧。就算语言不通，茶也一样好喝。', '차 마시는 시간을 함께해요. 말이 없어도 차는 맛있어요.'],
  '宇治駅まで車でお迎えします': ['我们会开车到宇治站接您。', '우지역까지 차로 마중 나가요.'],
  '石臼挽き抹茶と季節の和菓子': ['石磨抹茶配当季和果子', '맷돌로 간 말차와 제철 화과자'],
  '自分で挽いた抹茶をお土産に（30g）': ['把自己磨的抹茶带回家当伴手礼（30克）', '직접 간 말차를 기념품으로(30g)'],
  '歩きやすい靴': ['方便走路的鞋', '걷기 편한 신발'],
  'おばんざい 小春': ['京都家常菜 小春', '오반자이 고하루'],
  '築100年の町家で、女将が毎朝市場で選んだ京野菜のおばんざいを出しています。': ['在有100年历史的町家里，老板娘每天早上去市场挑选京都蔬菜，做成家常菜。', '100년 된 마치야에서, 안주인이 매일 아침 시장에서 고른 교토 채소로 만든 반찬을 내요.'],
  '常連さんは、その日のおばんざい3品と白ごはん': ['常客们点当天的三道家常菜配白米饭', '단골은 그날의 반찬 3가지와 흰쌀밥'],
  'はじめての方も、ようこそ。京都の家のごはんを食べに来てください': ['第一次来的客人也欢迎。来尝尝京都人家里的饭菜吧。', '처음 오신 분도 환영해요. 교토 가정식을 먹으러 오세요.'],
  'おばんざい三品盛り': ['家常菜三品拼盘', '오반자이 3종 모둠'],
  '食後に、女将手作りのわらび餅': ['饭后送上老板娘亲手做的蕨饼', '식후에 안주인이 직접 만든 와라비모치'],
  '喫茶 ひだまり': ['喫茶店 向阳', '찻집 히다마리'],
  '1975年から続く、西陣の小さな喫茶店。新聞を読む常連さんと、ゆっくり流れる朝の時間。': ['自1975年开业的西阵小咖啡馆。看报纸的常客，和慢慢流淌的早晨时光。', '1975년부터 이어 온 니시진의 작은 찻집. 신문을 읽는 단골과 천천히 흐르는 아침 시간.'],
  '朝はゆで卵付きのモーニングと、濃いめのブレンド': ['早上点附水煮蛋的早餐套餐，配一杯浓一点的综合咖啡', '아침엔 삶은 달걀이 나오는 모닝 세트와 진한 블렌드 커피'],
  'ゆっくりしていってください': ['请慢慢享受。', '천천히 쉬다 가세요.'],
  'モーニングセット': ['早餐套餐', '모닝 세트'],
  '森の手打ちそば教室': ['森林手打荞麦面教室', '숲속 수타 소바 교실'],
  '築150年の古民家で、そば打ちを習います。打ちたてを囲炉裏端でいただきます。': ['在有150年历史的古民居里学做荞麦面，然后在地炉旁品尝刚做好的面。', '150년 된 고민가에서 소바 만들기를 배우고, 갓 만든 소바를 화로 옆에서 먹어요.'],
  '地元の人は、打ちたてのざるそばに野菜の天ぷら': ['本地人会点刚做好的笊篱荞麦面配蔬菜天妇罗', '현지인은 갓 만든 자루소바에 채소 튀김'],
  '粉まみれになって、一緒に楽しみましょう！': ['一起沾满面粉，开心地做吧！', '가루투성이가 되어 함께 즐겨요!'],
  'エプロンはお貸しします': ['我们会借给您围裙。', '앞치마는 빌려 드려요.'],
  'ざるそばと野菜天ぷら': ['笊篱荞麦面配蔬菜天妇罗', '자루소바와 채소 튀김'],
  '打ったそばをお土産に（2人前）': ['把自己做的荞麦面带回家（2人份）', '직접 만든 소바를 기념품으로(2인분)'],
  'なし': ['无', '없음'],
  '串かつ だるま屋 新世界横丁': ['炸串 达摩屋 新世界小巷', '쿠시카츠 다루마야 신세카이 골목'],
  '銭湯帰りの地元客が立ち寄る、横丁の小さな串かつ屋。ソースの二度づけは禁止です。': ['泡完澡堂的本地客人会顺路来的小巷炸串店。酱汁禁止蘸两次。', '대중목욕탕에서 나온 현지 손님들이 들르는 골목의 작은 쿠시카츠 가게. 소스 두 번 찍기는 금지예요.'],
  '風呂上がりに、どて焼きとハイボール': ['泡完澡后：味噌炖牛筋配威士忌苏打', '목욕 후에: 도테야키와 하이볼'],
  'ソースの二度づけ禁止だけ守ってくれたら、あとは自由に楽しんで！': ['只要遵守“酱汁不能蘸两次”，其他的随便享受！', '소스 두 번 찍기 금지만 지켜 주면, 나머지는 마음껏 즐겨요!'],
  'ソースの二度づけは禁止です': ['公用酱汁禁止蘸两次。', '함께 쓰는 소스는 두 번 찍으면 안 돼요.'],
  'どて焼き': ['味噌炖牛筋', '도테야키(소 힘줄 된장 조림)'],
};

/** { ja, en } に中国語・韓国語の訳を足す（上の表になければ自動翻訳。失敗したら英語で表示される） */
async function fill(o) {
  if (!o?.ja) return o;
  const [zh, ko] = ZH_KO[o.ja] ?? [];
  o.zh ??= zh; o.ko ??= ko;
  for (const l of LANGS) if (!o[l.id]) o[l.id] = await translate(o.ja, 'ja', l.id);
  return o;
}
async function fillShop(s) {
  for (const k of ['name', 'description', 'localsOrder', 'welcome', 'tipsNote', 'perk']) await fill(s[k]);
  await fill(s.popular?.name);
  await fill(s.extra?.bring);
  return s;
}

async function add() {
  let owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  owner ??= await prisma.user.create({ data: { email: OWNER_EMAIL, passwordHash: `nologin$${crypto.randomBytes(16).toString('hex')}`, role: 'business', name: 'デモ（架空のお店）', termsAgreedAt: new Date() } });
  await remove(false);
  for (const s of SHOPS) {
    await fillShop(s);
    await prisma.shop.create({ data: { ...s, ownerId: owner.id, isDemo: true, status: 'published', addressVerified: true, publishedAt: new Date(Date.now() - Math.random() * 3600000) } });
  }
  console.log(`Added ${SHOPS.length} demo shops.`);
}

async function remove(log = true) {
  const shops = await prisma.shop.findMany({ where: { isDemo: true }, select: { id: true } });
  const ids = shops.map((s) => s.id);
  await prisma.message.deleteMany({ where: { thread: { shopId: { in: ids } } } });
  await prisma.thread.deleteMany({ where: { shopId: { in: ids } } });
  await prisma.booking.deleteMany({ where: { shopId: { in: ids } } });
  await prisma.report.deleteMany({ where: { shopId: { in: ids } } });
  await prisma.shop.deleteMany({ where: { id: { in: ids } } });
  if (log) console.log(`Removed ${ids.length} demo shops.`);
}

const cmd = process.argv[2];
await (cmd === 'remove' ? remove() : add());
await prisma.$disconnect();
