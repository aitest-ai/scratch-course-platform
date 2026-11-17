// 「試玩員回報的 Bug」示範影片：用 canvas 即時播放有問題的遊戲畫面（fixed=true 播修好後的樣子）
const W = 420, H = 250, GY = 214;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
function scene(g, score, lives, extra) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#bfe6ff'); bg.addColorStop(1, '#eaf7ff'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7bc05a'; g.fillRect(0, GY + 22, W, H - GY); g.fillStyle = '#5a9a3e'; g.fillRect(0, GY + 22, W, 4);
  g.fillStyle = '#2b2358'; g.font = '700 16px sans-serif'; g.textAlign = 'left'; g.fillText('分數：' + score, 10, 24);
  g.textAlign = 'right'; g.fillText(lives == null ? '' : '生命：' + '♥'.repeat(lives), W - 10, 24);
  if (extra) { g.textAlign = 'center'; g.fillText(extra, W / 2, 24); }
}
function basket(g, x) { g.fillStyle = '#c98a4b'; g.beginPath(); g.moveTo(x - 36, GY); g.lineTo(x + 36, GY); g.lineTo(x + 26, GY + 24); g.lineTo(x - 26, GY + 24); g.fill(); g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.stroke(); }
function apple(g, x, y) { g.fillStyle = '#e8483a'; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.strokeStyle = '#3a7a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 4, y - 20); g.stroke(); }
function bomb(g, x, y) { g.fillStyle = '#23203f'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.strokeStyle = '#ffc83d'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 6, y - 12); g.lineTo(x + 12, y - 20); g.stroke(); g.fillStyle = '#ff9a2a'; g.beginPath(); g.arc(x + 13, y - 21, 3, 0, 7); g.fill(); }
const pop = (g, x, y, s, c) => { g.fillStyle = c; g.font = '900 20px sans-serif'; g.textAlign = 'center'; g.fillText(s, x, y); };

const DEMOS = {
  // 籃子一直往右跑，跑出畫面
  fly: (g, t, fixed) => {
    const p = (t % 6) / 6; let x = 60 + p * 520; if (fixed) x = Math.min(x, W - 40);
    scene(g, 0, 3); basket(g, x); g.fillStyle = '#2b2358'; g.font = '700 14px sans-serif'; g.textAlign = 'center';
    g.fillText(fixed ? '→ 按住右鍵：籃子停在邊界' : '→ 按住右鍵：籃子一直跑……', W / 2, 60);
    if (!fixed && x > W + 20) pop(g, W / 2, 120, '籃子不見了！', '#c0392b');
  },
  // 接到蘋果，分數不會加
  score: (g, t, fixed) => {
    const T = 3, ph = t % T, round = Math.floor(t / T); const y = 20 + ph * 72, hit = y >= GY - 20;
    const sc = fixed ? round + (hit ? 1 : 0) : 0;
    scene(g, sc, 3); basket(g, 210);
    if (!hit) apple(g, 210, y); else { pop(g, 210, GY - 36, fixed ? '+1' : '接到了！', fixed ? '#1f8a4a' : '#e8883a'); if (!fixed) pop(g, 210, GY - 62, '分數還是 0？', '#c0392b'); }
  },
  // 蘋果掉到地板不會消失，越堆越多
  pile: (g, t, fixed) => {
    const N = 7, T = 12, tt = t % T; const apples = [];
    for (let i = 0; i < Math.floor(tt / 0.8); i++) { const age = tt - i * 0.8, x = 40 + (i * 53) % 340, y = Math.min(GY + 8, 20 + age * 120); if (fixed && y >= GY + 8) continue; apples.push([x, y]); }
    scene(g, 0, 3, '分身數量：' + apples.length); apples.forEach(([x, y]) => apple(g, x, y)); basket(g, 210);
    if (!fixed && apples.length > 8) pop(g, W / 2, 80, '越來越卡……', '#c0392b');
  },
  // 炸彈碰到籃子，生命沒減少
  bomb: (g, t, fixed) => {
    const T = 3, ph = t % T, round = Math.floor(t / T); const y = 20 + ph * 72, hit = y >= GY - 20;
    const lives = fixed ? Math.max(0, 3 - round % 3 - (hit ? 1 : 0)) : 3;
    scene(g, 0, lives); basket(g, 210);
    if (!hit) bomb(g, 210, y); else { pop(g, 210, GY - 36, '轟！', '#c0392b'); if (!fixed) pop(g, 210, GY - 62, '生命還是 3 顆？', '#c0392b'); }
  }
};

export function startDemo(cv, kind, fixed = false) {
  cv.width = W; cv.height = H; const g = cv.getContext('2d'); let on = true; const t0 = performance.now();
  (function loop() { if (!on) return; DEMOS[kind](g, (performance.now() - t0) / 1000, fixed); requestAnimationFrame(loop); })();
  return () => { on = false; };
}
