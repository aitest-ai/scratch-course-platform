// 講解插圖：老闆邊說話邊顯示在對話框上方（右側）。showPic(key) / hidePic()
const S = (body) => `<svg viewBox="0 0 400 230" xmlns="http://www.w3.org/2000/svg" font-family="'Noto Sans TC','Microsoft JhengHei',sans-serif" font-weight="700">${body}</svg>`;
const box = (x, y, w, h, fill, stroke = '#2b2358') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
const t = (x, y, s, size = 16, fill = '#2b2358', anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;
const arrow = (x1, y1, x2, y2, c = '#e8883a') => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M${x2} ${y2} l-9 -6 M${x2} ${y2} l-9 6" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
const block = (x, y, w, label, fill) => `<path d="M${x} ${y} h14 q6 8 12 0 h${w - 26} v30 h-${w - 26} q-6 8 -12 0 h-14z" fill="${fill}" stroke="#2b2358" stroke-width="2.5"/>${t(x + w / 2, y + 22, label, 14, '#fff')}`;

export const PICS = {
  // 玩別人的遊戲 vs 自己做遊戲
  rules: S(`
${box(10, 14, 180, 202, '#eef0ff')}${t(100, 40, '玩別人的遊戲', 17)}
<rect x="52" y="62" width="96" height="62" rx="8" fill="#23203f"/><circle cx="86" cy="94" r="12" fill="#e8483a"/><path d="M110 94 h22 M121 83 v22" stroke="#7dff7d" stroke-width="5"/>
${t(100, 154, '規則：別人訂好的', 14, '#6a5a8a')}<text x="100" y="188" font-size="30" text-anchor="middle">🔒</text>
${arrow(196, 115, 214, 115)}
${box(210, 14, 180, 202, '#fff7dc', '#e8883a')}${t(300, 40, '自己做遊戲', 17, '#b8580a')}
${t(236, 72, '蘋果掉多快', 13, '#2b2358', 'start')}<rect x="236" y="78" width="130" height="8" rx="4" fill="#ddd"/><rect x="236" y="78" width="86" height="8" rx="4" fill="#e8483a"/><circle cx="322" cy="82" r="8" fill="#fff" stroke="#2b2358" stroke-width="3"/>
${t(236, 112, '怪物長什麼樣', 13, '#2b2358', 'start')}<circle cx="262" cy="132" r="14" fill="#4fb84f"/><circle cx="300" cy="132" r="14" fill="#d65db1"/><circle cx="338" cy="132" r="14" fill="#ffc83d"/>
${t(236, 172, '幾條命', 13, '#2b2358', 'start')}<text x="290" y="174" font-size="20" fill="#e8483a">♥ ♥ ♥</text>
${t(300, 202, '規則我說了算！', 14, '#b8580a')}`),
  // Bug：找出來修好
  bug: S(`
${box(10, 14, 118, 200, '#fff0f0', '#e8483a')}${t(69, 40, '出現 Bug', 16, '#c0392b')}
<circle cx="52" cy="82" r="13" fill="#e8483a"/><path d="M52 69 q6 -8 10 -8" stroke="#3a7a2a" stroke-width="3" fill="none"/>
<path d="M30 150 l-6 -30 h90 l-6 30z" fill="#c98a4b" stroke="#2b2358" stroke-width="2.5"/><path d="M52 95 v50" stroke="#e8483a" stroke-width="3" stroke-dasharray="4 5"/>${t(69, 182, '蘋果穿過籃子？！', 12, '#c0392b')}
${arrow(132, 114, 150, 114)}
${box(146, 14, 118, 200, '#eef7ff', '#2f7fb8')}${t(205, 40, '找原因', 16, '#1f5f8f')}
<circle cx="190" cy="104" r="26" fill="#fff" stroke="#2f7fb8" stroke-width="5"/><path d="M209 123 l22 24" stroke="#2f7fb8" stroke-width="7" stroke-linecap="round"/>
${block(172, 90, 62, '碰到？', '#3fb87a')}${t(205, 182, '哪一塊積木怪怪的？', 12, '#1f5f8f')}
${arrow(268, 114, 286, 114)}
${box(282, 14, 108, 200, '#effaf0', '#3fb87a')}${t(336, 40, '修好', 16, '#237a4a')}
<text x="336" y="122" font-size="54" text-anchor="middle">✅</text>${t(336, 182, '工程師每天做的事', 12, '#237a4a')}`),
  // 積木想法到處能用
  blocks: S(`
${t(90, 28, '你學的積木', 16)}
${block(20, 44, 140, '變數', '#ff8c1a')}${block(20, 92, 140, '重複 迴圈', '#ffab19')}${block(20, 140, 140, '如果…就…', '#4c97ff')}
${arrow(170, 114, 214, 70)}${arrow(170, 114, 214, 160)}
${box(220, 28, 170, 76, '#eef0ff')}<rect x="262" y="40" width="30" height="48" rx="6" fill="#23203f"/><rect x="266" y="46" width="22" height="30" fill="#38e1ff"/>${t(334, 62, '手機遊戲', 15)}${t(334, 82, '用的是同一套想法', 11, '#6a5a8a')}
${box(220, 124, 170, 76, '#fff7dc', '#e8883a')}${t(255, 160, 'py', 26, '#3b7fe0')}${t(334, 154, 'Python 程式', 15)}${t(334, 176, '也是同一套想法', 11, '#6a5a8a')}`),
  // 金幣升級、遊戲上街機
  reward: S(`
${box(10, 14, 120, 200, '#fff7dc', '#e8883a')}${t(70, 40, '做完訂單', 16, '#b8580a')}
<circle cx="70" cy="104" r="30" fill="#ffc83d" stroke="#b8580a" stroke-width="4"/>${t(70, 114, '＄', 30, '#b8580a')}${t(70, 168, '賺金幣', 15, '#b8580a')}${t(70, 192, '升級工作室', 12, '#6a5a8a')}
${arrow(136, 114, 156, 114)}
${box(152, 14, 238, 200, '#eef0ff')}${t(271, 40, '遊戲上真正的街機', 16)}
<rect x="196" y="56" width="70" height="140" rx="8" fill="#6a55ff" stroke="#2b2358" stroke-width="3"/><rect x="206" y="68" width="50" height="40" rx="4" fill="#0a0a22"/><text x="231" y="94" font-size="14" text-anchor="middle" fill="#ffc83d">GO!</text><circle cx="224" cy="128" r="5" fill="#ff5a8a"/><path d="M224 128 v10" stroke="#ff5a8a" stroke-width="3"/>
<rect x="212" y="158" width="38" height="8" rx="3" fill="#0a0a22"/>
<rect x="150" y="146" width="44" height="26" rx="4" fill="#4fb84f" stroke="#2b2358" stroke-width="2.5"/>${arrow(196, 159, 212, 159, '#4fb84f')}
${t(331, 100, '客人用', 15)}${t(331, 124, '搖桿親自玩', 15)}<text x="331" y="168" font-size="34" text-anchor="middle">🕹️</text>`),
  // 接單流程
  flow: S(`
${box(8, 70, 84, 90, '#fff7dc', '#e8883a')}${t(50, 100, '客人', 15, '#b8580a')}${t(50, 120, '提需求', 15, '#b8580a')}${t(50, 146, '📋', 22)}
${arrow(94, 115, 108, 115)}
${box(104, 70, 84, 90, '#eef0ff')}${t(146, 100, '在工作台', 15)}${t(146, 120, '做遊戲', 15)}${t(146, 146, '🧩', 22)}
${arrow(190, 115, 204, 115)}
${box(200, 70, 84, 90, '#effaf0', '#3fb87a')}${t(242, 100, '交貨', 15, '#237a4a')}${t(242, 120, '客人檢查', 15, '#237a4a')}${t(242, 146, '✔', 22, '#237a4a')}
${arrow(286, 115, 300, 115)}
${box(296, 70, 96, 90, '#f3eaff', '#9b59d0')}${t(344, 100, '插上街機', 15, '#6a2fa8')}${t(344, 120, '拿金幣', 15, '#6a2fa8')}${t(344, 146, '🕹️', 22)}
${t(200, 40, '每一張訂單的流程', 17)}${t(200, 196, '做出一個「真的能玩」的遊戲', 14, '#6a5a8a')}`)
};

let el = null;
function ensure() {
  if (el) return el;
  el = document.createElement('div'); el.id = 'dlgimg'; el.hidden = true; document.body.append(el);
  const st = document.createElement('style');
  st.textContent = '#dlgimg{position:fixed;right:min(4vw,60px);bottom:min(230px,30vh);z-index:8;width:min(440px,44vw);background:#fffdf6;border:4px solid #5b4fd0;border-radius:18px;box-shadow:0 0 0 3px #1d1840,0 8px 28px #0009;padding:10px;animation:picin .3s ease-out;pointer-events:none}#dlgimg[hidden]{display:none}#dlgimg svg{display:block;width:100%;height:auto}@keyframes picin{from{opacity:0;transform:translateY(14px)}to{opacity:1}}@media(max-width:760px){#dlgimg{left:50%;right:auto;transform:translateX(-50%);width:min(92vw,420px);bottom:min(210px,28vh)}}';
  document.head.append(st); return el;
}
export function showPic(key) { const e = ensure(); if (key && PICS[key]) { if (e.dataset.k !== key) { e.innerHTML = PICS[key]; e.dataset.k = key; e.hidden = false; e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; } else e.hidden = false; } else hidePic(); }
export function hidePic() { if (el) { el.hidden = true; el.dataset.k = ''; } }
