#!/bin/zsh
# ============================================================
#  Gemini の API キーを本番（Vercel）に登録して、もう一度公開する。
#  使い方：npm run gemini:setup
#  キーは画面に表示されず、ファイルにも残らない（Vercel にだけ送る）。
# ============================================================
set -e
export PATH=~/.local/node/bin:$PATH
cd "$(dirname "$0")/.."

echo ""
echo "🔑 Gemini の API キーを貼り付けて、Enter を押してください（入力した文字は表示されません）"
read -rs "KEY?> "
echo ""
KEY="${KEY//[[:space:]]/}"

if [[ "$KEY" != AIza* && "$KEY" != AQ.* ]]; then
  echo "❌ キーは AIza か AQ. で始まる文字列です。https://aistudio.google.com/apikey でコピーし直してください。"
  exit 1
fi

echo "① キーが使えるか確認しています…"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-goog-api-key: $KEY" "https://generativelanguage.googleapis.com/v1beta/models")
if [[ "$CODE" != "200" ]]; then
  echo "❌ このキーは使えないようです（応答 $CODE）。コピーし直すか、少し待ってからもう一度試してください。"
  exit 1
fi
echo "   ✅ 使えるキーです"

echo "② Vercel（本番）に GEMINI_API_KEY として登録しています…"
npx vercel env rm GEMINI_API_KEY production --yes >/dev/null 2>&1 || true
printf %s "$KEY" | npx vercel env add GEMINI_API_KEY production >/dev/null
unset KEY
echo "   ✅ 登録しました"

echo "③ 本番にもう一度公開しています（1分くらい）…"
npx vercel deploy --prod --yes >/dev/null 2>&1
echo "   ✅ 公開しました"

echo ""
echo "🎉 完了！ Claude に「登録した」と伝えてください。翻訳が Gemini になっているか確認します。"
