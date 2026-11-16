// 首頁：3D 遊戲街機城。中間一台街機，通關解鎖強化模組就會升級；四間店圍成一圈，亮燈的才能進。
import {RoomEnvironment} from '/vendor/RoomEnvironment.js';

const $ = id => document.getElementById(id);
let S = null; try { S = JSON.parse(localStorage.getItem('ninja-l1-v1')); } catch (e) { /* 第一次來 */ }
const done = (S && S.done) || [];
const mods = (S && S.mods) || (done[4] ? ['modLife', 'modBomb', 'modSpeed'] : []);
const doneCount = done.filter(Boolean).length;

const MODS = [
  {k: 'modLife', name: '生命', color: 0xff4f6a},
  {k: 'modBomb', name: '炸彈', color: 0x8a8cff},
  {k: 'modSpeed', name: '加速', color: 0xffd23f}
];
const L0 = (() => { try { return JSON.parse(localStorage.getItem('ninja-l0-v2')) || {}; } catch (e) { return {}; } })();
const introDone = !!(L0.done && L0.done[7]);
const SHOPS = [
  {id: 'intro', title: '開幕導覽', sub: introDone ? '已看過' : '先來認識遊戲', open: true, href: '/intro.html', hue: 0xffc83d},
  {id: 'catch', title: '接東西', sub: '接住掉下來的水果', open: true, href: '/level1.html', hue: 0xe8483a},
  {id: 'slice', title: '切水果', sub: '等老師開放', open: false, hue: 0x3fb87a},
  {id: 'dodge', title: '躲隕石', sub: '等老師開放', open: false, hue: 0x3b7fe0},
  {id: 'fight', title: '打怪', sub: '等老師開放', open: false, hue: 0x9b59d0}
];

function toast(text) { const t = $('toast'); t.textContent = text; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600); }

function renderUi() {
  $('rooms').replaceChildren(...SHOPS.map(r => {
    const li = document.createElement('li');
    if (r.open) { const a = document.createElement('a'); a.href = r.href; a.textContent = r.title; li.append(a, r.id === 'catch' ? `（${doneCount}/8 步）` : ''); }
    else { li.className = 'locked'; li.textContent = r.title + '（等老師開放）'; }
    return li;
  }));
  $('progress').textContent = doneCount ? `接東西 ${doneCount}/8 步｜模組 ${mods.length}/3` : '第一次來';
  $('mods').replaceChildren(...MODS.map(m => {
    const el = document.createElement('span'); const has = mods.includes(m.k);
    el.className = 'mod' + (has ? ' got' : ''); el.textContent = has ? m.name : '？'; el.title = has ? '已解鎖' : '在「接東西」通過基本版後解鎖'; return el;
  }));
  if (!introDone && !doneCount) { $('go').textContent = '先去「開幕導覽」▶'; $('go').href = '/intro.html'; }
  else { $('go').href = '/level1.html'; $('go').textContent = !doneCount ? '進「接東西」▶' : (done[7] ? '再玩一次「接東西」▶' : '繼續「接東西」▶'); }
}
renderUi();

