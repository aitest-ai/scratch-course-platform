// 開幕導覽用的四款迷你示範小遊戲（480x360 畫布）。每款約 20~30 秒，結束時呼叫 onEnd(分數文字)。
const W = 480, H = 360;
const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
const rnd = (a, b) => a + Math.random() * (b - a);

function frame(cv, tick, onKey) {
  const g = cv.getContext('2d'); let on = true, id = null;
  const keys = {};
  const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0 || e.key === ' ') e.preventDefault(); onKey && onKey(e.key); };
  const ku = e => { keys[e.key] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const loop = () => { if (!on) return; tick(g, keys); id = setTimeout(loop, 33); };
  loop();
  return () => { on = false; clearTimeout(id); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
}
function banner(g, text, sub) {
  g.fillStyle = 'rgba(20,18,56,.88)'; g.fillRect(90, 120, 300, 120);
  g.fillStyle = '#ffc83d'; g.font = `bold 38px ${FONT}`; g.textAlign = 'center'; g.fillText(text, 240, 175);
  g.fillStyle = '#fff'; g.font = `18px ${FONT}`; g.fillText(sub, 240, 210);
}
function hud(g, life, score, extra) {
  g.textAlign = 'left'; g.fillStyle = '#e8483a'; g.font = '24px sans-serif'; if (life != null) g.fillText('♥'.repeat(Math.max(0, life)), 10, 28);
  g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = `bold 20px ${FONT}`; g.fillText((extra || '分數') + ' ' + score, 470, 28);
}

export const GAMES = {
  // 接東西：← → 移動籃子
  catch(cv, onEnd) {
    const s = {bx: 240, items: [], t: 0, life: 3, score: 0, spd: 5, over: false};
    return frame(cv, (g, k) => {
      if (s.over) return;
      s.t++;
      if (k.ArrowLeft) s.bx = Math.max(45, s.bx - 7); if (k.ArrowRight) s.bx = Math.min(435, s.bx + 7);
      if (s.t % 26 === 0) s.items.push({x: rnd(30, 450), y: -20, bomb: false});
      if (s.t % 80 === 0) s.items.push({x: rnd(30, 450), y: -20, bomb: true});
      s.items.forEach(i => { i.y += s.spd * .8; });
      s.items = s.items.filter(i => {
        if (i.y > 285 && i.y < 335 && Math.abs(i.x - s.bx) < 50) { if (i.bomb) s.life--; else { s.score++; if (s.score % 5 === 0) s.spd++; } return false; }
        if (i.y > 350) { if (!i.bomb) s.life--; return false; }
        return true;
      });
      g.fillStyle = '#bfe3ff'; g.fillRect(0, 0, W, H); g.fillStyle = '#7cc27c'; g.fillRect(0, 335, W, 25);
      s.items.forEach(i => { g.fillStyle = i.bomb ? '#2b2b33' : '#e8483a'; g.beginPath(); g.arc(i.x, i.y, 18, 0, 7); g.fill(); if (!i.bomb) { g.fillStyle = '#3fa34d'; g.fillRect(i.x - 2, i.y - 26, 4, 9); } else { g.fillStyle = '#ffb300'; g.fillRect(i.x + 6, i.y - 26, 5, 8); } });
      g.fillStyle = '#c98a4b'; g.beginPath(); g.moveTo(s.bx - 45, 300); g.lineTo(s.bx + 45, 300); g.lineTo(s.bx + 36, 348); g.lineTo(s.bx - 36, 348); g.fill();
      hud(g, s.life, s.score);
      if (s.life <= 0) { s.over = true; banner(g, '遊戲結束', `接到 ${s.score} 顆`); onEnd(`接到 ${s.score} 顆`); }
    });
  },

  // 切水果：滑鼠劃過水果
  slice(cv, onEnd) {
    const s = {items: [], t: 0, score: 0, miss: 3, over: false, trail: [], mx: -99, my: -99};
    const rect = () => cv.getBoundingClientRect();
    const move = e => { const r = rect(); s.mx = (e.clientX - r.left) * W / r.width; s.my = (e.clientY - r.top) * H / r.height; s.trail.push({x: s.mx, y: s.my, a: 1}); if (s.trail.length > 14) s.trail.shift(); };
    cv.addEventListener('pointermove', move);
    const stop = frame(cv, g => {
      if (s.over) return;
      s.t++;
      if (s.t % 28 === 0) { const x = rnd(80, 400); s.items.push({x, y: H + 20, vx: rnd(-2, 2) + (240 - x) / 120, vy: rnd(-15, -11), bomb: Math.random() < .2, cut: false, c: ['#e8483a', '#f29c1f', '#7ed957', '#d65db1'][Math.floor(rnd(0, 4))]}); }
      s.items.forEach(i => { i.x += i.vx; i.y += i.vy; i.vy += .38; });
      s.items.forEach(i => { if (!i.cut && Math.hypot(i.x - s.mx, i.y - s.my) < 30 && s.trail.length > 3) { i.cut = true; if (i.bomb) s.miss--; else s.score++; } });
      s.items = s.items.filter(i => { if (i.y > H + 40 && i.vy > 0) { if (!i.cut && !i.bomb) s.miss--; return false; } return !(i.cut && i.y > H + 60); });
      g.fillStyle = '#2b2350'; g.fillRect(0, 0, W, H);
      s.items.forEach(i => {
        g.fillStyle = i.bomb ? '#111' : i.c; g.beginPath();
        if (i.cut) { g.arc(i.x - 10, i.y, 18, 0, 7); g.fill(); g.beginPath(); g.arc(i.x + 10, i.y + 4, 18, 0, 7); } else g.arc(i.x, i.y, 22, 0, 7);
        g.fill(); if (i.bomb && !i.cut) { g.fillStyle = '#ffb300'; g.fillRect(i.x + 8, i.y - 28, 5, 9); }
      });
      g.lineCap = 'round'; for (let k = 1; k < s.trail.length; k++) { g.strokeStyle = `rgba(255,255,255,${k / s.trail.length})`; g.lineWidth = k / 2; g.beginPath(); g.moveTo(s.trail[k - 1].x, s.trail[k - 1].y); g.lineTo(s.trail[k].x, s.trail[k].y); g.stroke(); }
      if (s.t % 2 === 0 && s.trail.length) s.trail.shift();
      hud(g, s.miss, s.score);
      if (s.miss <= 0) { s.over = true; banner(g, '遊戲結束', `切到 ${s.score} 個`); onEnd(`切到 ${s.score} 個`); }
    });
    return () => { stop(); cv.removeEventListener('pointermove', move); };
  },

  // 躲隕石：方向鍵閃避
  dodge(cv, onEnd) {
    const s = {x: 240, y: 300, rocks: [], t: 0, life: 3, inv: 0, over: false};
    return frame(cv, (g, k) => {
      if (s.over) return;
      s.t++; if (s.inv > 0) s.inv--;
      if (k.ArrowLeft) s.x = Math.max(20, s.x - 6); if (k.ArrowRight) s.x = Math.min(460, s.x + 6);
      if (k.ArrowUp) s.y = Math.max(200, s.y - 5); if (k.ArrowDown) s.y = Math.min(335, s.y + 5);
      if (s.t % Math.max(10, 24 - Math.floor(s.t / 120)) === 0) s.rocks.push({x: rnd(20, 460), y: -30, r: rnd(14, 26), v: rnd(3, 5) + s.t / 400});
      s.rocks.forEach(r => { r.y += r.v; });
      s.rocks = s.rocks.filter(r => { if (!s.inv && Math.hypot(r.x - s.x, r.y - s.y) < r.r + 12) { s.life--; s.inv = 45; return false; } return r.y < H + 40; });
      g.fillStyle = '#0b1030'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { g.fillStyle = '#fff4'; g.fillRect((i * 97 + s.t * (1 + i % 3)) % W, (i * 53 + s.t * (1 + i % 3) * 2) % H, 2, 2); }
      s.rocks.forEach(r => { g.fillStyle = '#8a7060'; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 7); g.fill(); g.fillStyle = '#5a4636'; g.beginPath(); g.arc(r.x - r.r / 3, r.y - r.r / 4, r.r / 4, 0, 7); g.fill(); });
      if (!(s.inv && s.t % 6 < 3)) { g.fillStyle = '#38e1ff'; g.beginPath(); g.moveTo(s.x, s.y - 16); g.lineTo(s.x + 14, s.y + 14); g.lineTo(s.x - 14, s.y + 14); g.fill(); }
      hud(g, s.life, Math.floor(s.t / 30), '存活秒數');
      if (s.life <= 0) { s.over = true; banner(g, '被撞到了', `撐了 ${Math.floor(s.t / 30)} 秒`); onEnd(`撐了 ${Math.floor(s.t / 30)} 秒`); }
    });
  },

  // 打怪：← → 移動，空白鍵發射
  fight(cv, onEnd) {
    const s = {x: 240, bullets: [], mons: [], t: 0, life: 3, score: 0, cd: 0, over: false};
    return frame(cv, (g, k) => {
      if (s.over) return;
      s.t++; if (s.cd > 0) s.cd--;
      if (k.ArrowLeft) s.x = Math.max(24, s.x - 6); if (k.ArrowRight) s.x = Math.min(456, s.x + 6);
      if (k[' '] && s.cd === 0) { s.bullets.push({x: s.x, y: 310}); s.cd = 10; }
      if (s.t % 40 === 0) s.mons.push({x: rnd(30, 450), y: -20, v: rnd(1.2, 2.2), hp: 2});
      s.bullets.forEach(b => { b.y -= 9; });
      s.mons.forEach(m => { m.y += m.v; });
      s.mons = s.mons.filter(m => {
        for (const b of s.bullets) if (Math.abs(b.x - m.x) < 22 && Math.abs(b.y - m.y) < 22) { b.y = -99; m.hp--; if (m.hp <= 0) { s.score++; return false; } }
        if (m.y > 330) { s.life--; return false; }
        return true;
      });
      s.bullets = s.bullets.filter(b => b.y > -10);
      g.fillStyle = '#1c1240'; g.fillRect(0, 0, W, H);
      s.mons.forEach(m => { g.fillStyle = m.hp > 1 ? '#9b59d0' : '#d65db1'; g.beginPath(); g.arc(m.x, m.y, 20, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(m.x - 7, m.y - 3, 5, 0, 7); g.arc(m.x + 7, m.y - 3, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.fillRect(m.x - 8, m.y - 4, 3, 3); g.fillRect(m.x + 6, m.y - 4, 3, 3); });
      g.fillStyle = '#ffc83d'; s.bullets.forEach(b => g.fillRect(b.x - 2, b.y - 8, 4, 14));
      g.fillStyle = '#38e1ff'; g.beginPath(); g.moveTo(s.x, 306); g.lineTo(s.x + 18, 340); g.lineTo(s.x - 18, 340); g.fill();
      hud(g, s.life, s.score, '擊倒');
      if (s.life <= 0) { s.over = true; banner(g, '基地被攻破', `擊倒 ${s.score} 隻`); onEnd(`擊倒 ${s.score} 隻`); }
    });
  }
};

export const META = {
  catch: {title: '接東西', color: '#e8483a', tip: '← → 移動籃子。接蘋果得分，躲開炸彈，三條命。', recipe: {player: '用鍵盤左右移動的籃子', things: '掉下來的蘋果和炸彈', rule: '接到蘋果加分、碰到炸彈或漏接少一條命', end: '三條命用完就結束'}, blocks: ['按下 ← → 鍵', 'x 改變', '建立分身', '變數：分數、生命']},
  slice: {title: '切水果', color: '#3fb87a', tip: '滑鼠劃過水果就切開。別碰炸彈，漏掉水果會少一條命。', recipe: {player: '滑鼠的刀光', things: '飛起來又掉下去的水果和炸彈', rule: '劃過水果加分、劃到炸彈或漏掉水果少一次機會', end: '機會用完就結束'}, blocks: ['滑鼠的 x、y 座標', '碰到 滑鼠指標？', '隨機選一個數', '重力：y 速度一直減少']},
  dodge: {title: '躲隕石', color: '#3b7fe0', tip: '方向鍵移動小飛船，躲開掉下來的隕石，越久越難。', recipe: {player: '用方向鍵控制的飛船', things: '越來越多、越來越快的隕石', rule: '被撞到少一條命，撐越久越好', end: '三條命用完就結束'}, blocks: ['上下左右四個方向鍵', '碰到 隕石？', '等待多久才再來一顆', '計時器：撐了幾秒']},
  fight: {title: '打怪', color: '#9b59d0', tip: '← → 移動，空白鍵發射。怪物走到底部會少一條命。', recipe: {player: '會發射子彈的飛船', things: '一直往下走的怪物（要打兩下）', rule: '子彈打中怪物扣血、打倒得分、怪物走到底少一條命', end: '三條命用完就結束'}, blocks: ['按下 空白鍵', '建立 子彈 的分身', '廣播與接收廣播', '怪物的血量變數']}
};
