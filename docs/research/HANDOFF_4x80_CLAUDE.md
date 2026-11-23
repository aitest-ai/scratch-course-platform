# 給 Claude Code：四班 × 四次課（每次 80 分鐘）的 Scratch 除錯教育研究副本

> 2026-11-23｜**只開發獨立研究副本，不要改動 main 正式站與正式 Vercel 網址**。目前已有研究交接 ZIP（含教師私有題庫及答案）；**此公開 GitHub 文件不收錄測驗答案、學生個資或原版量表全文**。教師會將私有 ZIP 直接交給 Claude。

## 研究目標
國小五年級四班，四次課，每次 80 分鐘。主題保留「星光遊戲工作室」與真的 Scratch 編輯器，**簡化接水果**。研究焦點是**系統化除錯鷹架**能否改善學生的獨立除錯表現，而非比較遊戲外觀、3D 或講解時間。

優先採每班內分成 S（系統化除錯策略）與 G（一般除錯練習），分層隨機且固定配組；如果班內學生相互教學造成干擾，研究者需先重議分組，不得裝作獨立個體。四班皆使用相同故事、接單、規格卡、Scratch 起始檔、教學時間、三個除錯練習樣本、測驗與問卷。

### 兩組唯一差異
- **S**：「觀察實際現象與預期差異 → 推測原因 → 點選可疑積木 → 只改一個重點 → 執行測試並確認」。提示只能引導策略，不得直接說答案。
- **G**：同樣故障程式與練習時間，提供中性的一般操作提醒、同等可重試次數；不顯示上述策略步驟。不可刻意限制 G 組正常取得的教師技術協助。
- 第 3 次課「介入」期間才分流；第 3 次前測與第 4 次後測／遷移測驗**全部無策略提示**，兩組 UI 必須一致。

### 教案與時間
| 節次 | 內容 | 分鐘合計 |
|---|---|---|
| L1 | 背景／前問卷10、精簡導覽15、Scratch共同教學30、需求分析25 | 80 |
| L2 | 複習10、接水果基本實作50、共同檢核15、存檔5 | 80 |
| L3 | 複習10、**獨立除錯前測20**、共同說明10、**介入30**、存檔10 | 80 |
| L4 | **獨立除錯後測30**、新情境「躲隕石」近遷移20、後問卷15、作品分享15 | 80 |

### 課程精簡
「接水果」必做四項：籃子左右移動、單顆水果下落、碰到籃子加 1 分、掉到地面或接住後回到上方重複下落。**不要強迫分身、炸彈、生命、加速**。現有開幕導覽中，四款迷你遊戲全試玩、四組規格卡、Bug怪示範可刪減／改成選修，避免共同導覽提早教到 S 組專屬策略。保留 3D 場景、客人、客製素材，但不要讓這些阻礙新手學程式。

### 測驗與問卷
- Scratch 除錯題 Form A、Form B，每份三題（方向／座標、碰撞計分、掉落物重設），每題 6 分：錯誤定位0–2、原因解釋0–1、修正0–2、再次驗證0–1；前後測 AB/BA 順序平衡。另有「躲隕石」近遷移一題 6 分。
- 教師私有題庫包含故障積木、正確積木、期待的執行結果、學生題幹、評分細項與問卷，**不得加入公開 repo、前端 JS 或公開 Blob**。請由教師私下交付，Claude 匯入僅限權限保護的開發環境。
- 課前／後：ESCAS 原英文 C1–C6 自信、I1–I5 興趣之繁體中文**工作譯本**（不是已驗證臺灣版）及研究者自編除錯自效四題。第四次另有系統使用體驗問卷，量表非主要成效。
- 不把自動偵測某種積木存在當成已經學會除錯；要實際執行 Scratch 專案，保留人工盲評及信度查核。

