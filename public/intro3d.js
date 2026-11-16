// 開幕導覽的 3D 場景：星光遊戲工作室（老闆、客人、舊街機、卡帶、Bug 怪）
// 人物使用 KayKit Adventurers（Kay Lousberg，CC0）Q版角色，動作共用 models/anims.glb
import * as THREE from '/vendor/three.module.js';
import {GLTFLoader} from '/vendor/GLTFLoader.js';

const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
export const CHARS = {
  boss: {file: 'wang', name: '老闆'},
  an: {file: 'an', name: '藍衣小朋友'}, qing: {file: 'qing', name: '紅衣小朋友'}, zhe: {file: 'zhe', name: '黃衣小朋友'}, yu: {file: 'yu', name: '橘帽小朋友'},
  mei: {file: 'mei', name: '水果攤老闆娘'}, ting: {file: 'ting', name: '道場主人'}, lin: {file: 'lin', name: '太空站站長'}
};

export async function createWorld(canvas, {META, info, CART_IDS}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0926);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color: c, roughness: .7}, o));
  const box = (w, h, d, m, x, y, z, p = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); p.add(b); return b; };
  const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  /* ---------- 燈光 ---------- */
  scene.add(new THREE.HemisphereLight(0xb8bcff, 0x3a2a55, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 7, 8); scene.add(key);
  const warm = new THREE.PointLight(0xffc983, 30, 14); warm.position.set(0, 3.2, 0); scene.add(warm);
  const pinkL = new THREE.PointLight(0xff4fa3, 28, 12); pinkL.position.set(-4, 3, -1.5); scene.add(pinkL);
  const cyanL = new THREE.PointLight(0x38e1ff, 24, 12); cyanL.position.set(6, 2.5, -1); scene.add(cyanL);

  /* ---------- 工作室 ---------- */
  const room = new THREE.Group(); scene.add(room);
  const floorTex = ctex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#7a5a3c' : '#86644a'; g.fillRect(0, i * 64, w, 64); g.fillStyle = '#00000030'; g.fillRect(0, i * 64, w, 3); for (let j = 0; j < 4; j++) g.fillRect(((i * 97 + j * 160) % w), i * 64, 3, 64); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), new THREE.MeshStandardMaterial({map: floorTex, roughness: .8})); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 2); room.add(floor);
  const wallTex = ctex(512, 256, (g, w, h) => { g.fillStyle = '#2a2470'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#2e2878' : '#262068'; g.fillRect(i * 32, 0, 32, h); } g.fillStyle = '#ffffff12'; for (let i = 0; i < 40; i++) g.fillRect((i * 83) % w, (i * 47) % h, 3, 3); });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5), new THREE.MeshStandardMaterial({map: wallTex, roughness: .9})); wall.position.set(0, 3.25, -3); room.add(wall);
  box(26, .35, .2, mat(0x1a1648), 0, .18, -2.9, room);
  // 招牌
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.1), new THREE.MeshBasicMaterial({map: ctex(512, 100, (g, w, h) => { g.fillStyle = '#120f34'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff4fa3'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.font = `900 54px ${FONT}`; g.textAlign = 'center'; g.shadowColor = '#ffc83d'; g.shadowBlur = 16; g.fillStyle = '#ffd95a'; g.fillText('星光遊戲工作室', w / 2, 70); })})); sign.position.set(0, 4.6, -2.85); room.add(sign);
  // 窗
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2), new THREE.MeshBasicMaterial({map: ctex(256, 200, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0e0c3a'); gr.addColorStop(1, '#5a3a9a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect((i * 71) % w, (i * 37) % (h - 40), 2, 2); g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(190, 50, 20, 0, 7); g.fill(); g.fillStyle = '#1a1648'; for (let i = 0; i < 7; i++) g.fillRect(i * 38, h - 30 - (i * 37 % 40), 30, 80); })})); win.position.set(6.2, 2.7, -2.85); room.add(win);
  box(2.8, .12, .12, mat(0xffc83d), 6.2, 3.74, -2.82, room); box(2.8, .12, .12, mat(0xffc83d), 6.2, 1.66, -2.82, room); box(.12, 2.2, .12, mat(0xffc83d), 4.82, 2.7, -2.82, room); box(.12, 2.2, .12, mat(0xffc83d), 7.58, 2.7, -2.82, room); box(.08, 2, .1, mat(0xffc83d), 6.2, 2.7, -2.82, room);
  // 訂單布告欄
  const notes = [];
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshStandardMaterial({map: ctex(256, 170, (g, w, h) => { g.fillStyle = '#b98a58'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = Math.random() < .5 ? '#a37646' : '#c89a68'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.strokeStyle = '#6b4a2a'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); }), roughness: 1})); board.position.set(-5.4, 3.0, -2.86); room.add(board);
  const noteCols = [0xfff2a8, 0xffc8d8, 0xbfe8ff, 0xd5f5c0, 0xfff2a8, 0xffd8a8];
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.8, .62), new THREE.MeshStandardMaterial({color: noteCols[i], roughness: .95})); p.position.set(-6.5 + (i % 3) * 1.1, 3.4 - Math.floor(i / 3) * .85, -2.82); p.rotation.z = (i % 3 - 1) * .08 + (i > 2 ? .05 : 0); room.add(p); notes.push(p); const pin = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), mat(0xe8483a)); pin.position.set(p.position.x, p.position.y + .24, -2.78); room.add(pin); }
  // 櫃檯與電腦
  const wood = mat(0x8a5a34), wood2 = mat(0xa8744a);
  box(3.4, .95, 1.0, wood, 0, .48, -1.3, room); box(3.6, .1, 1.2, wood2, 0, 1.0, -1.3, room);
  const monTex = ctex(256, 192, (g, w, h) => { g.fillStyle = '#10163a'; g.fillRect(0, 0, w, h); g.fillStyle = '#38e1ff'; g.font = `700 22px ${FONT}`; g.fillText('訂單：好多好多…', 14, 40); g.fillStyle = '#ff6a8a'; for (let i = 0; i < 5; i++) g.fillRect(14, 62 + i * 22, 60 + (i * 53 % 150), 10); });
  box(.9, .62, .1, mat(0x23203f), -.9, 1.5, -1.5, room); box(.12, .3, .12, mat(0x23203f), -.9, 1.15, -1.5, room);
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(.8, .52), new THREE.MeshBasicMaterial({map: monTex})); mon.position.set(-.9, 1.5, -1.44); room.add(mon);
  for (let i = 0; i < 4; i++) box(.55, .05, .4, mat(0xfffaf0), .7 + i * .02, 1.08 + i * .05, -1.2, room).rotation.y = i * .25;
  box(.14, .16, .14, mat(0xe8483a), 1.35, 1.14, -1.4, room);
  // 地上散落的紙團
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), mat(0xfffaf0, {flatShading: true})); m.position.set(-3 + i * 1.1 + Math.sin(i) * .4, .1, 1.2 + Math.cos(i * 2) * 1.2); room.add(m); }

  /* ---------- 舊街機（插卡帶的地方） ---------- */
  let view_cab = null; const cab = new THREE.Group(); cab.position.set(-5.2, 0, -1.7); cab.rotation.y = .3; room.add(cab);
  const marqCv = document.createElement('canvas'); marqCv.width = 512; marqCv.height = 128; { const g = marqCv.getContext('2d'); g.fillStyle = '#1a1648'; g.fillRect(0, 0, 512, 128); g.font = `900 70px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ffc83d'; g.shadowColor = '#ff9a2a'; g.shadowBlur = 18; g.fillText('阿機 ARCADE', 256, 90); }
  const marqTex = new THREE.CanvasTexture(marqCv); marqTex.colorSpace = THREE.SRGBColorSpace; marqTex.flipY = false;
  const scrCv = document.createElement('canvas'); scrCv.width = 256; scrCv.height = 192; const sg = scrCv.getContext('2d'); const scrTex = new THREE.CanvasTexture(scrCv); scrTex.colorSpace = THREE.SRGBColorSpace;
  scrTex.flipY = false;
  const cabGlow = new THREE.PointLight(0x7a6aff, 6, 5); cabGlow.position.set(0, 2.4, 1.6); cab.add(cabGlow);
  let scrMode = 'glitch', scrT = 0, bootStart = 0, bootTitle = '';
  function drawScr(t) {
    const g = sg, w = 256, h = 192;
    if (scrMode === 'glitch') {
      g.fillStyle = '#0a0a22'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { g.fillStyle = ['#ff4fa3', '#38e1ff', '#ffc83d', '#7dff7d'][i % 4] + '88'; const y = (i * 37 + t * 140) % h; g.fillRect(Math.sin(t * 5 + i) * 40 + 40, y, 60 + (i * 31 % 120), 5 + (i % 3) * 4); }
      g.fillStyle = '#fff'; g.font = `900 22px ${FONT}`; g.textAlign = 'center'; g.fillText('ERROR 0xBUG', w / 2 + Math.sin(t * 30) * 3, 84); g.font = `700 14px ${FONT}`; g.fillStyle = '#ff9aa8'; g.fillText('沒有遊戲可以玩…', w / 2, 112);
      if (Math.random() < .08) { g.fillStyle = '#ffffff55'; g.fillRect(0, 0, w, h); }
    } else if (scrMode === 'boot') {
      const p = Math.min(1, (t - bootStart) / 1.1);
      g.fillStyle = '#0a0a22'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffc83d'; g.font = `900 26px ${FONT}`; g.textAlign = 'center'; g.fillText(bootTitle, w / 2, 80);
      g.fillStyle = '#38e1ff'; g.font = `700 14px ${FONT}`; g.fillText('LOADING…', w / 2, 112); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(48, 126, 160, 14); g.fillStyle = '#7dff7d'; g.fillRect(50, 128, 156 * p, 10);
    } else if (scrMode === 'idle') {
      g.fillStyle = '#0a0a22'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffc83d'; g.font = `900 20px ${FONT}`; g.textAlign = 'center'; g.fillText('插入卡帶', w / 2, 90); g.fillStyle = '#fff'; g.font = `14px ${FONT}`; if (Math.floor(t * 2) % 2) g.fillText('INSERT CARTRIDGE', w / 2, 118);
    }
    scrTex.needsUpdate = true;
  }

  /* ---------- 粒子 ---------- */
  const PN = 240, pPos = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN), pCol = new Float32Array(PN * 3);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({size: .13, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); points.frustumCulled = false; scene.add(points);
  for (let i = 0; i < PN; i++) pPos[i * 3 + 1] = -99;
  let pi = 0;
  function burst(p, color = 0xffc83d, n = 40, spd = 3) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k++) { const i = (pi++) % PN; pPos.set([p.x, p.y, p.z], i * 3); const a = Math.random() * 6.283, b = (Math.random() - .3) * 2; pVel.set([Math.cos(a) * Math.random() * spd, b * spd * .7 + 1, Math.sin(a) * Math.random() * spd], i * 3); pLife[i] = .5 + Math.random() * .6; pCol.set([c.r, c.g, c.b], i * 3); }
  }

  /* ---------- 卡帶（沿用導覽 v1 的樣式，加上閃光） ---------- */
  function labelTex(id) {
    const m = info(id), spare = !META[id];
    return ctex(256, 256, g => {
      g.fillStyle = spare ? '#8a8aa0' : m.color; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#ffffff22'; for (let i = 0; i < 8; i++) g.fillRect(0, i * 36, 256, 14);
      g.fillStyle = '#fff'; g.strokeStyle = '#1d1840'; g.lineWidth = 8; g.lineJoin = 'round';
      g.font = `900 52px ${FONT}`; g.textAlign = 'center'; g.strokeText(m.title, 128, 64); g.fillText(m.title, 128, 64);
      g.save(); g.translate(128, 158);
      if (id === 'catch') { g.fillStyle = '#c98a4b'; g.beginPath(); g.moveTo(-50, 10); g.lineTo(50, 10); g.lineTo(38, 56); g.lineTo(-38, 56); g.fill(); g.fillStyle = '#e8483a'; g.beginPath(); g.arc(-18, -20, 22, 0, 7); g.arc(24, -34, 20, 0, 7); g.fill(); }
      else if (id === 'slice') { g.fillStyle = '#e8483a'; g.beginPath(); g.arc(-14, 6, 40, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.moveTo(-60, -30); g.lineTo(50, 50); g.stroke(); }
      else if (id === 'dodge') { g.fillStyle = '#5a4636'; g.beginPath(); g.arc(-26, -18, 32, 0, 7); g.arc(40, 20, 22, 0, 7); g.fill(); g.fillStyle = '#38e1ff'; g.beginPath(); g.moveTo(0, 6); g.lineTo(18, 50); g.lineTo(-18, 50); g.fill(); }
      else if (id === 'fight') { g.fillStyle = '#d65db1'; g.beginPath(); g.arc(0, -8, 40, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-14, -14, 10, 0, 7); g.arc(14, -14, 10, 0, 7); g.fill(); g.fillStyle = '#ffc83d'; g.fillRect(-4, 34, 8, 26); }
      else if (id === 'parkour') { g.fillStyle = '#fff'; g.fillRect(-60, 50, 120, 10); g.beginPath(); g.arc(0, -20, 14, 0, 7); g.fill(); g.fillRect(-4, -6, 8, 30); }
      else { g.fillStyle = '#fff'; g.fillRect(-44, -34, 40, 40); g.fillRect(4, -34, 40, 40); g.fillRect(-44, 14, 40, 40); }
      g.restore();
    });
  }
  const shineTex = ctex(128, 128, g => { const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#fff0'); gr.addColorStop(.45, '#fff0'); gr.addColorStop(.5, '#ffffffcc'); gr.addColorStop(.55, '#fff0'); gr.addColorStop(1, '#fff0'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  function makeCart(id) {
    const g = new THREE.Group(); const spare = !META[id];
    const bodyMat = new THREE.MeshStandardMaterial({color: spare ? 0x555566 : 0x23203f, roughness: .45, metalness: .15});
    const sh = new THREE.Shape(); const w = 1.1, ht = 1.35, r = .12, nt = .22;
    sh.moveTo(-w + r, -ht); sh.lineTo(w - r, -ht); sh.quadraticCurveTo(w, -ht, w, -ht + r); sh.lineTo(w, ht - nt); sh.lineTo(w - .35, ht - nt); sh.lineTo(w - .35, ht); sh.lineTo(-w + .35, ht); sh.lineTo(-w + .35, ht - nt); sh.lineTo(-w, ht - nt); sh.lineTo(-w, -ht + r); sh.quadraticCurveTo(-w, -ht, -w + r, -ht);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, {depth: .34, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3}), bodyMat); body.position.z = -.17; g.add(body);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshStandardMaterial({map: labelTex(id), roughness: .35})); lab.position.set(0, .12, .235); g.add(lab);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 1.82), new THREE.MeshStandardMaterial({color: 0x0f0d28, roughness: .6})); frame.position.set(0, .12, .228); g.add(frame);
    const shine = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({map: shineTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false})); shine.position.set(0, .12, .24); shine.material.map = shineTex.clone(); shine.material.map.needsUpdate = true; g.add(shine);
    for (let i = 0; i < 7; i++) { const pin = new THREE.Mesh(new THREE.BoxGeometry(.1, .22, .04), new THREE.MeshStandardMaterial({color: 0xffc83d, metalness: .9, roughness: .25})); pin.position.set(-.72 + i * .24, -ht + .12, 0); g.add(pin); }
    if (spare) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .32), new THREE.MeshBasicMaterial({map: ctex(256, 54, x => { x.fillStyle = '#1d1840'; x.fillRect(0, 0, 256, 54); x.fillStyle = '#ffc83d'; x.font = `bold 30px ${FONT}`; x.textAlign = 'center'; x.fillText('備用・未開放', 128, 38); })})); s.position.set(0, -.78, .26); g.add(s); }
    g.userData = {id, shine, ty: {x: 0, y: 0, z: -30, rx: 0, ry: 0, s: .01}};
    return g;
  }
  const cartGroup = new THREE.Group(); cartGroup.position.set(0, 0, 1.2); scene.add(cartGroup);
  const carts = CART_IDS.map(id => { const c = makeCart(id); cartGroup.add(c); c.position.set(0, 0, -30); c.scale.setScalar(.01); return c; });
  const byId = Object.fromEntries(carts.map(c => [c.userData.id, c]));
  const setC = (c, o) => Object.assign(c.userData.ty, {x: 0, y: 0, z: -30, rx: 0, ry: 0, s: .01}, o);

  /* ---------- 人物 ---------- */
  const loader = new GLTFLoader();
  const animGltf = await loader.loadAsync('/models/anims.glb');
  // 街機：Blender 5 雲端管線做的原創 GLB（Screen 貼畫面、Marquee 貼招牌）
  const CAB_SCALE = 2.1; const cabSlot = new THREE.Vector3(0, .52, .6);
  try {
    const cg = await loader.loadAsync('/models/arcade_cabinet.glb'); const cm = cg.scene; cm.scale.setScalar(CAB_SCALE);
    const planarUV = o => { const g = o.geometry; g.computeBoundingBox(); const bb = g.boundingBox, p = g.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x || 1); uv[i * 2 + 1] = 1 - (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y || 1); } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); };
    cm.traverse(o => { if (o.isMesh && (o.name === 'Screen' || o.name === 'Marquee')) planarUV(o); if (!o.isMesh) return; if (o.name === 'Screen') o.material = new THREE.MeshBasicMaterial({map: scrTex}); else if (o.name === 'Marquee') o.material = new THREE.MeshBasicMaterial({map: marqTex}); });
    cab.add(cm); view_cab = cm;
  } catch (e) { console.warn('街機 GLB 載入失敗', e); }
  const clips = Object.fromEntries(animGltf.animations.map(a => [a.name, a]));
  const shadowTex = ctex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, '#000a'); gr.addColorStop(1, '#0000'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const actors = {};
  async function addActor(key, x, z, opts = {}) {
    if (actors[key]) return actors[key];
    const gl = await loader.loadAsync(`/models/${CHARS[key].file}.glb`);
    const root = gl.scene; const g = new THREE.Group(); g.add(root);
    const b = new THREE.Box3().setFromObject(root); const s = 1.75 / (b.max.y - b.min.y); root.scale.setScalar(s); root.position.y = -b.min.y * s;
    const sd = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({map: shadowTex, transparent: true, depthWrite: false})); sd.rotation.x = -Math.PI / 2; sd.position.y = .02; g.add(sd);
    const mixer = new THREE.AnimationMixer(root);
    const a = {key, g, mixer, cur: null, tx: x, tz: z, face: opts.face ?? 0, speed: 2.0, onArrive: null, hop: 0};
    a.play = (n, fade = .22, once = false) => { if (a.cur === n || !clips[n]) return; const act = mixer.clipAction(clips[n]); act.reset(); act.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); act.clampWhenFinished = once; act.fadeIn(fade).play(); if (a.act) a.act.fadeOut(fade); a.act = act; a.cur = n; };
    a.once = (n, back = 'Idle') => { if (!clips[n]) return; a.cur = null; a.play(n, .15, true); clearTimeout(a.bt); a.bt = setTimeout(() => { a.cur = null; a.play(back, .3); }, Math.max(300, clips[n].duration * 1000 - 120)); };
    a.goto = (nx, nz, face, cb) => { a.tx = nx; a.tz = nz; if (face != null) a.face = face; a.onArrive = cb || null; };
    g.position.set(x, 0, z); g.rotation.y = a.face; a.play('Idle'); scene.add(g); actors[key] = a; return a;
  }
  function stepActor(a, dt) {
    const dx = a.tx - a.g.position.x, dz = a.tz - a.g.position.z, d = Math.hypot(dx, dz);
    if (d > .06) { const v = Math.min(d, a.speed * dt); a.g.position.x += dx / d * v; a.g.position.z += dz / d * v; const ang = Math.atan2(dx, dz); let da = ang - a.g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); a.g.rotation.y += da * Math.min(1, dt * 10); a.play('Walking_A'); }
    else { let da = a.face - a.g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); a.g.rotation.y += da * Math.min(1, dt * 8); if (a.cur === 'Walking_A') { a.play('Idle'); if (a.onArrive) { const f = a.onArrive; a.onArrive = null; f(); } } }
    a.mixer.update(dt);
  }

  /* ---------- Bug 怪 ---------- */
  const bug = new THREE.Group(); bug.visible = false; scene.add(bug);
  { const body = new THREE.Mesh(new THREE.SphereGeometry(.34, 18, 14), mat(0x7ad84a, {roughness: .4})); body.scale.set(1.2, .9, 1.1); bug.add(body);
    const eyeM = mat(0xffffff, {roughness: .2}), pupM = mat(0x111111);
    [-.14, .14].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), eyeM); e.position.set(x, .12, .26); bug.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), pupM); p.position.set(x, .12, .35); bug.add(p); });
    const antM = mat(0x3a7a2a);
    [-.12, .12].forEach(x => { const a = new THREE.Mesh(new THREE.CylinderGeometry(.015, .02, .38, 6), antM); a.position.set(x, .45, .1); a.rotation.z = x < 0 ? .4 : -.4; bug.add(a); const t = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), mat(0xff4fa3, {emissive: 0xff4fa3, emissiveIntensity: .8})); t.position.set(x * 2.5, .62, .1); bug.add(t); });
    for (let i = 0; i < 3; i++) [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .3, 6), antM); l.position.set(s * .36, -.18, -.1 + i * .16); l.rotation.z = s * 1.0; bug.add(l); });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(.07, .014, 6, 12, Math.PI), pupM); mouth.position.set(0, -.02, .34); mouth.rotation.z = Math.PI; bug.add(mouth); }
  let bugState = {t: 0, home: new THREE.Vector3(0, 1.45, -.6), caught: false};

  /* ---------- 鏡頭 ---------- */
  const SHOTS = { // 第一人稱：鏡頭就是玩家的眼睛（眼高約 1.55）
    portal: {p: [0, 1.5, 8], l: [0, 1.3, 0]},
    room: {p: [0, 1.55, 5.6], l: [0, 1.25, -1]},
    boss: {p: [0, 1.6, 6.0], l: [0, 1.3, -1.8]},
    pair: {p: [0, 1.6, 6.0], l: [0, 1.3, -1.8]},
    customers: {p: [0, 1.7, 7.6], l: [0, 1.1, 0]},
    cabinet: {p: [-1.8, 1.7, 5.0], l: [-5.0, 1.6, -1.4]},
    desk: {p: [0, 1.5, 4.6], l: [0, 1.0, -1.2]},
    types: {p: [0, 1.55, 5.4], l: [0, 1.2, 0]}
  };
  let shot = 'portal', camLook = new THREE.Vector3(...SHOTS.portal.l);
  camera.position.set(...SHOTS.portal.p);
  let prevShot = 'room', mode = 'portal', pickCb = null, insertId = null, hoverKey = null, flashEl = null, t0 = performance.now();
  const roomVisible = v => { room.visible = v; cartGroup.visible = true; scene.background = new THREE.Color(v ? 0x151240 : 0x0b0926); };
  roomVisible(false);
  const stars = (() => { const n = 220, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 40; pos[i * 3 + 1] = Math.random() * 16 - 4; pos[i * 3 + 2] = -Math.random() * 20 - 3; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({color: 0xffffff, size: .09})); scene.add(p); return p; })();

  function layout(m) {
    mode = m;
    carts.forEach(c => setC(c, {z: -30}));
    if (m === 'portal') setC(byId.catch, {x: 0, y: .3, z: 2.2, s: .95, ry: .3});
    if (m === 'types') { setC(byId.parkour, {x: -.55, y: 1.52, z: -2.4, s: .26, ry: .15}); setC(byId.puzzle, {x: .55, y: 1.52, z: -2.4, s: .26, ry: -.15}); }
    if (m === 'recipe') ['catch', 'slice', 'dodge', 'fight'].forEach((id, i) => setC(byId[id], {x: (i - 1.5) * 1.9, y: 1.1, z: 0, s: .56}));
    if (m === 'go') setC(byId.catch, {x: -3.0, y: 1.9, z: 2.2, s: .62, ry: .2, rx: -.1});
  }

  /* ---------- 操作 ---------- */
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, camera);
    if (mode === 'types') { const hit = ray.intersectObjects(carts, true)[0]; if (hit) { let o = hit.object; while (o && !o.userData.id) o = o.parent; if (o) return {kind: 'cart', id: o.userData.id}; } }
    if (mode === 'types') for (const k of ['mei', 'ting', 'lin', 'yu']) { const a = actors[k]; if (a) { const bx = new THREE.Box3(); bx.min.set(a.g.position.x - .55, 0, a.g.position.z - .45); bx.max.set(a.g.position.x + .55, 1.9, a.g.position.z + .45); if (ray.ray.intersectsBox(bx)) return {kind: 'npc', id: k}; } }
    if (bug.visible && !bugState.caught) { const hit = ray.intersectObject(bug, true)[0]; if (hit) return {kind: 'bug'}; }
    return null;
  }
  canvas.addEventListener('pointermove', e => { const p = pick(e); hoverKey = p ? p.kind + ':' + p.id : null; canvas.style.cursor = p ? 'pointer' : 'default'; });
  canvas.addEventListener('click', e => { if (insertId) return; const p = pick(e); if (p && pickCb) pickCb(p); });
  function resize() { const w = innerWidth, hh = innerHeight; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.fov = w / hh < 1 ? 70 : 52; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  // 對話泡泡（DOM）
  const bub = document.createElement('div'); bub.id = 'bubble'; bub.hidden = true; document.body.append(bub);
  let bubKey = null;
  const flash = (ms = 600) => { flashEl = flashEl || document.getElementById('flash'); if (!flashEl) return; flashEl.style.transition = 'none'; flashEl.style.opacity = '1'; requestAnimationFrame(() => { flashEl.style.transition = `opacity ${ms}ms ease-out`; flashEl.style.opacity = '0'; }); };

  const view = {
    ready: true, flash, burst, actors, addActor, CHARS,
    shot(n) { shot = n; },
    enterRoom() { roomVisible(true); stars.visible = false; },
    layout, pickCb(cb) { pickCb = cb || null; },
    say(key, text) { bubKey = text ? key : null; bub.hidden = !text; if (text) bub.textContent = text; },
    bug(on, cb) { bug.visible = on; bugState.caught = false; bugState.cb = cb; if (on) bug.position.copy(bugState.home); },
    cabinet(m, title) { scrMode = m; bootTitle = title || ''; bootStart = (performance.now() - t0) / 1000; },
    insert(id, cb) {
      insertId = id; prevShot = shot; const c = byId[id]; const cp = new THREE.Vector3(); cab.getWorldPosition(cp);
      shot = 'cabinet'; scrMode = 'idle';
      // 卡帶飛到街機前、轉正，再插進去
      const W = p => cartGroup.worldToLocal(cab.localToWorld(p.clone()));
      const a1 = W(new THREE.Vector3(0, 1.4, 2.0)), a2 = W(cabSlot.clone().add(new THREE.Vector3(0, 0, .02)));
      setC(c, {x: a1.x, y: a1.y, z: a1.z, s: .5, rx: -.5, ry: .3});
      setTimeout(() => { c.userData.ty = {x: a2.x, y: a2.y + .2, z: a2.z + .1, rx: 0, ry: .3, s: .3}; }, 700);
      const sp = cab.localToWorld(cabSlot.clone()), sc2 = cab.localToWorld(new THREE.Vector3(0, 1.9, .9));
      setTimeout(() => { burst(sp, 0xffc83d, 70, 4); burst(sc2, 0x38e1ff, 40, 3); flash(500); scrMode = 'boot'; bootTitle = META[id] ? META[id].title : id; bootStart = (performance.now() - t0) / 1000; }, 1150);
      setTimeout(cb, 2400);
    },
    eject() { if (insertId) { layout(mode); insertId = null; scrMode = 'glitch'; shot = prevShot; } }
  };

  // 迴圈
  const clock = new THREE.Clock(); const tmp = new THREE.Vector3();
  (function loop() {
    const dt = Math.min(.05, clock.getDelta()), t = (performance.now() - t0) / 1000;
    const S = SHOTS[shot]; camera.position.x += (S.p[0] - camera.position.x) * .045; camera.position.y += (S.p[1] - camera.position.y) * .045; camera.position.z += (S.p[2] - camera.position.z) * .045;
    camera.position.y += Math.sin(t * 1.3) * .004; camera.position.x += Math.sin(t * .7) * .003;
    camLook.x += (S.l[0] - camLook.x) * .05; camLook.y += (S.l[1] - camLook.y) * .05; camLook.z += (S.l[2] - camLook.z) * .05; camera.lookAt(camLook);
    carts.forEach((c, i) => {
      const ty = c.userData.ty, id = c.userData.id, hov = hoverKey === 'cart:' + id && !insertId;
      const floaty = (mode === 'types' && !insertId) ? Math.sin(t * 1.4 + i * .9) * .06 : (mode === 'portal' || mode === 'recipe') ? Math.sin(t * 1.6 + i) * .12 : 0;
      const spin = (mode === 'portal' && id === 'catch') ? Math.sin(t * .8) * .6 : (hov ? Math.sin(t * 3) * .14 : 0);
      c.position.x += (ty.x - c.position.x) * .1; c.position.y += (ty.y + (hov ? .35 : 0) + floaty - c.position.y) * .1; c.position.z += (ty.z - c.position.z) * .1;
      c.rotation.x += (ty.rx - c.rotation.x) * .1; c.rotation.y += ((ty.ry + spin) - c.rotation.y) * .12;
      c.scale.setScalar(c.scale.x + (ty.s - c.scale.x) * .1);
      c.userData.shine.material.map.offset.set(((t * .5 + i * .3) % 2) - .5 - (hov ? 0 : 0), ((t * .5 + i * .3) % 2) - .5);
    });
    Object.values(actors).forEach(a => stepActor(a, dt));
    if (bug.visible) { bugState.t += dt; const b = bugState; bug.position.set(b.home.x + Math.sin(b.t * 1.3) * 1.2, b.home.y + Math.abs(Math.sin(b.t * 5)) * .25, b.home.z + Math.cos(b.t * .9) * .15); bug.rotation.y = Math.sin(b.t * 1.3 + 1.2) * .6; bug.scale.setScalar(hoverKey === 'bug:undefined' ? 1.2 : 1); }
    if (room.visible) { drawScr(t); warm.intensity = 28 + Math.sin(t * 7) * (scrMode === 'glitch' ? 4 : 1); pinkL.intensity = 26 + Math.sin(t * 3) * 6; }
    // 粒子
    for (let i = 0; i < PN; i++) { if (pLife[i] > 0) { pLife[i] -= dt; pVel[i * 3 + 1] -= 4 * dt; pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt; if (pLife[i] <= 0) pPos[i * 3 + 1] = -99; } }
    pg.attributes.position.needsUpdate = true;
    // 泡泡位置
    if (bubKey && actors[bubKey]) { tmp.copy(actors[bubKey].g.position); tmp.y += 2.05; tmp.project(camera); bub.style.left = ((tmp.x * .5 + .5) * innerWidth) + 'px'; bub.style.top = ((-tmp.y * .5 + .5) * innerHeight) + 'px'; }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
  view.bugCaught = () => { bugState.caught = true; burst(bug.position, 0x7ad84a, 60, 4); burst(bug.position, 0xffffff, 30, 3); bug.visible = false; };
  view.pick = pick; window.__world = view;
  return view;
}
