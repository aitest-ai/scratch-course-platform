#!/usr/bin/env bash
# 建置 Scratch 編輯器（嵌入版）並放到 public/editor。
# 我們不修改上游原始碼：固定使用下列版本，直接建置。
set -euo pipefail

UPSTREAM_REPO="https://github.com/scratchfoundation/scratch-editor.git"
UPSTREAM_COMMIT="ee8bd63153def348c3e481220589f47089050960"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.upstream"

if [ -d "$ROOT/public/editor" ] && [ -f "$ROOT/public/editor/scratch-gui-standalone.js" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "editor already built, skipping (FORCE=1 to rebuild)"; exit 0
fi

rm -rf "$WORK"
git init -q "$WORK"
git -C "$WORK" remote add origin "$UPSTREAM_REPO"
git -C "$WORK" fetch -q --depth 1 origin "$UPSTREAM_COMMIT"
git -C "$WORK" checkout -q FETCH_HEAD

cd "$WORK"
npm ci --no-audit --no-fund
export NODE_ENV=production

# 編輯器依賴的套件要先建置（順序依上游 workspaces 排列；略過文件產生以節省時間）
for ws in task-herder scratch-storage scratch-svg-renderer scratch-paint; do
  npm run build --workspace="packages/$ws"
done
(cd packages/scratch-render && npx webpack)
(cd packages/scratch-vm && npx webpack)

cd packages/scratch-gui
NODE_OPTIONS=--max-old-space-size=6144 npm run build:dist-standalone

rm -rf "$ROOT/public/editor"
mkdir -p "$ROOT/public/editor"
cp -R dist/. "$ROOT/public/editor/"
# 瘦身：不需要的檔案
find "$ROOT/public/editor" -name '*.map' -delete
rm -f "$ROOT/public/editor/scratch-gui.js" "$ROOT/public/editor/scratch-gui.js.LICENSE.txt"
rm -rf "$ROOT/public/editor/chunks/mediapipe"
cp "$WORK/LICENSE" "$ROOT/public/editor/LICENSE-scratch-editor-AGPL-3.0.txt"
echo "editor built: $(du -sh "$ROOT/public/editor" | cut -f1)"