### 技術、資料與倫理
- 原系統：`public/intro.html`, `public/order1.html`, `public/editor/`, `public/teacher.html`，Node serverless API，Vercel Blob。**避免覆蓋式存檔**。
- 研究資料用匿名 `study_id`，伺服器端固定 `condition`, `form_order`; 需記錄細粒度 `task_opened/project_run/block_selected/edit_applied/hint_requested/verification_run/task_submitted`、timestamps、作答原因、分項成績、有限份的關鍵 .sb3 前後版本。
- 防止公開 Blob 洩漏學生資料，改為具權限檢查的儲存與教師匯出；不得將姓名、學號、帳密、題目答案放在公開前端或 repository。
- 必須有家長／學生知情同意與依研究單位規範辦理必要倫理審查；未取得程序完成的研究資料不得宣稱為正式研究。預試非研究對象，確認時長、題目難度、問卷理解與網路故障備援。
- 老師後台匯出匿名 CSV（students, assignments, events, responses, scores, snapshots_manifest, data_dictionary），每題保留四部分分數，供日後 R 分析。

## 驗收：請 Claude 開發與測試
- [ ] 研究專用 branch 與獨立 Vercel Preview/Project，原 main 正式站不變。
- [ ] 四班內分組固定、兩組內容除了鷹架完全相同。
- [ ] L1–L4 任務不超過 80 分鐘，初學者真正能獨立完成核心功能。
- [ ] Form A/B、AB/BA 與遷移題正常載入真正的 .sb3，能修、能試玩、能判分。
- [ ] 前後測無答案提示／無互相曝光；教師題庫不公開。
- [ ] 事件與作品快照不因換電腦或重新登入遺失。
- [ ] 提供系統截圖、測試報告、匿名 CSV 範例、資料字典、部署與安全說明。
- [ ] **實施正式施測前先請教師核定研究設計與預試結果**。


### 2025 年新增：中文版 ESCAS Q1 驗證（不可混用正式原題與工作譯本）
Zhang, S., & Wong, G. K. W. (2025). *Elementary student coding attitudes survey for Chinese students: Scale adaptation and exploration of influencing factors of children’s coding attitudes*. *Educational Technology Research and Development, 73*, 3597–3625. https://doi.org/10.1007/s11423-025-10529-3。研究以中國北方 1,539 名國小三至六年級學生建立 22 題、五向度中文 ESCAS，期刊 Q1。**出版社全文需訂閱，目前尚未取得或核對完整 22 題中文版題文及附錄**，因此研究工具 ZIP 的 C1–C6／I1–I5 僅為源自 Mason & Rich (2020) 的繁體中文**工作譯稿**，不是 Zhang & Wong 已驗證中文版；在取得正式題文、授權及臺灣語境檢核前請勿混稱。詳見研究交接 ZIP 的文獻說明。典藏摘要：https://hub.hku.hk/handle/10722/357860 。

## 重要文獻與效度界線
- Mason & Rich (2020), ESCAS, *Computers & Education*：https://doi.org/10.1016/j.compedu.2020.103898 。完整英文原問卷：https://iacomputinged.org/wp-content/uploads/Instruments/Computing/PDF/Elementary%20Student%20Coding%20Attitudes%20Survey.pdf 。
- Chen & Huang (2024), Scratch 找錯3分＋修正4分之發表方法，*International Journal of STEM Education*：https://doi.org/10.1186/s40594-024-00495-2 （未找到全套試題公開附件）。
- Hutchison et al. (2025), *Journal of Computer Assisted Learning*：https://doi.org/10.1111/jcal.13115 ；網頁列有 Appendix A ESCAS、Appendix B ACES，連結存取受限，**未實際取得其附錄檔案**。
- ACES 原作者資源：https://www.computingandaiforall.org/resources.html （主要測順序／迴圈，**不是專門的除錯能力測驗**）。
- 必須區分「已驗證原英文量表」「中文工作譯本」「研究者自編除錯題本」；不得宣稱後兩者已具有既定信效度。
