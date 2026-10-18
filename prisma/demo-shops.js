// ============================================================
//  デモ用の架空の店舗（発表・デモ用）。画面には「DEMO（架空のお店）」と出る。
//  入れる：npm run demo:add   消す：npm run demo:remove
//  本物の店舗とは Shop.isDemo で見分けている（本物には触らない）。
// ============================================================
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

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
    priceJPY: 3000, durationMin: 90, payment: 'cash', customers: 'mixed', years: '10-30', stationKm: 3.5, notInGuidebooks: false,
    slots: every(['18:00', '19:30'], 6), closedDays: [3], cutoff: 'same_day',
    extra: { dietary: [], allergyOk: true, menuStyle: 'alacarte' },
  },
];

async function add() {
  let owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  owner ??= await prisma.user.create({ data: { email: OWNER_EMAIL, passwordHash: `nologin$${crypto.randomBytes(16).toString('hex')}`, role: 'business', name: 'デモ（架空のお店）', termsAgreedAt: new Date() } });
  await remove(false);
  for (const s of SHOPS) {
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
