// 開幕導覽用的四款迷你示範小遊戲（480x360 畫布）。每款約 20~40 秒，結束時呼叫 onEnd(分數文字)。
// 共用「遊戲手感」：開場 3-2-1 倒數、粒子、畫面震動、浮動分數、音效、結算星星。
const W = 480, H = 360;
const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- 音效（WebAudio 合成，不需要音檔） ---------- */
let ac = null, muted = false;
export const setMuted = v => { muted = v; };
export const isMuted = () => muted;
function tone(f0, f1, dur, type = 'sine', vol = .12, delay = 0) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = ac || new AC(); if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  } catch (e) { /* 沒有聲音也能玩 */ }
}
export function sfx(n) {
  if (muted) return;
  switch (n) {
    case 'good': tone(660, 990, .12, 'sine', .14); break;
    case 'combo': tone(880, 1320, .1, 'triangle', .14); tone(1320, 1760, .12, 'triangle', .12, .08); break;
    case 'bad': tone(220, 70, .3, 'sawtooth', .13); break;
    case 'boom': tone(140, 35, .4, 'sawtooth', .18); tone(90, 30, .35, 'square', .08); break;
    case 'shoot': tone(900, 260, .09, 'square', .06); break;
    case 'hit': tone(300, 120, .08, 'square', .08); break;
    case 'slice': tone(1400, 300, .1, 'sawtooth', .06); break;
    case 'tick': tone(520, 520, .08, 'square', .06); break;
    case 'go': tone(520, 1040, .25, 'square', .1); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .16, 'triangle', .13, i * .1)); break;
    case 'over': [440, 349, 262].forEach((f, i) => tone(f, f * .96, .22, 'triangle', .13, i * .16)); break;
    case 'right': tone(700, 1050, .1, 'sine', .12); tone(1050, 1400, .12, 'sine', .1, .08); break;
    case 'wrong': tone(200, 140, .18, 'sawtooth', .08); break;
    case 'blip': tone(520 + Math.random() * 120, 520, .04, 'square', .035); break;
    case 'whoosh': tone(200, 1200, .25, 'sine', .06); break;
    case 'insert': tone(300, 80, .2, 'square', .1); tone(120, 60, .15, 'square', .1, .18); break;
    case 'boot': [392, 523, 659, 784].forEach((f, i) => tone(f, f, .12, 'square', .07, i * .09)); break;
    default: break;
  }
}

/* ---------- 特效：粒子、浮動字、震動 ---------- */
function makeFx() {
  const ps = [], fl = []; let amp = 0, stopped = false, flash = null;
  return {
    burst(x, y, c, n = 14, spd = 5) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), v = rnd(spd * .3, spd); ps.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, l: rnd(16, 30), m: 30, c, r: rnd(2, 5)}); } },
    pop(x, y, text, c = '#fff', size = 22) { fl.push({x, y, text, c, l: 34, size}); },
    shake(a) { amp = Math.max(amp, a); },
    flash(c) { flash = {c, a: .45}; },
    stop() { stopped = true; },
    get stopped() { return stopped; },
    offset() { if (amp < .3) { amp = 0; return [0, 0]; } const o = [rnd(-amp, amp), rnd(-amp, amp)]; amp *= .86; return o; },
    draw(g) {
      if (stopped) return;
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .22; p.l--; });
      for (let i = ps.length - 1; i >= 0; i--) if (ps[i].l <= 0) ps.splice(i, 1);
      ps.forEach(p => { g.globalAlpha = Math.max(0, p.l / p.m); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); });
      g.globalAlpha = 1;
      fl.forEach(f => { f.y -= 1.2; f.l--; });
      for (let i = fl.length - 1; i >= 0; i--) if (fl[i].l <= 0) fl.splice(i, 1);
      g.textAlign = 'center';
      fl.forEach(f => { g.globalAlpha = Math.min(1, f.l / 14); g.font = `900 ${f.size}px ${FONT}`; g.lineWidth = 5; g.strokeStyle = '#1d1840'; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.c; g.fillText(f.text, f.x, f.y); });
      g.globalAlpha = 1;
      if (flash) { g.fillStyle = flash.c; g.globalAlpha = flash.a; g.fillRect(0, 0, W, H); g.globalAlpha = 1; flash.a -= .06; if (flash.a <= 0) flash = null; }
    }
  };
}

