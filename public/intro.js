// 開幕導覽：故事 → 遊戲是什麼 → 遊戲類型（卡帶試玩）→ 配方卡 → 插卡帶進店
import {GAMES, META} from '/minigames.js';

const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function toast(t) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { e.hidden = true; }, 3000); }

const STEPS = ['開幕故事', '遊戲是什麼', '遊戲類型', '配方卡', '出發'];
const KEY = 'ninja-l0-v1';
let S = null; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* 第一次 */ }
S = S || {step: 0, done: [], played: {}, quiz: false};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 不影響 */ } };

const CART_IDS = ['catch', 'slice', 'dodge', 'fight', 'parkour', 'puzzle'];
const SPARE = {parkour: {title: '跑酷', color: '#e8883a'}, puzzle: {title: '益智', color: '#3aa8a8'}};
const info = id => META[id] || SPARE[id];

let view = null; // 3D 控制：{mode, pick, insert}
function renderSteps() {
  const n = $('#steps'); n.replaceChildren(...STEPS.map((name, i) => h('div', {class: 'dot' + (i === S.step ? ' cur' : '') + (S.done[i] ? ' done' : '')}, h('b', {}, S.done[i] ? '✓' : String(i + 1)), name)));
}
function done(i) { S.done[i] = true; save(); renderSteps(); }
function go(i) {
  S.step = i; save(); renderSteps();
  [stepStory, stepWhat, stepTypes, stepRecipe, stepGo][i]();
}

/* ---------- 步驟 1：故事 ---------- */
function stepStory() {
  view && view.mode('story');
  const pages = [
    ['街機城剛開幕！', '可是老闆遇到一個大麻煩：店裡所有的遊戲機都壞了，因為沒有人會做遊戲。'],
    ['老闆在找學徒', '他需要一位「遊戲設計師學徒」。做出好玩的遊戲，街機城才會熱鬧起來。這個學徒，就是你。'],
    ['先搞懂，再動手', '不過在動手之前，老闆要先考考你：遊戲到底是什麼？有哪幾種？它們是怎麼做出來的？']
  ];
  let p = 0;
  const card = $('#card'); const draw = () => {
    card.replaceChildren(h('span', {class: 'tag'}, `第 1 步・開幕故事（${p + 1}/3）`), h('h2', {}, pages[p][0]), h('div', {class: 'lead'}, pages[p][1]),
      h('div', {class: 'row'}, p ? h('button', {class: 'btn sec', onclick: () => { p--; draw(); }}, '上一頁') : h('span'),
        h('button', {class: 'btn', onclick: () => { if (p < 2) { p++; draw(); } else { done(0); go(1); } }}, p < 2 ? '下一頁' : '好，先來學')));
  };
  draw();
}

/* ---------- 步驟 2：遊戲是什麼 ---------- */
function stepWhat() {
  view && view.mode('what');
  const els = [['玩家', '你控制的東西', '例：籃子'], ['場上的東西', '會出現、會動的東西', '例：蘋果、炸彈'], ['規則', '碰到會發生什麼事', '例：接到蘋果加分'], ['勝負', '什麼時候結束、算贏還是輸', '例：三條命用完']];
  const items = [['籃子', 0], ['掉下來的蘋果和炸彈', 1], ['接到蘋果就加 1 分', 2], ['三條命用完，遊戲結束', 3], ['碰到炸彈少一條命', 2]];
  let right = 0;
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = () => { done(1); go(2); };
  const card = $('#card');
  card.replaceChildren(h('span', {class: 'tag'}, '第 2 步・遊戲是什麼'), h('h2', {}, '每個遊戲都有四樣東西'),
    h('div', {class: 'grid4'}, els.map(e => h('div', {class: 'el'}, h('b', {}, e[0]), e[1], h('br'), e[2]))),
    h('div', {class: 'lead', style: 'font-size:16px;margin:4px 0'}, '來考考你：下面是「接水果」裡的東西，它們各是哪一種？'),
    ...items.map(([t, a]) => {
      const row = h('div', {class: 'item'}, h('div', {class: 't'}, t));
      els.forEach((e, i) => row.append(h('button', {onclick: () => {
        if (row.classList.contains('right')) return;
        if (i === a) { row.className = 'item right'; row.querySelectorAll('button').forEach(b => { b.disabled = true; }); row.append(h('b', {style: 'color:#1f6a43'}, '✓ ' + e[0])); if (++right === items.length) { nb.disabled = false; toast('全部答對了！'); } }
        else { row.classList.add('wrong'); setTimeout(() => row.classList.remove('wrong'), 500); }
      }}, e[0])));
      return row;
    }),
    h('div', {class: 'row'}, h('button', {class: 'btn sec', onclick: () => go(0)}, '上一步'), nb));
  if (S.done[1]) nb.disabled = false;
}

