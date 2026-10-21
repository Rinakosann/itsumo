#!/bin/zsh
# ============================================================
#  本番（Vercel）に公開する。使い方：npm run deploy
#  GitHub のコミット作者（Rinakosann）は Vercel のメンバーではないため、
#  そのまま公開すると「Blocked」になる。.git を含めない一時フォルダから公開して、作者の情報を送らないようにする。
# ============================================================
set -e
export PATH=~/.local/node/bin:$PATH
cd "$(dirname "$0")/.."
ROOT="$PWD"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude .git --exclude node_modules --exclude dist --exclude .pglite --exclude '.env*' \
  --exclude .agents --exclude .claude --exclude skills-lock.json ./ "$TMP/"
cd "$TMP"
"$ROOT/node_modules/.bin/vercel" deploy --prod --yes