function frame(cv, tick, onKey) {
  const g = cv.getContext('2d'); let on = true, id = null;
  const keys = {}, fx = makeFx();
  const kd = e => { if (!keys[e.key] && onKey) onKey(e.key); keys[e.key] = true; if (e.key.indexOf('Arrow') === 0 || e.key === ' ') e.preventDefault(); };
  const ku = e => { keys[e.key] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  let cd = 78, snap = null;
  const loop = () => {
    if (!on) return;
    if (cd > 0) {
      if (!snap) { tick(g, keys, fx, true); snap = g.getImageData(0, 0, cv.width, cv.height); } else g.putImageData(snap, 0, 0);
      const n = Math.ceil(cd / 20), ph = (cd % 20) / 20;
      g.fillStyle = 'rgba(15,12,50,.55)'; g.fillRect(0, 0, W, H);
      g.save(); g.translate(240, 180); g.scale(1 + ph * .5, 1 + ph * .5); g.globalAlpha = Math.min(1, ph * 2 + .3);
      g.textAlign = 'center'; g.font = `900 110px ${FONT}`; g.lineWidth = 10; g.strokeStyle = '#1d1840';
      const txt = n > 3 ? '準備！' : String(n); if (n > 3) g.font = `900 70px ${FONT}`;
      g.strokeText(txt, 0, 38); g.fillStyle = n > 3 ? '#fff' : ['#ff4fa3', '#ffc83d', '#38e1ff'][3 - n]; g.fillText(txt, 0, 38); g.restore();
      if (cd % 20 === 0) sfx(n > 3 ? 'whoosh' : 'tick');
      cd--; if (cd === 0) { sfx('go'); fx.pop(240, 180, 'GO!', '#7dff7d', 64); }
    } else {
      g.save(); const o = fx.offset(); g.translate(o[0], o[1]); tick(g, keys, fx, false); fx.draw(g); g.restore();
    }
    id = setTimeout(loop, 33);
  };
  loop();
  return () => { on = false; clearTimeout(id); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
}

/* ---------- 畫圖小工具 ---------- */
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function ball(g, x, y, r, c1, c2) { const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - r * .4, y - r * .45, r * .22, r * .13, -.6, 0, 7); g.fill(); }
function hearts(g, n, total = 3) { g.textAlign = 'left'; g.font = '26px sans-serif'; for (let i = 0; i < total; i++) { g.fillStyle = i < n ? '#ff4d5e' : 'rgba(255,255,255,.28)'; g.strokeStyle = '#1d1840'; g.lineWidth = 3; g.strokeText('♥', 10 + i * 28, 30); g.fillText('♥', 10 + i * 28, 30); } }
function score(g, label, v) { g.textAlign = 'right'; g.font = `900 22px ${FONT}`; g.lineWidth = 5; g.strokeStyle = '#1d1840'; const t = `${label} ${v}`; g.strokeText(t, 470, 30); g.fillStyle = '#fff'; g.fillText(t, 470, 30); }
function banner(g, text, sub, stars) {
  g.fillStyle = 'rgba(15,12,50,.82)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#251f6b'; rr(g, 80, 80, 320, 200, 20); g.fill(); g.lineWidth = 4; g.strokeStyle = '#ffc83d'; g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#ffc83d'; g.font = `900 36px ${FONT}`; g.fillText(text, 240, 132);
  g.fillStyle = '#fff'; g.font = `700 20px ${FONT}`; g.fillText(sub, 240, 170);
  g.font = '50px sans-serif';
  for (let i = 0; i < 3; i++) { g.fillStyle = i < stars ? '#ffc83d' : '#ffffff30'; g.strokeStyle = '#1d1840'; g.lineWidth = 4; g.strokeText('★', 168 + i * 72, 235); g.fillText('★', 168 + i * 72, 235); }
}
const starsOf = (v, a, b) => (v >= a ? 3 : v >= b ? 2 : 1);
const finish = (g, fx, title, sub, st, onEnd) => { fx.stop(); banner(g, title, sub, st); sfx(st >= 2 ? 'win' : 'over'); onEnd(`${sub}，拿到 ${'★'.repeat(st)}`); };

export const GAMES = {
  // 接東西：← → 移動籃子。hooks(name) 讓導覽的「拆開看」知道哪個積木該亮
  catch(cv, onEnd, hooks) {
    const hk = n => { hooks && hooks(n); };
    const s = {bx: 240, items: [], t: 0, life: 3, score: 0, spd: 5, over: false, combo: 0, sq: 0, clouds: [60, 210, 360]};
    return frame(cv, (g, k, fx, frozen) => {
      if (!s.over && !frozen) {
        s.t++;
        if (k.ArrowLeft) s.bx = Math.max(45, s.bx - 7); if (k.ArrowRight) s.bx = Math.min(435, s.bx + 7);
        if (s.t % 26 === 0) { s.items.push({x: rnd(30, 450), y: -20, bomb: false}); hk('clone'); }
        if (s.t % 80 === 0) { s.items.push({x: rnd(30, 450), y: -20, bomb: true}); hk('clone'); }
        s.items.forEach(i => { i.y += s.spd * .8; });
        s.items = s.items.filter(i => {
          if (i.y > 285 && i.y < 335 && Math.abs(i.x - s.bx) < 50) {
            s.sq = 1;
            if (i.bomb) { s.life--; s.combo = 0; fx.burst(i.x, i.y, '#ff9b2f', 22, 7); fx.burst(i.x, i.y, '#333', 12, 5); fx.shake(9); fx.flash('#ff5a3a'); fx.pop(i.x, i.y - 20, '-1 ♥', '#ff6a6a'); sfx('boom'); hk('bomb'); }
            else { s.score++; s.combo++; fx.burst(i.x, i.y, '#ff5a5a', 12, 5); fx.pop(i.x, i.y - 20, '+1', '#fff'); sfx('good'); hk('catch'); if (s.combo > 0 && s.combo % 5 === 0) { fx.pop(s.bx, 250, `連續 ${s.combo}！`, '#ffc83d', 28); sfx('combo'); } if (s.score % 5 === 0) { s.spd++; fx.pop(240, 110, '加速！', '#7dff7d', 34); hk('speed'); } }
            return false;
          }
          if (i.y > 350) { if (!i.bomb) { s.life--; s.combo = 0; fx.shake(5); fx.pop(i.x, 330, '漏掉了', '#ff9a9a'); sfx('bad'); hk('miss'); } return false; }
          return true;
        });
        s.sq *= .8;
      }
      // 背景
      const sky = g.createLinearGradient(0, 0, 0, 340); sky.addColorStop(0, '#6cc0ff'); sky.addColorStop(1, '#e2f5ff'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff3a8'; g.beginPath(); g.arc(405, 70, 34, 0, 7); g.fill(); g.fillStyle = '#fff3a855'; g.beginPath(); g.arc(405, 70, 52, 0, 7); g.fill();
      s.clouds = s.clouds.map(c => (c > 540 ? -80 : c + .3)); g.fillStyle = '#ffffffcc'; s.clouds.forEach((c, i) => { const y = 60 + i * 38; g.beginPath(); g.arc(c, y, 20, 0, 7); g.arc(c + 24, y + 4, 24, 0, 7); g.arc(c + 50, y, 18, 0, 7); g.fill(); });
      g.fillStyle = '#8fd48f'; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= W; x += 30) g.lineTo(x, 296 - Math.sin(x / 70) * 14); g.lineTo(W, 340); g.lineTo(0, 340); g.fill();
      g.fillStyle = '#5fb55f'; g.fillRect(0, 335, W, 25); g.fillStyle = '#4aa04a'; for (let x = 0; x < W; x += 16) g.fillRect(x, 335, 8, 4);
      // 東西
      s.items.forEach(i => {
        if (i.bomb) { ball(g, i.x, i.y, 18, '#6a6a7a', '#1a1a22'); g.strokeStyle = '#6b4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(i.x + 4, i.y - 16); g.quadraticCurveTo(i.x + 12, i.y - 28, i.x + 18, i.y - 24); g.stroke(); g.fillStyle = s.t % 4 < 2 ? '#ffd23a' : '#ff7a2a'; g.beginPath(); g.arc(i.x + 18, i.y - 24, 5 + (s.t % 3), 0, 7); g.fill(); }
        else { ball(g, i.x, i.y, 18, '#ff8f8f', '#d12b2b'); g.strokeStyle = '#6b4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(i.x, i.y - 16); g.lineTo(i.x + 2, i.y - 26); g.stroke(); g.fillStyle = '#3fa34d'; g.beginPath(); g.ellipse(i.x + 9, i.y - 24, 9, 4, -.4, 0, 7); g.fill(); }
      });
      // 籃子（接到時壓扁一下）
      g.save(); g.translate(s.bx, 348); g.scale(1 + s.sq * .12, 1 - s.sq * .12); g.translate(-s.bx, -348);
      g.fillStyle = '#b97a3a'; g.beginPath(); g.moveTo(s.bx - 46, 302); g.lineTo(s.bx + 46, 302); g.lineTo(s.bx + 36, 348); g.lineTo(s.bx - 36, 348); g.fill();
      g.strokeStyle = '#8c5622'; g.lineWidth = 2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(s.bx + i * 12, 304); g.lineTo(s.bx + i * 9, 346); g.stroke(); } for (let y = 316; y < 346; y += 12) { g.beginPath(); g.moveTo(s.bx - 42 + (y - 302) * .2, y); g.lineTo(s.bx + 42 - (y - 302) * .2, y); g.stroke(); }
      g.fillStyle = '#d99a52'; rr(g, s.bx - 50, 296, 100, 12, 6); g.fill(); g.restore();
      hearts(g, s.life); score(g, '分數', s.score);
      if (s.combo >= 2) { g.textAlign = 'left'; g.font = `900 16px ${FONT}`; g.fillStyle = '#c4570a'; g.fillText(`連續 ${s.combo}`, 12, 54); }
      if (!s.over && s.life <= 0) { s.over = true; finish(g, fx, '遊戲結束', `接到 ${s.score} 顆`, starsOf(s.score, 15, 7), onEnd); hk('end'); }
    });
  },

  // 切水果：滑鼠劃過水果
  slice(cv, onEnd) {
    const s = {items: [], halves: [], t: 0, score: 0, miss: 3, over: false, trail: [], mx: -99, my: -99, combo: 0, last: 0};
    const move = e => { const r = cv.getBoundingClientRect(); s.mx = (e.clientX - r.left) * W / r.width; s.my = (e.clientY - r.top) * H / r.height; s.trail.push({x: s.mx, y: s.my}); if (s.trail.length > 14) s.trail.shift(); };
    cv.addEventListener('pointermove', move);
    const COL = [['#ff8f8f', '#d12b2b'], ['#ffd27a', '#e8861a'], ['#c7ff9a', '#4bb43a'], ['#f3a0e0', '#b0409a']];
    const stop = frame(cv, (g, k, fx, frozen) => {
      if (!s.over && !frozen) {
        s.t++;
        if (s.t % 28 === 0) { const x = rnd(80, 400); s.items.push({x, y: H + 20, vx: rnd(-2, 2) + (240 - x) / 120, vy: rnd(-15, -11), bomb: Math.random() < .2, c: COL[Math.floor(rnd(0, 4))], rot: 0}); }
        s.items.forEach(i => { i.x += i.vx; i.y += i.vy; i.vy += .38; i.rot += .05; });
        s.halves.forEach(h => { h.x += h.vx; h.y += h.vy; h.vy += .4; h.rot += h.vr; });
        s.halves = s.halves.filter(h => h.y < H + 50);
        const hit = [];
        s.items = s.items.filter(i => {
          if (Math.hypot(i.x - s.mx, i.y - s.my) < 30 && s.trail.length > 3) {
            if (i.bomb) { s.miss--; s.combo = 0; fx.burst(i.x, i.y, '#ff9b2f', 24, 8); fx.shake(10); fx.flash('#ff3a3a'); fx.pop(i.x, i.y, '-1 ♥', '#ff6a6a'); sfx('boom'); }
            else { s.score++; hit.push(i); fx.burst(i.x, i.y, i.c[1], 16, 6); fx.burst(i.x, i.y, '#fff', 6, 4); sfx('slice'); s.halves.push({x: i.x - 4, y: i.y, vx: i.vx - 2.4, vy: i.vy - 1, rot: 0, vr: -.12, c: i.c, d: -1}, {x: i.x + 4, y: i.y, vx: i.vx + 2.4, vy: i.vy - 1, rot: 0, vr: .12, c: i.c, d: 1}); }
            return false;
          }
          if (i.y > H + 40 && i.vy > 0) { if (!i.bomb) { s.miss--; s.combo = 0; fx.pop(i.x, 340, '漏掉了', '#ff9a9a'); fx.shake(4); sfx('bad'); } return false; }
          return true;
        });
        if (hit.length) { const now = s.t; s.combo = now - s.last < 20 ? s.combo + hit.length : hit.length; s.last = now; if (s.combo >= 2) { s.score += s.combo - 1; fx.pop(hit[0].x, hit[0].y - 30, `連切 x${s.combo}！`, '#ffc83d', 28); sfx('combo'); } else fx.pop(hit[0].x, hit[0].y - 28, '+1', '#fff'); }
      }
      // 背景：木質道場
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b2350'); bg.addColorStop(1, '#4a2f6a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff0d'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(40 + i * 90, 70 + (i % 2) * 30, 40, 0, 7); g.fill(); }
      g.fillStyle = '#00000033'; g.fillRect(0, 300, W, 60);
      s.halves.forEach(h => { g.save(); g.translate(h.x, h.y); g.rotate(h.rot); g.beginPath(); g.rect(h.d > 0 ? 0 : -30, -30, 30, 60); g.clip(); ball(g, 0, 0, 20, h.c[0], h.c[1]); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.restore(); });
      s.items.forEach(i => { if (i.bomb) { ball(g, i.x, i.y, 22, '#6a6a7a', '#15151c'); g.strokeStyle = '#6b4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(i.x + 6, i.y - 20); g.quadraticCurveTo(i.x + 14, i.y - 32, i.x + 20, i.y - 28); g.stroke(); g.fillStyle = s.t % 4 < 2 ? '#ffd23a' : '#ff7a2a'; g.beginPath(); g.arc(i.x + 20, i.y - 28, 5, 0, 7); g.fill(); g.fillStyle = '#ff4d5e'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.fillText('✕', i.x, i.y + 5); } else ball(g, i.x, i.y, 22, i.c[0], i.c[1]); });
      g.lineCap = 'round';
      for (let n = 1; n < s.trail.length; n++) { const a = n / s.trail.length; g.strokeStyle = `rgba(120,230,255,${a * .5})`; g.lineWidth = n * 1.1; g.beginPath(); g.moveTo(s.trail[n - 1].x, s.trail[n - 1].y); g.lineTo(s.trail[n].x, s.trail[n].y); g.stroke(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = n / 2; g.stroke(); }
      if (s.t % 2 === 0 && s.trail.length) s.trail.shift();
      hearts(g, s.miss); score(g, '分數', s.score);
      if (!s.over && s.miss <= 0) { s.over = true; finish(g, fx, '遊戲結束', `切到 ${s.score} 分`, starsOf(s.score, 18, 8), onEnd); }
    });
    return () => { stop(); cv.removeEventListener('pointermove', move); };
  },

  // 躲隕石：方向鍵閃避
  dodge(cv, onEnd) {
    const s = {x: 240, y: 300, rocks: [], t: 0, life: 3, inv: 0, over: false, vx: 0};
    const poly = n => Array.from({length: n}, (_, i) => rnd(.75, 1.15));
    return frame(cv, (g, k, fx, frozen) => {
      if (!s.over && !frozen) {
        s.t++; if (s.inv > 0) s.inv--;
        s.vx = 0; if (k.ArrowLeft) { s.x = Math.max(20, s.x - 6); s.vx = -1; } if (k.ArrowRight) { s.x = Math.min(460, s.x + 6); s.vx = 1; }
        if (k.ArrowUp) s.y = Math.max(200, s.y - 5); if (k.ArrowDown) s.y = Math.min(335, s.y + 5);
        if (s.t % Math.max(10, 24 - Math.floor(s.t / 120)) === 0) s.rocks.push({x: rnd(20, 460), y: -30, r: rnd(14, 26), v: rnd(3, 5) + s.t / 400, rot: 0, vr: rnd(-.08, .08), sh: poly(9)});
        s.rocks.forEach(r => { r.y += r.v; r.rot += r.vr; });
        s.rocks = s.rocks.filter(r => {
          if (!s.inv && Math.hypot(r.x - s.x, r.y - s.y) < r.r + 12) { s.life--; s.inv = 45; fx.burst(s.x, s.y, '#ff9b2f', 26, 8); fx.burst(r.x, r.y, '#8a7060', 14, 6); fx.shake(11); fx.flash('#ff5a3a'); fx.pop(s.x, s.y - 24, '-1 ♥', '#ff6a6a'); sfx('boom'); return false; }
          return r.y < H + 40;
        });
        if (s.t % 300 === 0) { fx.pop(240, 120, '越來越快！', '#7dff7d', 32); sfx('combo'); }
      }
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#080a26'); bg.addColorStop(1, '#241a52'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#7a3fd022'; g.beginPath(); g.arc(120, 100, 110, 0, 7); g.fill(); g.fillStyle = '#2f9fd822'; g.beginPath(); g.arc(380, 220, 130, 0, 7); g.fill();
      for (let i = 0; i < 60; i++) { const sp = 1 + (i % 3); g.fillStyle = `rgba(255,255,255,${.25 + (i % 3) * .2})`; g.fillRect((i * 97) % W, (i * 53 + s.t * sp * 1.6) % H, sp, sp * 2); }
      s.rocks.forEach(r => { g.save(); g.translate(r.x, r.y); g.rotate(r.rot); g.fillStyle = '#8a7060'; g.beginPath(); r.sh.forEach((m, i) => { const a = i / r.sh.length * 6.283; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r.r * m, Math.sin(a) * r.r * m); }); g.closePath(); g.fill(); g.strokeStyle = '#5a4636'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#5a4636'; g.beginPath(); g.arc(-r.r / 3, -r.r / 4, r.r / 4, 0, 7); g.arc(r.r / 4, r.r / 3, r.r / 5, 0, 7); g.fill(); g.restore(); });
      if (!(s.inv && s.t % 6 < 3)) {
        g.save(); g.translate(s.x, s.y); g.rotate(s.vx * .15);
        g.fillStyle = s.t % 4 < 2 ? '#ffb02a' : '#ff6a2a'; g.beginPath(); g.moveTo(-7, 14); g.lineTo(0, 30 + (s.t % 3) * 4); g.lineTo(7, 14); g.fill();
        g.fillStyle = '#2f7fb8'; g.beginPath(); g.moveTo(-26, 16); g.lineTo(-10, -2); g.lineTo(-10, 16); g.fill(); g.beginPath(); g.moveTo(26, 16); g.lineTo(10, -2); g.lineTo(10, 16); g.fill();
        g.fillStyle = '#38e1ff'; g.beginPath(); g.moveTo(0, -20); g.lineTo(13, 16); g.lineTo(-13, 16); g.fill();
        g.fillStyle = '#e8fbff'; g.beginPath(); g.ellipse(0, 0, 4, 8, 0, 0, 7); g.fill(); g.restore();
      }
      hearts(g, s.life); score(g, '存活', Math.floor(s.t / 30) + ' 秒');
      if (!s.over && s.life <= 0) { s.over = true; const sec = Math.floor(s.t / 30); finish(g, fx, '被撞到了', `撐了 ${sec} 秒`, starsOf(sec, 35, 18), onEnd); }
    });
  },

  // 打怪（橫向）：↑ ↓ 移動，空白鍵射箭，史萊姆從右邊走過來
  fight(cv, onEnd) {
    const s = {y: 190, arrows: [], mons: [], t: 0, life: 3, score: 0, cd: 0, over: false, rec: 0};
    const LINE = 58; // 營地線
    return frame(cv, (g, k, fx, frozen) => {
      if (!s.over && !frozen) {
        s.t++; if (s.cd > 0) s.cd--; if (s.rec > 0) s.rec--;
        if (k.ArrowUp) s.y = Math.max(70, s.y - 5); if (k.ArrowDown) s.y = Math.min(300, s.y + 5);
        if (k[' '] && s.cd === 0) { s.arrows.push({x: 92, y: s.y - 4}); s.cd = 12; s.rec = 5; sfx('shoot'); }
        if (s.t % Math.max(24, 44 - Math.floor(s.t / 150)) === 0) s.mons.push({x: W + 20, y: rnd(80, 300), v: rnd(1.1, 2), hp: 2, ph: rnd(0, 6), hit: 0});
        s.arrows.forEach(b => { b.x += 10; });
        s.mons.forEach(m => { m.x -= m.v; m.ph += .12; if (m.hit > 0) m.hit--; });
        s.mons = s.mons.filter(m => {
          for (const b of s.arrows) if (Math.abs(b.x - m.x) < 26 && Math.abs(b.y - m.y) < 24) { b.x = 999; m.hp--; m.hit = 4; fx.burst(m.x, m.y, '#ffe27a', 6, 4); sfx('hit'); if (m.hp <= 0) { s.score++; fx.burst(m.x, m.y, '#7ad84a', 20, 7); fx.burst(m.x, m.y, '#fff', 8, 5); fx.pop(m.x, m.y - 24, '+1', '#fff'); sfx('good'); return false; } }
          if (m.x < LINE) { s.life--; fx.shake(9); fx.flash('#ff3a3a'); fx.pop(LINE + 20, m.y, '-1 ♥', '#ff6a6a'); fx.burst(LINE, m.y, '#ff6a6a', 16, 6); sfx('boom'); return false; }
          return true;
        });
        s.arrows = s.arrows.filter(b => b.x < W + 20);
      }
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d2a2a'); bg.addColorStop(.6, '#1c4a3a'); bg.addColorStop(1, '#2d5a2a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(400, 56, 22, 0, 7); g.fill();
      for (let i = 0; i < 7; i++) { const x = ((i * 130 - s.t * (1 + i % 2)) % (W + 130) + W + 130) % (W + 130) - 40, h = 90 + (i * 37) % 60; g.fillStyle = i % 2 ? '#14382f' : '#0f2d28'; g.beginPath(); g.moveTo(x - 30, 330); g.lineTo(x, 330 - h); g.lineTo(x + 30, 330); g.fill(); }
      g.fillStyle = '#3d6a2e'; g.fillRect(0, 330, W, 30); g.fillStyle = '#2a4d20'; for (let i = 0; i < 12; i++) g.fillRect(((i * 53 - s.t * 2) % W + W) % W, 336 + (i % 3) * 8, 18, 3);
      g.strokeStyle = '#ffd23a99'; g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(LINE, 40); g.lineTo(LINE, 330); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffd23aaa'; g.font = `700 12px ${FONT}`; g.textAlign = 'left'; g.fillText('營地線', 6, 352);
      s.mons.forEach(m => {
        const sq = Math.sin(m.ph) * 3;
        g.fillStyle = m.hit ? '#fff' : m.hp > 1 ? '#4fb84f' : '#8fe06a';
        g.beginPath(); g.ellipse(m.x, m.y + 4 - sq, 24 + sq, 20 - sq, 0, Math.PI, 0); g.lineTo(m.x + 24 + sq, m.y + 22); g.lineTo(m.x - 24 - sq, m.y + 22); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(m.x - 9, m.y + 2, 6, 0, 7); g.arc(m.x + 5, m.y + 2, 6, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(m.x - 11, m.y + 3, 3, 0, 7); g.arc(m.x + 3, m.y + 3, 3, 0, 7); g.fill();
        g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.arc(m.x - 4, m.y + 12, 5, .1, 3.04); g.stroke();
      });
      s.arrows.forEach(b => { g.strokeStyle = '#d9b27a'; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x - 18, b.y); g.lineTo(b.x + 10, b.y); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(b.x + 10, b.y - 5); g.lineTo(b.x + 20, b.y); g.lineTo(b.x + 10, b.y + 5); g.fill(); });
      g.save(); g.translate(76 - s.rec, s.y);
      g.fillStyle = '#e8883a'; rr(g, -14, -6, 28, 30, 8); g.fill(); g.fillStyle = '#f5d2a8'; g.beginPath(); g.arc(0, -16, 13, 0, 7); g.fill();
      g.fillStyle = '#2f7fb8'; g.beginPath(); g.moveTo(-15, -18); g.lineTo(0, -34); g.lineTo(15, -18); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(5, -16, 2.5, 0, 7); g.fill();
      g.strokeStyle = '#8a5a2a'; g.lineWidth = 4; g.beginPath(); g.arc(16, 4, 20, -1.2, 1.2); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(16 + 20 * Math.cos(-1.2), 4 + 20 * Math.sin(-1.2)); g.lineTo(16 - s.rec, 4); g.lineTo(16 + 20 * Math.cos(1.2), 4 + 20 * Math.sin(1.2)); g.stroke();
      g.restore();
      hearts(g, s.life); score(g, '擊倒', s.score);
      if (!s.over && s.life <= 0) { s.over = true; finish(g, fx, '營地被攻破', `擊倒 ${s.score} 隻`, starsOf(s.score, 12, 5), onEnd); }
    });
  }
};

export const META = {
  catch: {title: '接東西', color: '#e8483a', tip: '← → 移動籃子。接蘋果得分，躲開炸彈，三條命。', recipe: {player: '用鍵盤左右移動的籃子', things: '掉下來的蘋果和炸彈', rule: '接到蘋果加分、碰到炸彈或漏接少一條命', end: '三條命用完就結束'}, blocks: ['按下 ← → 鍵', 'x 改變', '建立分身', '變數：分數、生命']},
  slice: {title: '切水果', color: '#3fb87a', tip: '滑鼠劃過水果就切開。連續切會有加分，別碰炸彈！', recipe: {player: '滑鼠的刀光', things: '飛起來又掉下去的水果和炸彈', rule: '劃過水果加分、劃到炸彈或漏掉水果少一次機會', end: '機會用完就結束'}, blocks: ['滑鼠的 x、y 座標', '碰到 滑鼠指標？', '隨機選一個數', '重力：y 速度一直減少']},
  dodge: {title: '躲隕石', color: '#3b7fe0', tip: '方向鍵移動小飛船，躲開掉下來的隕石，越久越難。', recipe: {player: '用方向鍵控制的飛船', things: '越來越多、越來越快的隕石', rule: '被撞到少一條命，撐越久越好', end: '三條命用完就結束'}, blocks: ['上下左右四個方向鍵', '碰到 隕石？', '等待多久才再來一顆', '計時器：撐了幾秒']},
  fight: {title: '打怪', color: '#3fa05a', tip: '↑ ↓ 移動弓箭手，空白鍵射箭。史萊姆衝過營地線會少一條命。', recipe: {player: '會射箭的弓箭手（上下移動）', things: '從右邊走過來的史萊姆（要射兩箭）', rule: '箭射中史萊姆扣血、打倒得分、衝過營地線少一條命', end: '三條命用完就結束'}, blocks: ['按下 ↑ ↓ 鍵', '建立 箭 的分身', '碰到 史萊姆？', '史萊姆的血量變數']}
};