async function start() {
  const THREE = await import('/vendor/three.module.js');
  const canvas = $('park');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .22; pm.dispose(); }

  // 黃昏天空
  { const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0e0c33'); gr.addColorStop(.45, '#2b2a7a'); gr.addColorStop(.8, '#8a4fa8'); gr.addColorStop(1, '#ff9a7a'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
  scene.fog = new THREE.Fog(0x3a2f78, 45, 95);

  const mat = (color, rough = .7, metal = 0) => new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal});
  const glow = (color, k = 1) => new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: k, roughness: .5});
  const add = (parent, geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const box = (g, w, h, d, x, y, z, color, rough) => add(g, new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? mat(color, rough) : color, x, y, z);
  const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  function sprite(text, {bg = '#fff', fg = '#1d1840', size = 44} = {}, height = .6) {
    const c = document.createElement('canvas'), ctx = c.getContext('2d'); ctx.font = `bold ${size}px ${FONT}`;
    const w = Math.ceil(ctx.measureText(text).width) + 52, h = size + 30; c.width = w; c.height = h;
    ctx.font = `bold ${size}px ${FONT}`; ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, h / 2.4); ctx.fillStyle = bg; ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, depthTest: false, transparent: true})); s.scale.set(height * w / h, height, 1); s.renderOrder = 10; return s;
  }

  // 光
  scene.add(new THREE.HemisphereLight(0x9a9cff, 0x2a2450, 1.5));
  const moon = new THREE.DirectionalLight(0xbfc6ff, 1.6); moon.position.set(-12, 24, 16); moon.castShadow = true;
  Object.assign(moon.shadow.camera, {left: -32, right: 32, top: 32, bottom: -32, far: 80}); moon.shadow.mapSize.set(1024, 1024); scene.add(moon);
  const pl1 = new THREE.PointLight(0xff4fa3, 60, 22); pl1.position.set(-4, 4, 5); scene.add(pl1);
  const pl2 = new THREE.PointLight(0x38e1ff, 60, 22); pl2.position.set(4, 4, 5); scene.add(pl2);

  // 地面：地磚廣場、環狀馬路
  const tile = document.createElement('canvas'); tile.width = tile.height = 256; { const g = tile.getContext('2d'); g.fillStyle = '#2d2a6a'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#38347f'; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
    g.strokeStyle = '#5b57b8'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); }
  const tileTex = new THREE.CanvasTexture(tile); tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(12, 12); tileTex.colorSpace = THREE.SRGBColorSpace;
  const flat = (geo, material, y) => { const m = new THREE.Mesh(geo, material); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; scene.add(m); return m; };
  flat(new THREE.PlaneGeometry(260, 260), mat(0x1f3a3a, 1), 0);
  flat(new THREE.CircleGeometry(8.2, 64), new THREE.MeshStandardMaterial({map: tileTex, roughness: .55}), .012);
  flat(new THREE.RingGeometry(8.2, 10.4, 64), mat(0x34343f, .9), .014);
  flat(new THREE.RingGeometry(9.25, 9.4, 64), glow(0xffe9a8, .8), .02);
  flat(new THREE.RingGeometry(8.1, 8.3, 64), glow(0x38e1ff, 1.2), .022);

  // 星星
  { const n = 260, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 40; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 12 + Math.random() * 60; pos[i * 3 + 2] = Math.sin(a) * r - 20; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({color: 0xffffff, size: .5, sizeAttenuation: true, fog: false}))); }

  // ── 中央大街機 ──────────────────────────────
  const turntable = new THREE.Group(); scene.add(turntable);
  add(scene, new THREE.CylinderGeometry(3.7, 3.9, .5, 56), mat(0x1c1a52, .4, .3), 0, .25, 0);
  add(scene, new THREE.CylinderGeometry(3.45, 3.45, .06, 56), glow(0xffc83d, .9), 0, .52, 0);
  const cab = new THREE.Group(); cab.position.set(0, .55, 0); cab.scale.setScalar(1.15); scene.add(cab);
  const prof = new THREE.Shape(); [[0, 0], [2.4, 0], [2.4, 2.2], [2.9, 2.5], [2.9, 2.8], [2.1, 2.8], [1.85, 4.5], [2.3, 4.5], [2.3, 5.6], [0, 5.6]].forEach(([x, y], i) => i ? prof.lineTo(x, y) : prof.moveTo(x, y));
  const CW = 2.7;
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, {depth: CW, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2}), mat(0x3a2a96, .45, .15));
  body.rotation.y = -Math.PI / 2; body.position.set(CW / 2, 0, 0); body.castShadow = true; body.receiveShadow = true; cab.add(body);
  // 側邊霓虹條
  for (const sx of [-1, 1]) { box(cab, .05, 5.2, .06, sx * (CW / 2 + .08), 2.7, .25, new THREE.MeshStandardMaterial({color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 1.6}));
    box(cab, .05, 2.1, .06, sx * (CW / 2 + .08), 1.1, 2.33, new THREE.MeshStandardMaterial({color: 0x38e1ff, emissive: 0x38e1ff, emissiveIntensity: 1.6})); }
  // 螢幕：跑著「接水果大師」自動示範
  const scr = document.createElement('canvas'); scr.width = 480; scr.height = 360; const sg = scr.getContext('2d');
  const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace;
  const th = Math.atan2(.25, 1.7), slen = Math.hypot(.25, 1.7);
  const bezel = box(cab, 2.5, slen + .25, .08, 0, 3.65, 2.02, 0x120f33, .4); bezel.rotation.x = -th;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(slen * 1.2, slen), new THREE.MeshBasicMaterial({map: scrTex, toneMapped: false}));
  screen.position.set(0, 3.65, 2.075); screen.rotation.x = -th; cab.add(screen);
  // 招牌
  { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#1b1650'; g.fillRect(0, 0, 512, 128); const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#ff4fa3'); gr.addColorStop(.5, '#ffc83d'); gr.addColorStop(1, '#38e1ff');
    g.strokeStyle = gr; g.lineWidth = 8; g.strokeRect(8, 8, 496, 112); g.fillStyle = '#fff'; g.font = `bold 64px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ffc83d'; g.shadowBlur = 18; g.fillText('接水果大師', 256, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5, .62), new THREE.MeshBasicMaterial({map: t, toneMapped: false})); m.position.set(0, 5.05, 2.4); cab.add(m); }
  // 搖桿與按鈕
  const jx = -.65; add(cab, new THREE.CylinderGeometry(.22, .26, .1, 20), mat(0x111111, .4), jx, 2.85, 2.5); add(cab, new THREE.CylinderGeometry(.05, .05, .42, 12), mat(0xcccccc, .3, .8), jx, 3.08, 2.5);
  add(cab, new THREE.SphereGeometry(.17, 24, 16), mat(0xe8483a, .25), jx, 3.32, 2.5);
  [[.15, 0xffc83d], [.62, 0x38e1ff], [1.05, 0xff4fa3]].forEach(([x, c]) => { add(cab, new THREE.CylinderGeometry(.17, .19, .09, 20), glow(c, .9), x, 2.86, 2.52); });
  box(cab, .8, .08, .05, 0, 1.45, 2.43, 0x0b0922);   // 投幣口
  box(cab, .9, .5, .05, 0, 1.0, 2.43, 0x0b0922);
  { const s = sprite('接水果大師', {bg: '#ffc83d', fg: '#3a2800', size: 40}, .7); s.position.set(0, 8.6, 0); scene.add(s); }

  // 強化模組：繞著街機轉。解鎖才會發光，沒解鎖是灰色半透明。
  const orbit = new THREE.Group(); orbit.position.y = 3.2; scene.add(orbit);
  function modMesh(k, on, color) {
    const g = new THREE.Group();
    const m = on ? new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: .9, roughness: .3, metalness: .2})
      : new THREE.MeshStandardMaterial({color: 0xb0b4c8, roughness: .9, transparent: true, opacity: .4});
    if (k === 'modLife') {
      const s = new THREE.Shape(); s.moveTo(0, -.45); s.bezierCurveTo(-.75, .1, -.45, .7, 0, .35); s.bezierCurveTo(.45, .7, .75, .1, 0, -.45);
      const geo = new THREE.ExtrudeGeometry(s, {depth: .25, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 3}); geo.center(); add(g, geo, m);
    } else if (k === 'modBomb') {
      add(g, new THREE.SphereGeometry(.42, 24, 18), m); add(g, new THREE.CylinderGeometry(.12, .15, .16, 12), on ? mat(0x666a80, .5, .6) : m, 0, .46, 0);
      add(g, new THREE.CylinderGeometry(.025, .025, .3, 6), on ? mat(0xa66b2c) : m, .08, .66, 0).rotation.z = -.6; if (on) add(g, new THREE.SphereGeometry(.09, 10, 8), glow(0xffb300, 2), .22, .8, 0);
    } else {
      const s = new THREE.Shape(); [[.15, .6], [-.35, -.05], [-.02, -.05], [-.18, -.6], [.38, .1], [.05, .1], [.3, .6]].forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
      const geo = new THREE.ExtrudeGeometry(s, {depth: .2, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2}); geo.center(); add(g, geo, m);
    }
    g.scale.setScalar(1.5);
    return g;
  }
  const modNodes = MODS.map((m, i) => {
    const a = i / MODS.length * Math.PI * 2, on = mods.includes(m.k);
    const slot = new THREE.Group(); slot.position.set(Math.sin(a) * 5.4, 0, Math.cos(a) * 5.4); orbit.add(slot);
    slot.add(modMesh(m.k, on, m.color));
    const lab = sprite(on ? m.name : '？', {bg: on ? '#ffc83d' : '#8c88c8', fg: on ? '#3a2800' : '#fff', size: 36}, .5); lab.position.y = 1.2; slot.add(lab);
    return slot;
  });
  { const s = sprite(`強化模組 ${mods.length}/${MODS.length}`, {bg: '#2b2766', fg: '#ffc83d', size: 38}, .55); s.position.set(0, 1.2, 0); scene.add(s); }

  // ── 四間店 ─────────────────────────────────
  const clickables = [], beams = [];
  function shopIcon(id, g, y, on) {
    const c = on ? 1 : .35;
    const col = x => { const m = mat(x, .5); if (!on) { m.color.lerp(new THREE.Color(0x888899), .7); } return m; };
    if (id === 'intro') {   // 遊戲卡帶
      const cart = add(g, new THREE.BoxGeometry(1.5, 1.8, .35), col(0x23203f), 0, y + .95, 0); const lab = add(g, new THREE.BoxGeometry(1.1, 1.1, .05), col(0xffc83d), 0, y + 1.05, .2); cart.rotation.y = lab.rotation.y = .3; lab.position.x = .06;
    } else if (id === 'catch') {   // 籃子與蘋果
      const pts = [[.0, 0], [.6, 0], [.85, .55], [.95, .65], [.9, .7], [0, .7]].map(([x, yy]) => new THREE.Vector2(x, yy));
      const bsk = add(g, new THREE.LatheGeometry(pts, 24), col(0xc98a4b), 0, y, 0); bsk.scale.setScalar(1.2);
      add(g, new THREE.SphereGeometry(.34, 18, 14), col(0xe8483a), -.35, y + .95, .1); add(g, new THREE.SphereGeometry(.34, 18, 14), col(0xe8483a), .35, y + 1.0, -.05);
    } else if (id === 'slice') {   // 西瓜
      add(g, new THREE.SphereGeometry(.85, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), col(0x3fb87a), 0, y, 0).rotation.x = Math.PI;
      const cut = add(g, new THREE.CircleGeometry(.85, 28), col(0xff5a6a), 0, y, 0); cut.rotation.x = -Math.PI / 2; cut.position.y = y - .0;
    } else if (id === 'dodge') {   // 隕石
      add(g, new THREE.IcosahedronGeometry(.8, 1), col(0x8a7060), 0, y + .8, 0); add(g, new THREE.SphereGeometry(.12, 8, 6), col(0x5a4636), .3, y + 1.2, .6);
    } else {   // 外星怪
      add(g, new THREE.SphereGeometry(.7, 20, 16), col(0x9b59d0), 0, y + .7, 0); add(g, new THREE.SphereGeometry(.17, 12, 10), col(0xffffff), -.25, y + .85, .6); add(g, new THREE.SphereGeometry(.17, 12, 10), col(0xffffff), .25, y + .85, .6);
      add(g, new THREE.CylinderGeometry(.03, .03, .5, 6), col(0x9b59d0), -.3, y + 1.55, 0).rotation.z = .3; add(g, new THREE.CylinderGeometry(.03, .03, .5, 6), col(0x9b59d0), .3, y + 1.55, 0).rotation.z = -.3;
    }
  }
  SHOPS.forEach((r, i) => {
    const a = Math.PI + (i - 2) * .52, rad = 20;
    const g = new THREE.Group(); g.position.set(Math.sin(a) * rad, 0, Math.cos(a) * rad); g.lookAt(0, 0, 0); scene.add(g);
    const W = 5, H = 3.4, D = 3.8, on = r.open, front = D / 2 + .02;
    const wall = on ? 0x3a3290 : 0x4a4860;
    box(g, W, H, D, 0, H / 2, 0, wall, .6);
    box(g, W + .5, .3, D + .5, 0, H + .15, 0, on ? r.hue : 0x5a586a, .5);
    // 雨棚
    const awn = new THREE.Mesh(new THREE.BoxGeometry(W + .3, .12, 1.3), mat(on ? r.hue : 0x6a687a, .6)); awn.position.set(0, 2.55, front + .55); awn.rotation.x = .25; awn.castShadow = true; g.add(awn);
    for (let k = -2; k <= 2; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(.42, .13, 1.32), mat(0xffffff, .6)); st.position.set(k * .9, 2.555, front + .55); st.rotation.x = .25; g.add(st); }
    // 門與窗
    const dw = 1.5, dh = 2.1;
    if (on) { box(g, dw, dh, .06, 0, dh / 2, front, new THREE.MeshStandardMaterial({color: 0xffe9a8, emissive: 0xffe9a8, emissiveIntensity: 1.2}));
      for (const x of [-1.8, 1.8]) box(g, .9, 1, .06, x, 1.7, front, new THREE.MeshStandardMaterial({color: 0x38e1ff, emissive: 0x38e1ff, emissiveIntensity: .9})); }
    else { box(g, dw, dh, .06, 0, dh / 2, front, 0x7d8090); for (let k = 1; k < 7; k++) box(g, dw, .03, .08, 0, dh * k / 7, front + .01, 0x5a5d6a);
      for (const x of [-1.8, 1.8]) box(g, .9, 1, .06, x, 1.7, front, 0x3a3d4a); }
    shopIcon(r.id, g, H + .45, on);
    const label = sprite(r.title, {bg: on ? '#ffc83d' : '#8c88c8', fg: on ? '#3a2800' : '#fff'}, on ? .9 : .7); label.position.set(0, H + 3.3, 0); g.add(label);
    const sub = sprite(on ? (doneCount ? `${doneCount}/8 步` : '現在可以進') : '等老師開放', {bg: on ? '#e8483a' : '#5b57a0', fg: '#fff', size: 36}, .5); sub.position.set(0, H + 2.5, 0); g.add(sub);
    if (on) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.1, 10, 24, 1, true), new THREE.MeshBasicMaterial({color: 0xffc83d, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide})); beam.position.y = 5; g.add(beam); beams.push(beam); }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(W + .6, H + 3.4, D + 1.2), new THREE.MeshBasicMaterial({visible: false})); hit.position.y = (H + 3.4) / 2; hit.userData = {shop: r, group: g}; g.add(hit); clickables.push(hit);
  });

  // 路燈與彩燈
  const POLES = 10, lampR = 11.6, bulbs = [];
  for (let i = 0; i < POLES; i++) {
    const a = (i + .5) / POLES * Math.PI * 2, x = Math.sin(a) * lampR, z = Math.cos(a) * lampR;
    box(scene, .14, 5.2, .14, x, 2.6, z, 0x3a3a50, .5); add(scene, new THREE.SphereGeometry(.28, 14, 10), glow(0xffe9a8, 2), x, 5.35, z);
    const a2 = (i + 1.5) / POLES * Math.PI * 2;
    for (let k = 1; k < 9; k++) { const f = k / 9, aa = a + (a2 - a) * f, sag = Math.sin(f * Math.PI) * .9;
      const colr = [0xff4fa3, 0xffc83d, 0x38e1ff, 0x7dff9a][k % 4];
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({color: colr})); bulb.position.set(Math.sin(aa) * lampR, 5.0 - sag, Math.cos(aa) * lampR); scene.add(bulb); bulbs.push(bulb); }
  }
  // 樹
  { const spots = [[-26, 4], [-30, 14], [26, 4], [30, 14], [-22, 26], [22, 26], [-38, -10], [38, -10], [-14, 32], [14, 32], [0, 36]];
    const dummy = new THREE.Object3D();
    const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 4, 7), new THREE.MeshStandardMaterial({color: 0x2f7a62, roughness: 1, flatShading: true}), spots.length);
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .3, 1.4, 6), mat(0x4a3a30, 1), spots.length);
    spots.forEach(([x, z], i) => { dummy.position.set(x, 3.2, z); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix); dummy.position.set(x, .7, z); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix); });
    leaves.castShadow = true; scene.add(leaves, trunks); }
  // 招牌
  { const s = sprite('遊戲街機城', {bg: '#1b1650', fg: '#ffc83d', size: 66}, 1.8); s.position.set(0, 12, -34); scene.add(s); for (const x of [-7, 7]) box(scene, .3, 11, .3, x, 5.5, -34, 0x3a3a50); }

  // ── 螢幕自動示範 ───────────────────────────
  const demo = {bx: 240, items: [], t: 0, life: 3, score: 0, spd: 5, over: 0};
  function stepDemo() {
    demo.t++;
    if (demo.over) { if (--demo.over === 0) Object.assign(demo, {items: [], life: 3, score: 0, spd: 5}); return; }
    if (demo.t % 26 === 0) demo.items.push({x: 40 + Math.random() * 400, y: -20, bomb: false});
    if (demo.t % 90 === 0) demo.items.push({x: 40 + Math.random() * 400, y: -20, bomb: true});
    const want = demo.items.filter(i => !i.bomb).sort((p, q) => q.y - p.y)[0];
    if (want) demo.bx += Math.max(-8, Math.min(8, want.x - demo.bx));
    demo.items.forEach(i => { i.y += demo.spd * .8; });
    demo.items = demo.items.filter(i => {
      if (i.y > 285 && i.y < 335 && Math.abs(i.x - demo.bx) < 50) { if (i.bomb) demo.life--; else { demo.score++; if (demo.score % 5 === 0) demo.spd++; } return false; }
      if (i.y > 350) { if (!i.bomb && Math.random() < .08) demo.life--; return false; }
      return true;
    });
    if (demo.life <= 0) demo.over = 90;
  }
  function drawDemo() {
    const g = sg; g.fillStyle = '#bfe3ff'; g.fillRect(0, 0, 480, 360); g.fillStyle = '#7cc27c'; g.fillRect(0, 335, 480, 25);
    demo.items.forEach(i => { if (i.bomb) { g.fillStyle = '#2b2b33'; g.beginPath(); g.arc(i.x, i.y, 18, 0, 7); g.fill(); g.fillStyle = '#ffb300'; g.fillRect(i.x + 6, i.y - 26, 5, 8); }
      else { g.fillStyle = '#e8483a'; g.beginPath(); g.arc(i.x, i.y, 18, 0, 7); g.fill(); g.fillStyle = '#3fa34d'; g.fillRect(i.x - 2, i.y - 26, 4, 9); } });
    g.fillStyle = '#c98a4b'; g.beginPath(); g.moveTo(demo.bx - 45, 300); g.lineTo(demo.bx + 45, 300); g.lineTo(demo.bx + 36, 348); g.lineTo(demo.bx - 36, 348); g.fill();
    g.fillStyle = '#e8483a'; g.font = 'bold 26px sans-serif'; g.textAlign = 'left'; g.fillText('♥'.repeat(Math.max(0, demo.life)), 10, 30);
    g.fillStyle = '#222'; g.font = 'bold 22px sans-serif'; g.textAlign = 'right'; g.fillText('分數 ' + demo.score, 470, 30);
    if (demo.over) { g.fillStyle = 'rgba(28,36,48,.9)'; g.fillRect(100, 140, 280, 80); g.fillStyle = '#fff'; g.font = `bold 40px ${FONT}`; g.textAlign = 'center'; g.fillText('遊戲結束', 240, 195); }
    scrTex.needsUpdate = true;
  }

  // ── 鏡頭與操作 ─────────────────────────────
  const view = {az: 0, tAz: 0, el: .38, dist: 25, tDist: 25, focus: new THREE.Vector3(0, 3, 0), goal: new THREE.Vector3(0, 3, 0)};
  let down = null, moved = false, going = false, idle = 0;
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  const pick = e => { const r = canvas.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, camera); const h = ray.intersectObjects(clickables, false)[0]; return h ? h.object.userData : null; };
  canvas.addEventListener('pointerdown', e => { down = {x: e.clientX, az: view.tAz}; moved = false; idle = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (down) { const dx = e.clientX - down.x; if (Math.abs(dx) > 4) moved = true; view.tAz = down.az - dx * .006; } else canvas.style.cursor = pick(e) ? 'pointer' : 'grab'; });
  canvas.addEventListener('pointerup', e => { if (down && !moved) { const h = pick(e); if (h) enter(h); } down = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); view.tDist = Math.max(12, Math.min(40, view.tDist + e.deltaY * .01)); }, {passive: false});
  function enter({shop, group}) {
    if (!shop.open) { toast(`「${shop.title}」還沒開放。先把「接東西」玩通關，老師會依進度開新的店。`); return; }
    if (going) return; going = true;
    const p = new THREE.Vector3(); group.getWorldPosition(p); view.goal.set(p.x, 2.2, p.z); view.tDist = 11;
    const a = Math.atan2(p.x, p.z) + Math.PI, d = Math.atan2(Math.sin(a - view.tAz), Math.cos(a - view.tAz)); view.tAz += d;
    setTimeout(() => { location.href = shop.href; }, 650);
  }
  function resize() { const w = canvas.clientWidth || 800, h = canvas.clientHeight || 600; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 62 : 42; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(canvas); resize();

  const clock = new THREE.Clock();
  (function loop() {
    const t = clock.getElapsedTime();
    if (!down && !going) { idle += 1; view.tAz += Math.sin(t * .15) * .0006; }
    view.az += (view.tAz - view.az) * .08; view.dist += (view.tDist - view.dist) * .08; view.focus.lerp(view.goal, .08);
    camera.position.set(view.focus.x + Math.sin(view.az) * view.dist * Math.cos(view.el), view.focus.y + view.dist * Math.sin(view.el), view.focus.z + Math.cos(view.az) * view.dist * Math.cos(view.el));
    camera.lookAt(view.focus);
    cab.rotation.y = Math.sin(t * .5) * .22; orbit.rotation.y = t * .22;
    modNodes.forEach((s, i) => { s.children[0].rotation.y = t * 1.2; s.position.y = Math.sin(t * 1.5 + i * 2) * .25; });
    pl1.intensity = 55 + Math.sin(t * 3) * 12; pl2.intensity = 55 + Math.cos(t * 3.4) * 12;
    bulbs.forEach((b, i) => { b.scale.setScalar(.8 + .4 * Math.max(0, Math.sin(t * 3 + i))); });
    beams.forEach(b => { b.material.opacity = .1 + Math.sin(t * 2.2) * .05; });
    stepDemo(); if (demo.t % 2 === 0) drawDemo();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
  window.__park = {ready: true, demo};
}
try { await start(); } catch (error) {
  console.warn('3D 街機城沒有開起來，改用清單', error);
  document.body.classList.add('flat'); $('hint').textContent = '這台電腦開不了 3D 畫面，用上面的按鈕進店就好。';
  $('list').open = true;
}
