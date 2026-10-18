# ITSUMO（いつもの）— 地元の「いつもの」に、まざろう。

夜の街・ちょうちんがテーマ。旧名 Tabi Local（MVP縮小版）。

事業者が日本語だけで店舗を登録し、旅行者が英語の一覧から選んで、翻訳チャットと即時予約まで進めるアプリ。
仕様書「MVP縮小版」にもとづく。本番：https://tabi-local-mvp.vercel.app

| ページ | URL | 言語 |
|---|---|---|
| トップ（旅行者／事業者の分岐） | `/` | 英語＋日本語 |
| 旅行者画面 | `/traveler` | 英語 |
| 事業者画面 | `/business` | 日本語 |

技術：Vite（Vanilla JS）／ Vercel Functions（`api/`・6個）／ Postgres（Neon）／ Prisma ／ Google Maps（Maps JavaScript API・Places API (New)）

## 手元で動かす
```bash
cd ~/tabi-local-mvp
npm install
cp .env.example .env.local   # 初回だけ
npm run db:local             # ローカルのテスト用DB（このターミナルは開いたまま）
npm run db:prepare           # 別のターミナルで：表を作る（シードは入れない）
npx vite --port 5174         # http://localhost:5174
```

## 本番の設定（Vercel の環境変数）
| 名前 | 内容 |
|---|---|
| `DATABASE_URL` ほか | Neon 連携で自動 |
| `APP_URL` | `https://tabi-local-mvp.vercel.app`（再設定メールのリンク） |
| `GOOGLE_MAPS_API_KEY` | 地図・お店検索。ないと地図なしで動く（住所は手入力） |
| `GOOGLE_MAP_ID` | 任意。なければ `DEMO_MAP_ID` |
| `RESEND_API_KEY` / `EMAIL_FROM` | パスワード再設定メール。ないと送られない |
| `TRANSLATION_PROVIDER` | `mymemory`（無料・当面）／`claude`（AI翻訳。`ANTHROPIC_API_KEY` も必要） |

## どこを変えればいい？
| やりたいこと | ファイル |
|---|---|
| エリア・主要駅、絞り込みの選択肢、上限（文字数・予約数・ロック回数など）、運営者名・問い合わせ先 | `shared/constants.js` |
| 予約できる日・枠の判定 | `shared/booking.js` |
| 旅行者画面の英語の文言・キャラクターの一言 | `src/traveler/strings.js` |
| キャラクターの絵 | `src/common/character-art.js` |
| 利用規約・プライバシーポリシー | `src/common/legal.js` |
| 翻訳の方式 | `server/translate.js` |
| DBの項目 | `prisma/schema.prisma`（デプロイ時に自動で反映） |
| 色・デザイン | `src/common/style.css` の `:root` |

## 運営（MVPは画面なし・DBで直接）
- 新しく公開された店舗と「この店舗を報告」（`Report` 表）を毎日確認。怪しい店舗は `Shop.status` を `hidden` にする
- 成功指標：`ShopView`（詳細ページの閲覧・1回ごと）、`Booking`、`Message`
- DB を見る：`npm run db:studio`（`.env.local` を本番の値にして実行）／ Neon のダッシュボードでバックアップ（復元ポイント）を確認

## デモ用のサンプル店舗
架空の6店舗（画面に「DEMO」と表示）。本物のお店が増えたら消せます。
```bash
npm run demo:add      # 入れる（入れ直し）
npm run demo:remove   # 消す
```
本番に対しては、`npx vercel env pull` した環境変数で `node prisma/demo-shops.js add|remove` を実行する。