/* ---------- 步驟 3：遊戲類型（卡帶） ---------- */
let stopGame = null;
const withInsert = (id, cb) => view ? view.insert(id, cb) : cb();
function openGame(id) {
  const m = META[id]; if (!m) { toast(`「${SPARE[id].title}」是備用卡帶，這學期先不開放。`); return; }
  withInsert(id, () => {
    $('#modal').hidden = false; $('#gtitle').textContent = m.title; $('#gtip').textContent = m.tip + '（按「開始玩」）';
    $('#gplay').disabled = false;
    const cv = $('#game'); cv.getContext('2d').clearRect(0, 0, 480, 360);
    $('#gplay').onclick = () => {
      stopGame && stopGame(); $('#gplay').disabled = true; $('#gtip').textContent = m.tip;
      stopGame = GAMES[id](cv, txt => { S.played[id] = true; save(); $('#gtip').textContent = `${txt}。你試玩過「${m.title}」了！可以關閉換下一張卡帶。`; $('#gplay').disabled = false; $('#gplay').textContent = '再玩一次'; refreshTypes(); });
    };
  });
}
function closeGame() { stopGame && stopGame(); stopGame = null; $('#modal').hidden = true; $('#gplay').textContent = '▶ 開始玩'; view && view.eject(); }
$('#gclose').onclick = closeGame;
let refreshTypes = () => { };
function stepTypes() {
  view && view.mode('types', openGame);
  const ids = Object.keys(META);
  const played = h('div', {class: 'played'});
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = () => { done(2); go(3); };
  refreshTypes = () => {
    played.replaceChildren(...ids.map(id => h('span', {class: S.played[id] ? 'ok' : ''}, (S.played[id] ? '✓ ' : '') + META[id].title)));
    nb.disabled = !ids.every(id => S.played[id]);
  };
  refreshTypes();
  $('#card').replaceChildren(h('span', {class: 'tag'}, '第 3 步・遊戲類型'), h('h2', {}, '街機城的卡帶架'),
    h('div', {class: 'lead', style: 'font-size:16px'}, '每一張卡帶是一種遊戲。點一張，把它插進主機，試玩看看。四款都要玩過，下一步才會打開。灰色的是備用卡帶，這學期先不開放。'),
    played, h('div', {class: 'row'}, h('button', {class: 'btn sec', onclick: () => go(1)}, '上一步'), nb));
}

/* ---------- 步驟 4：配方卡 ---------- */
function stepRecipe() {
  view && view.mode('recipe');
  const ids = Object.keys(META);
  const Q = [
    ['想讓「滑鼠劃過就切開」，要用到滑鼠的 x、y 座標。這最像哪一款？', 'slice'],
    ['「按下空白鍵就發射一顆子彈」，這最像哪一款？', 'fight'],
    ['用計時器算出「撐了幾秒」當分數，這最像哪一款？', 'dodge'],
    ['左右鍵移動籃子，再用「分身」做出一直掉下來的東西，這最像哪一款？', 'catch']
  ];
  let ok = 0;
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = () => { done(3); S.quiz = true; save(); go(4); };
  const card = $('#card');
  card.replaceChildren(h('span', {class: 'tag'}, '第 4 步・配方卡'), h('h2', {}, '每款遊戲都有一張配方卡'),
    h('div', {class: 'lead', style: 'font-size:16px'}, '做遊戲前，先把配方寫下來。你以後做自己的遊戲，也要先畫一張。'),
    ...ids.map(id => { const m = META[id]; return h('div', {class: 'recipe', style: `border-color:${m.color}`}, h('h3', {style: `color:${m.color}`}, m.title),
      h('div', {}, `玩家：${m.recipe.player}`), h('div', {}, `場上的東西：${m.recipe.things}`), h('div', {}, `規則：${m.recipe.rule}`), h('div', {}, `勝負：${m.recipe.end}`),
      h('div', {class: 'chips'}, m.blocks.map(b => h('span', {class: 'chip'}, '🧩 ' + b)))); }),
    h('div', {class: 'lead', style: 'font-size:16px;margin-top:10px'}, '小測驗：配方裡的積木，分別是哪一款要用的？'),
    ...Q.map(([q, a]) => {
      const row = h('div', {class: 'item'}, h('div', {class: 't'}, q));
      ids.forEach(id => row.append(h('button', {onclick: () => {
        if (row.classList.contains('right')) return;
        if (id === a) { row.className = 'item right'; row.querySelectorAll('button').forEach(b => { b.disabled = true; }); row.append(h('b', {style: 'color:#1f6a43'}, '✓ ' + META[id].title)); if (++ok === Q.length) { nb.disabled = false; toast('配方卡難不倒你！'); } }
        else { row.classList.add('wrong'); setTimeout(() => row.classList.remove('wrong'), 500); }
      }}, META[id].title)));
      return row;
    }),
    h('div', {class: 'row'}, h('button', {class: 'btn sec', onclick: () => go(2)}, '上一步'), nb));
  if (S.quiz) nb.disabled = false;
}

