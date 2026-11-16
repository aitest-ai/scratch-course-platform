# 忍者道場（scratch-course-platform）

國小五年級 Scratch 遊戲製作課的學習平臺：學生在同一個頁面裡看工序卡、做遊戲、被即時檢查，老師在後臺看到每位學生的企劃、作品與分數。

## 授權與來源（請務必閱讀）

- 本專案內嵌的 Scratch 編輯器來自 [scratchfoundation/scratch-editor](https://github.com/scratchfoundation/scratch-editor)，授權為 **AGPL-3.0**。我們**不修改**上游原始碼，固定使用 commit `ee8bd63153def348c3e481220589f47089050960`，建置方式見 `scripts/build-editor.sh`。
- 本專案本身也以 AGPL-3.0 公開（見 `LICENSE`），網站頁尾提供原始碼連結。
- Scratch 的名稱、標誌與貓咪角色是 Scratch Foundation 的商標，**本專案不使用**這些標誌，也不以此為本站背書或宣傳。

## 目前進度

原型（`public/play.html`）：左邊是道場、右邊是嵌入的編輯器。已驗證：

1. 讀得到作品的執行狀態（即時顯示場上分身數量）。
2. 用白話檢查作品（有無「刪除這個分身」、計分變數是否共用等）。
3. 把自己拼的 SVG 素材直接加進目前的角色。

## 本機開發

```bash
bash scripts/build-editor.sh          # 建置編輯器到 public/editor（約 5 分鐘，需要 Node 與 8 GB 記憶體）
python3 scripts/dev-server.py 8603    # 本機伺服器，套用與 vercel.json 相同的網址改寫
# 開啟 http://localhost:8603/play.html
```

## 部署

Vercel 連接此倉庫，推到 `main` 即自動部署（`vercel.json` 的 `buildCommand` 會建置編輯器）。不使用 GitHub Actions。

設計說明見 [`docs/SPEC.md`](docs/SPEC.md)。