/* ---------- 步驟 5：出發 ---------- */
function stepGo() {
  view && view.mode('go');
  $('#card').replaceChildren(h('span', {class: 'tag'}, '第 5 步・出發'), h('h2', {}, '老闆說：先從最簡單的開始'),
    h('div', {class: 'lead'}, '你已經知道遊戲是什麼、有哪幾種、配方怎麼寫。老闆把「接東西」的卡帶交給你：「把它做出來吧！」'),
    h('div', {class: 'row'}, h('button', {class: 'btn sec', onclick: () => go(3)}, '上一步'),
      h('button', {class: 'btn', onclick: () => { done(4); withInsert('catch', () => setTimeout(() => { location.href = '/level1.html'; }, 500)); }}, '插入卡帶，進「接東西」')));
}

/* ---------- 3D：卡帶與主機 ---------- */
async function start3d() {
  const THREE = await import('/vendor/three.module.js');
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  { const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0b0926'); gr.addColorStop(.6, '#2b2a7a'); gr.addColorStop(1, '#6a3a98'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100); camera.position.set(0, -1.0, 9);
  scene.add(new THREE.HemisphereLight(0xaab0ff, 0x2a2450, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 6, 8); key.castShadow = true; scene.add(key);
  const pl1 = new THREE.PointLight(0xff4fa3, 70, 24); pl1.position.set(-6, 2, 4); scene.add(pl1);
  const pl2 = new THREE.PointLight(0x38e1ff, 70, 24); pl2.position.set(6, 2, 4); scene.add(pl2);
  const grid = new THREE.GridHelper(60, 40, 0xff4fa3, 0x4a3fb0); grid.position.y = -3; scene.add(grid);
  { const n = 160, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 40; pos[i * 3 + 1] = Math.random() * 16 - 3; pos[i * 3 + 2] = -Math.random() * 20; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({color: 0xffffff, size: .08, fog: false}))); }

  const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
  function labelTex(id) {
    const m = info(id), spare = !META[id];
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = spare ? '#8a8aa0' : m.color; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#ffffff22'; for (let i = 0; i < 8; i++) g.fillRect(0, i * 36, 256, 14);
    g.fillStyle = '#fff'; g.strokeStyle = '#1d1840'; g.lineWidth = 8; g.lineJoin = 'round';
    g.font = `900 52px ${FONT}`; g.textAlign = 'center'; g.strokeText(m.title, 128, 64); g.fillText(m.title, 128, 64);
    // 圖示
    g.save(); g.translate(128, 158);
    if (id === 'catch') { g.fillStyle = '#c98a4b'; g.beginPath(); g.moveTo(-50, 10); g.lineTo(50, 10); g.lineTo(38, 56); g.lineTo(-38, 56); g.fill(); g.fillStyle = '#e8483a'; g.beginPath(); g.arc(-18, -20, 22, 0, 7); g.arc(24, -34, 20, 0, 7); g.fill(); }
    else if (id === 'slice') { g.fillStyle = '#e8483a'; g.beginPath(); g.arc(-14, 6, 40, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.moveTo(-60, -30); g.lineTo(50, 50); g.stroke(); }
    else if (id === 'dodge') { g.fillStyle = '#5a4636'; g.beginPath(); g.arc(-26, -18, 32, 0, 7); g.arc(40, 20, 22, 0, 7); g.fill(); g.fillStyle = '#38e1ff'; g.beginPath(); g.moveTo(0, 6); g.lineTo(18, 50); g.lineTo(-18, 50); g.fill(); }
    else if (id === 'fight') { g.fillStyle = '#d65db1'; g.beginPath(); g.arc(0, -8, 40, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-14, -14, 10, 0, 7); g.arc(14, -14, 10, 0, 7); g.fill(); g.fillStyle = '#ffc83d'; g.fillRect(-4, 34, 8, 26); }
    else if (id === 'parkour') { g.fillStyle = '#fff'; g.fillRect(-60, 50, 120, 10); g.beginPath(); g.arc(0, -20, 14, 0, 7); g.fill(); g.fillRect(-4, -6, 8, 30); }
    else { g.fillStyle = '#fff'; g.fillRect(-44, -34, 40, 40); g.fillRect(4, -34, 40, 40); g.fillRect(-44, 14, 40, 40); }
    g.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function makeCart(id) {
    const g = new THREE.Group(); const spare = !META[id];
    const col = spare ? 0x555566 : 0x23203f;
    const bodyMat = new THREE.MeshStandardMaterial({color: col, roughness: .55, metalness: .1});
    const sh = new THREE.Shape(); const w = 1.1, ht = 1.35, r = .12, nt = .22;
    sh.moveTo(-w + r, -ht); sh.lineTo(w - r, -ht); sh.quadraticCurveTo(w, -ht, w, -ht + r); sh.lineTo(w, ht - nt); sh.lineTo(w - .35, ht - nt); sh.lineTo(w - .35, ht); sh.lineTo(-w + .35, ht); sh.lineTo(-w + .35, ht - nt); sh.lineTo(-w, ht - nt); sh.lineTo(-w, -ht + r); sh.quadraticCurveTo(-w, -ht, -w + r, -ht);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, {depth: .34, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3}), bodyMat); body.position.z = -.17; body.castShadow = true; g.add(body);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshStandardMaterial({map: labelTex(id), roughness: .4, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0})); lab.position.set(0, .12, .235); g.add(lab);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 1.82), new THREE.MeshStandardMaterial({color: 0x0f0d28, roughness: .6})); frame.position.set(0, .12, .228); g.add(frame);
    for (let i = 0; i < 5; i++) { const rg = new THREE.Mesh(new THREE.BoxGeometry(1.6, .035, .05), bodyMat); rg.position.set(0, ht - .52 - i * .0 + 0, .22); rg.visible = false; g.add(rg); }
    for (let i = 0; i < 7; i++) { const pin = new THREE.Mesh(new THREE.BoxGeometry(.1, .22, .04), new THREE.MeshStandardMaterial({color: 0xffc83d, metalness: .9, roughness: .25})); pin.position.set(-.72 + i * .24, -ht + .12, .0); g.add(pin); }
    if (spare) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .32), new THREE.MeshBasicMaterial({map: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 54; const x = c.getContext('2d'); x.fillStyle = '#1d1840'; x.fillRect(0, 0, 256, 54); x.fillStyle = '#ffc83d'; x.font = `bold 30px ${FONT}`; x.textAlign = 'center'; x.fillText('備用・未開放', 128, 38); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })()})); s.position.set(0, -.78, .26); g.add(s); }
    g.userData = {id, ty: {x: 0, y: 0, z: 0, rx: 0, ry: 0, s: 1}};
    return g;
  }
  const carts = CART_IDS.map(id => { const c = makeCart(id); scene.add(c); c.position.set(0, 0, -30); c.scale.setScalar(.01); return c; });
  const byId = Object.fromEntries(carts.map(c => [c.userData.id, c]));

  // 主機
  const consoleG = new THREE.Group(); scene.add(consoleG);
  const cm = new THREE.MeshStandardMaterial({color: 0x2b2766, roughness: .45, metalness: .25});
  const cb = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 2.2), cm); cb.position.set(0, -2.45, 0); cb.castShadow = true; cb.receiveShadow = true; consoleG.add(cb);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(2.6, .1, .5), new THREE.MeshStandardMaterial({color: 0x050414})); slot.position.set(0, -1.88, .45); consoleG.add(slot);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(5.0, .06, .06), new THREE.MeshStandardMaterial({color: 0x38e1ff, emissive: 0x38e1ff, emissiveIntensity: 2})); strip.position.set(0, -2.1, 1.12); consoleG.add(strip);
  const ledM = new THREE.MeshStandardMaterial({color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 2});
  [-2.1, -1.8].forEach(x => { const l = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), ledM); l.position.set(x, -2.3, 1.11); consoleG.add(l); });
  consoleG.visible = false; consoleG.position.y = 1.3;

  // 版面：每種模式幫每張卡帶設定目標
  let mode = 'story', pickCb = null, insertId = null, hoverId = null;
  const set = (c, o) => Object.assign(c.userData.ty, {x: 0, y: 0, z: 0, rx: 0, ry: 0, s: .01}, o);
  function layout(m) {
    mode = m;
    consoleG.visible = m === 'go';
    carts.forEach(c => set(c, {z: -30}));
    if (m === 'story') set(byId.catch, {x: 0, y: .25, z: 1, s: .95, ry: .3});
    if (m === 'what') set(byId.catch, {x: -4.2, y: .4, z: 0, s: .75, ry: .5});
    if (m === 'types') CART_IDS.forEach((id, i) => set(byId[id], {x: (i - 2.5) * 1.75, y: .45, z: 0, s: .64}));
    if (m === 'recipe') ['catch', 'slice', 'dodge', 'fight'].forEach((id, i) => set(byId[id], {x: (i - 1.5) * 1.9, y: .5, z: 0, s: .56}));
    if (m === 'go') set(byId.catch, {x: 0, y: .05, z: 1, s: .72, ry: 0, rx: -.1});
  }
  view = {
    mode(m, cb) { layout(m); pickCb = cb || null; },
    insert(id, cb) { insertId = id; consoleG.visible = true; set(byId[id], {x: 0, y: 1.1, z: 2.0, s: .9, rx: -.3}); setTimeout(() => { byId[id].userData.ty = {x: 0, y: -.1, z: .35, rx: -.03, ry: 0, s: .85}; }, 500); setTimeout(cb, 1100); },
    eject() { if (insertId) { layout(mode); insertId = null; } }
  };

  // 操作
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  const pick = e => { const r = canvas.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, camera); const hit = ray.intersectObjects(carts, true)[0]; if (!hit) return null; let o = hit.object; while (o && !o.userData.id) o = o.parent; return o ? o.userData.id : null; };
  canvas.addEventListener('pointermove', e => { hoverId = mode === 'types' ? pick(e) : null; canvas.style.cursor = hoverId ? 'pointer' : 'default'; });
  canvas.addEventListener('click', e => { if (mode === 'types' && !insertId) { const id = pick(e); if (id && pickCb) pickCb(id); } });
  function resize() { const w = innerWidth, hh = innerHeight; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.fov = w / hh < 1 ? 62 : 40; camera.position.z = w / hh < 1 ? 13 : 9; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  (function loop() {
    const t = clock.getElapsedTime();
    carts.forEach((c, i) => {
      const ty = c.userData.ty, id = c.userData.id, lift = (hoverId === id && !insertId) ? .35 : 0;
      const floaty = (mode === 'story' || mode === 'what' || mode === 'recipe') ? Math.sin(t * 1.6 + i) * .12 : (mode === 'types' && !insertId ? Math.sin(t * 1.4 + i * .9) * .06 : 0);
      const spin = (mode === 'story' && id === 'catch') ? Math.sin(t * .8) * .6 : (mode === 'what' && id === 'catch') ? t * .8 : (hoverId === id ? Math.sin(t * 3) * .12 : 0);
      c.position.x += (ty.x - c.position.x) * .1; c.position.y += (ty.y + lift + floaty - c.position.y) * .1; c.position.z += (ty.z - c.position.z) * .1;
      c.rotation.x += (ty.rx - c.rotation.x) * .1; c.rotation.y += ((ty.ry + spin) - c.rotation.y) * .12;
      const s = c.scale.x + (ty.s - c.scale.x) * .1; c.scale.setScalar(s);
    });
    pl1.intensity = 65 + Math.sin(t * 3) * 14; pl2.intensity = 65 + Math.cos(t * 3.3) * 14;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
  window.__intro = {ready: true, S};
}

renderSteps();
try { await start3d(); } catch (err) { console.warn('3D 開不了，改純頁面', err); document.body.classList.add('flat'); view = null; }
go(Math.min(S.step || 0, 4));
