/* 忍者道場：第 1 關「接東西」
 * 流程：玩玩看 → 拆元素 → 畫素材 → 拼積木（真的 Scratch）→ 除錯（真的 Scratch）→ 小測驗 → 完成
 * 引導步驟用全螢幕卡片，實作步驟用「左邊任務、右邊編輯器」。 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function h(tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e[k] = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      (Array.isArray(c) ? c : [c]).forEach(function (x) { e.append(x && x.nodeType ? x : document.createTextNode(x)); });
    }
    return e;
  }
  function toast(t) {
    var e = $('#toast'); e.textContent = t; e.style.display = 'block';
    clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.display = 'none'; }, 3200);
  }

  var STEPS = ['玩玩看', '拆元素', '畫素材', '拼積木', '強化模組', '除錯', '小測驗', '完成'];
  var PANELS = ['p-play', 'p-elements', 'p-workshop', 'p-code', 'p-code', 'p-code', 'p-quiz', 'p-done'];
  var KEY = 'ninja-l1-v1';
  var S = load() || { step: 0, done: [], hints: 0, art: { basket: 'basket', bc: '#c98a4b', item: 'apple', ic: '#e8483a' }, debugVariant: Math.floor(Math.random() * 3) };
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

  /* ---------- 進度列 ---------- */
  function renderSteps() {
    var n = $('#steps'); n.innerHTML = '';
    STEPS.forEach(function (name, i) {
      var cls = 'dot' + (i === S.step ? ' cur' : '') + (S.done[i] ? ' done' : '') + (i > S.step && !S.done[i] ? ' todo' : '');
      n.append(h('div', { class: cls }, h('b', {}, S.done[i] ? '✓' : String(i + 1)), name));
    });
  }
  function go(i) {
    S.step = i; save();
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('on'); });
    $('#' + PANELS[i]).classList.add('on');
    renderSteps();
    [buildPlay, buildElements, buildWorkshop, function () { enterCode('build'); }, function () { enterCode('power'); }, function () { enterCode('debug'); }, buildQuiz, buildDone][i]();
  }
  function done(i) { S.done[i] = true; save(); renderSteps(); }
  function next(i) { return h('button', { class: 'btn', onclick: function () { go(i); } }, '下一步'); }

  /* ---------- 素材（SVG 產生） ---------- */
  var COLORS = ['#e8483a', '#f29c1f', '#f2d229', '#4caf50', '#3b8ed8', '#9b59d0', '#e86aa8', '#c98a4b'];
  function basketSVG(kind, c) {
    var dark = '#3a2a1c';
    if (kind === 'bowl') return '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="56" viewBox="0 0 90 56"><path d="M4 8 H86 Q84 52 45 52 Q6 52 4 8Z" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/><rect x="2" y="4" width="86" height="9" rx="4" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/></svg>';
    if (kind === 'bucket') return '<svg xmlns="http://www.w3.org/2000/svg" width="84" height="64" viewBox="0 0 84 64"><path d="M8 10 H76 L68 58 H16Z" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/><ellipse cx="42" cy="10" rx="34" ry="7" fill="#fff6" stroke="' + dark + '" stroke-width="3"/><path d="M12 28 H72" stroke="' + dark + '" stroke-width="2.5"/></svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="60" viewBox="0 0 90 60"><path d="M6 8 H84 L74 52 Q73 56 68 56 H22 Q17 56 16 52 Z" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/><path d="M24 10 L28 54 M45 10 V56 M66 10 L62 54" stroke="' + dark + '" stroke-width="2.5" fill="none"/><rect x="3" y="4" width="84" height="9" rx="4" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/></svg>';
  }
  function itemSVG(kind, c) {
    var dark = '#3a2a1c';
    if (kind === 'star') return '<svg xmlns="http://www.w3.org/2000/svg" width="54" height="52" viewBox="0 0 54 52"><polygon points="27,3 34,19 51,20 38,31 42,48 27,39 12,48 16,31 3,20 20,19" fill="' + c + '" stroke="' + dark + '" stroke-width="3" stroke-linejoin="round"/></svg>';
    if (kind === 'cookie') return '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/><circle cx="17" cy="19" r="3.5" fill="' + dark + '"/><circle cx="33" cy="16" r="3.5" fill="' + dark + '"/><circle cx="30" cy="31" r="3.5" fill="' + dark + '"/><circle cx="18" cy="34" r="3.5" fill="' + dark + '"/></svg>';
    if (kind === 'gem') return '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="48" viewBox="0 0 52 48"><polygon points="14,4 38,4 50,18 26,46 2,18" fill="' + c + '" stroke="' + dark + '" stroke-width="3" stroke-linejoin="round"/><path d="M2 18 H50 M14 4 L20 18 L26 46 L32 18 L38 4" stroke="' + dark + '" stroke-width="2" fill="none"/></svg>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="54" viewBox="0 0 80 90"><path d="M40 14 C 12 10, 4 40, 10 60 C 16 82, 34 86, 40 80 C 46 86, 64 82, 70 60 C 76 40, 68 10, 40 14 Z" fill="' + c + '" stroke="' + dark + '" stroke-width="3"/><path d="M40 14 C 40 6, 44 2, 50 2" fill="none" stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"/><path d="M44 10 C 54 0, 66 4, 66 4 C 64 14, 52 16, 44 10 Z" fill="#3ea34a" stroke="#1f6a2b" stroke-width="2"/></svg>';
  }
  function svgSize(svg) {
    var m = svg.match(/width="(\d+)" height="(\d+)"/);
    return { w: +m[1], h: +m[2] };
  }

  /* ---------- 1 玩玩看 ---------- */
  var demoTimer = null;
  function buildPlay() {
    var p = $('#p-play'); p.innerHTML = '';
    var cv = h('canvas', { id: 'demo', width: 480, height: 360 });
    var score = h('div', { id: 'demoScore' }, '0');
    var left = h('span', { id: 'demoLeft' }, '3');
    var nb = h('button', { class: 'btn', onclick: function () { stopDemo(); done(0); go(1); } }, '玩過了，下一步');
    nb.disabled = !S.done[0];
    var start = h('button', { class: 'btn sec', onclick: function () { runDemo(cv, score, left, nb); } }, '▶ 開始玩');
    p.append(h('div', { class: 'card' },
      h('span', { class: 'tag' }, '第 1 步・玩玩看'), h('h2', {}, '今天的任務：做一個「接東西」遊戲'),
      h('div', { class: 'lead' }, '先玩玩看這個「接水果大師」。用 ← → 移動籃子，接蘋果得分；漏接蘋果、或碰到炸彈都會少一條命；越接越快。三條命用完就結束。'),
      h('div', { id: 'demoWrap' }, cv, h('div', { id: 'demoSide' },
        h('div', {}, '分數'), score, h('div', {}, '剩下 ', left, ' 條命'),
        h('div', { style: 'margin-top:10px' }, start),
        h('div', { class: 'note', style: 'margin-top:14px' }, '邊玩邊想：畫面上有哪些「東西」和「規則」？今天你先做出基本版，過關之後可以挑「強化模組」，把生命、炸彈、越接越快裝到自己的遊戲上。'))),
      h('div', { class: 'row' }, h('span'), nb)));
    drawDemo(cv.getContext('2d'), { bx: 240, fruits: [], t: 0 });
  }
  var demoImgs = null;
  function loadDemoImgs() {
    if (demoImgs) return demoImgs;
    function im(svg) { var i = new Image(); i.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); return i; }
    demoImgs = { basket: im(basketSVG('basket', '#c98a4b')), apple: im(itemSVG('apple', '#e8483a')),
      bomb: im('<svg xmlns="http://www.w3.org/2000/svg" width="52" height="60" viewBox="0 0 52 60"><circle cx="26" cy="36" r="20" fill="#2b2b33" stroke="#000" stroke-width="3"/><rect x="20" y="10" width="12" height="9" rx="2" fill="#555" stroke="#000" stroke-width="2"/><path d="M26 10 C26 4 32 4 36 2" fill="none" stroke="#a66b2c" stroke-width="3"/><circle cx="38" cy="3" r="4" fill="#ffb300"/></svg>') };
    return demoImgs;
  }
  function drawDemo(ctx, st) {
    var im = loadDemoImgs();
    ctx.fillStyle = '#d6ecff'; ctx.fillRect(0, 0, 480, 360);
    ctx.fillStyle = '#7cc27c'; ctx.fillRect(0, 330, 480, 30);
    st.fruits.forEach(function (f) { ctx.drawImage(f.bomb ? im.bomb : im.apple, f.x - 24, f.y - 27, 48, 54); });
    ctx.drawImage(im.basket, st.bx - 45, 290, 90, 60);
    if (st.life != null) {
      ctx.font = '22px sans-serif'; ctx.fillStyle = '#e8483a'; ctx.textAlign = 'left';
      ctx.fillText('♥'.repeat(Math.max(0, st.life)), 10, 28);
      ctx.fillStyle = '#333'; ctx.font = '14px sans-serif'; ctx.fillText('速度 ' + st.spd, 10, 50);
    }
    if (st.over) {
      ctx.fillStyle = 'rgba(28,36,48,.88)'; ctx.fillRect(110, 140, 260, 80);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('遊戲結束', 240, 193);
    }
  }
  function stopDemo() { clearInterval(demoTimer); window.onkeydown = window.onkeyup = null; }
  function runDemo(cv, scoreEl, leftEl, nb) {
    stopDemo();
    var ctx = cv.getContext('2d'); var st = { bx: 240, fruits: [], t: 0, life: 3, spd: 5, over: false }; var keys = {}; var sc = 0;
    window.onkeydown = function (e) { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    window.onkeyup = function (e) { keys[e.key] = false; };
    var frames = 0;
    scoreEl.textContent = '0'; leftEl.textContent = '3';
    function lose() {
      st.life--; leftEl.textContent = Math.max(0, st.life);
      if (st.life <= 0) { st.over = true; drawDemo(ctx, st); stopDemo(); done(0); nb.disabled = false; toast('遊戲結束！你接到了 ' + sc + ' 顆。'); }
    }
    demoTimer = setInterval(function () {
      frames++;
      if (keys.ArrowLeft) st.bx = Math.max(45, st.bx - 7);
      if (keys.ArrowRight) st.bx = Math.min(435, st.bx + 7);
      if (frames % 24 === 0) st.fruits.push({ x: 30 + Math.random() * 420, y: -20 });
      if (frames % 75 === 0) st.fruits.push({ x: 30 + Math.random() * 420, y: -20, bomb: true });
      st.fruits.forEach(function (f) { f.y += st.spd * 0.8; });
      st.fruits = st.fruits.filter(function (f) {
        if (f.y > 285 && f.y < 330 && Math.abs(f.x - st.bx) < 52) {
          if (f.bomb) { lose(); } else { sc++; scoreEl.textContent = sc; if (sc % 5 === 0) st.spd++; }
          return false;
        }
        if (f.y >= 345) { if (!f.bomb) lose(); return false; }
        return true;
      });
      drawDemo(ctx, st);
    }, 33);
  }

  /* ---------- 2 拆元素 ---------- */
  function buildElements() {
    stopDemo();
    var p = $('#p-elements'); p.innerHTML = '';
    var items = [
      { t: '用左右鍵移動的籃子', a: '玩家' }, { t: '從天上掉下來的蘋果', a: '掉落物' },
      { t: '接到蘋果就加 1 分', a: '規則' }, { t: '蘋果掉到地上就消失', a: '規則' },
      { t: '每隔一下就掉下一顆新的蘋果', a: '規則' }, { t: '按住左鍵籃子往左、按住右鍵往右', a: '規則' }
    ];
    var right = 0;
    var nb = next(2); nb.disabled = true;
    var card = h('div', { class: 'card' },
      h('span', { class: 'tag' }, '第 2 步・拆元素'), h('h2', {}, '把遊戲拆開來看'),
      h('div', { class: 'lead' }, '每個遊戲都是由三種東西組成：', h('b', {}, '玩家'), '（你控制的）、', h('b', {}, '掉落物'), '（會動的東西）、', h('b', {}, '規則'), '（怎麼得分、怎麼消失）。請判斷下面每一項是哪一種。'));
    items.forEach(function (it) {
      var why = h('div', { class: 'why' });
      var row = h('div', { class: 'item' }, h('div', { class: 't' }, it.t, why));
      ['玩家', '掉落物', '規則'].forEach(function (k) {
        row.append(h('button', { onclick: function () {
          if (row.classList.contains('right')) return;
          if (k === it.a) {
            row.classList.remove('wrong'); row.classList.add('right'); why.style.display = 'none';
            row.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
            row.append(h('b', { style: 'color:#1f6a43' }, '✓ ' + it.a));
            if (++right === items.length) { nb.disabled = false; done(1); toast('全部正確！你已經會拆遊戲了。'); }
          } else {
            row.classList.add('wrong'); row.classList.add('shake'); setTimeout(function () { row.classList.remove('shake'); }, 400);
            why.style.display = 'block'; why.textContent = '再想想：它是「一個看得到的東西」，還是「一條怎麼玩的規則」？';
          }
        } }, k));
      });
      card.append(row);
    });
    card.append(h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: function () { go(0); } }, '上一步'), nb));
    p.append(card);
    if (S.done[1]) { nb.disabled = false; }
  }

  /* ---------- 3 素材工坊 ---------- */
  function buildWorkshop() {
    var p = $('#p-workshop'); p.innerHTML = '';
    var A = S.art;
    var prevB = h('div', { class: 'prev' }), prevI = h('div', { class: 'prev' });
    function refresh() { prevB.innerHTML = basketSVG(A.basket, A.bc); prevI.innerHTML = itemSVG(A.item, A.ic); save(); }
    function choiceRow(list, key) {
      var r = h('div', { class: 'choices' });
      list.forEach(function (c) {
        var b = h('button', { class: A[key] === c[0] ? 'on' : '', onclick: function () { A[key] = c[0]; r.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); refresh(); } }, c[1]);
        r.append(b);
      });
      return r;
    }
    function colorRow(key) {
      var r = h('div', { class: 'colors' });
      COLORS.forEach(function (c) {
        var b = h('button', { style: 'background:' + c, class: A[key] === c ? 'on' : '', title: c, onclick: function () { A[key] = c; r.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); refresh(); } });
        r.append(b);
      });
      return r;
    }
    var nb = next(3); nb.disabled = !S.done[2];
    var judge = [
      { t: '用素材工坊自己畫的籃子', ok: true, why: '自己畫的，可以放心用。' },
      { t: '同學畫的圖，他同意讓我用，我也在作品裡寫上他的名字', ok: true, why: '有經過同意並註明，這樣是尊重別人的作品。' },
      { t: '在網路上找到的卡通角色圖（例如皮卡丘），直接放進我的遊戲', ok: false, why: '那是別人的角色，有版權。作品要繳交、可能被分享，不能直接拿來用。' },
      { t: '把別人遊戲的畫面截圖，當成我的背景', ok: false, why: '截圖裡的圖是別人做的，不是你的。要用，就自己畫。' }
    ];
    var right = 0;
    var jbox = h('div', {});
    judge.forEach(function (it) {
      var why = h('div', { class: 'why' });
      var row = h('div', { class: 'item' }, h('div', { class: 't' }, it.t, why));
      [['可以用', true], ['要小心', false]].forEach(function (k) {
        row.append(h('button', { onclick: function () {
          if (row.classList.contains('right')) return;
          if (k[1] === it.ok) {
            row.classList.remove('wrong'); row.classList.add('right'); why.style.display = 'block'; why.textContent = it.why;
            row.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
            if (++right === judge.length) { done(2); nb.disabled = false; toast('素材判斷全對！'); }
          } else {
            row.classList.add('wrong'); row.classList.add('shake'); setTimeout(function () { row.classList.remove('shake'); }, 400);
            why.style.display = 'block'; why.textContent = '再想想：這張圖是誰做的？我可以直接用嗎？';
          }
        } }, k[0]));
      });
      jbox.append(row);
    });
    p.append(h('div', { class: 'card' },
      h('span', { class: 'tag' }, '第 3 步・畫素材'), h('h2', {}, '素材工坊：做出你的遊戲角色'),
      h('div', { class: 'lead' }, '選你喜歡的籃子和掉落物，再挑顏色。做好的素材，等一下會直接出現在 Scratch 裡。'),
      h('div', { class: 'ws' },
        h('div', { class: 'wsbox' }, h('h3', {}, '接東西的人（玩家）'), prevB, choiceRow([['basket', '編織籃'], ['bowl', '碗'], ['bucket', '水桶']], 'basket'), colorRow('bc')),
        h('div', { class: 'wsbox' }, h('h3', {}, '掉下來的東西（掉落物）'), prevI, choiceRow([['apple', '蘋果'], ['star', '星星'], ['cookie', '餅乾'], ['gem', '寶石']], 'item'), colorRow('ic'))),
      h('h3', {}, '用素材之前，先判斷一下'), jbox,
      h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: function () { go(1); } }, '上一步'), nb)));
    refresh();
    if (S.done[2]) nb.disabled = false;
  }

  /* ---------- 編輯器（真的 Scratch） ---------- */
  var ed = { vm: null, ready: null, loadedFor: null, timer: null, state: null };
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (window.GUI) return res();
      var s = h('script', { src: src }); s.onload = res; s.onerror = function () { rej(new Error('編輯器檔案載入失敗')); };
      document.head.append(s);
    });
  }
  function ensureEditor() {
    if (ed.ready) return ed.ready;
    ed.ready = loadScript('/editor/scratch-gui-standalone.js').then(function () {
      return new Promise(function (resolve) {
        var host = $('#editor');
        GUI.setAppElement(host);
        var state = new GUI.EditorState({ locale: 'zh-tw' });
        var root = GUI.createStandaloneRoot(state, host);
        root.render({ menuBarHidden: true, canSave: false, canEditTitle: false, backpackVisible: false,
          onVmInit: function (vm) { ed.vm = vm; window.__vm = vm; } });
        state.store.dispatch(GUI.setProjectId(String(GUI.defaultProjectId)));
        var t = setInterval(function () {
          if (ed.vm && ed.vm.editingTarget) { clearInterval(t); setTimeout(resolve, 400); }
        }, 200);
      });
    });
    return ed.ready;
  }
  function loadProjectFile(url) {
    return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      ed.vm.stopAll();
      return ed.vm.loadProject(buf);
    });
  }
  function replaceCostume(target, svg) {
    var vm = ed.vm, st = vm.runtime.storage, sz = svgSize(svg);
    var asset = st.createAsset(st.AssetType.ImageVector, st.DataFormat.SVG, new TextEncoder().encode(svg), null, true);
    var md5ext = asset.assetId + '.svg';
    return vm.addCostume(md5ext, { name: '我的素材', md5: md5ext, assetId: asset.assetId, asset: asset,
      dataFormat: 'svg', rotationCenterX: sz.w / 2, rotationCenterY: sz.h / 2, bitmapResolution: 1 }, target.id)
      .then(function () { target.deleteCostume(0); });
  }
  function findSprite(name) {
    return ed.vm.runtime.targets.filter(function (t) { return !t.isStage && t.isOriginal && t.sprite.name === name; })[0];
  }
  function applyArt() {
    var b = findSprite('籃子'), f = findSprite('水果');
    var p1 = b ? replaceCostume(b, basketSVG(S.art.basket, S.art.bc)) : Promise.resolve();
    return p1.then(function () { if (f) return replaceCostume(f, itemSVG(S.art.item, S.art.ic)); });
  }

  /* ---------- 分析作品：用白話說明 ---------- */
  function analyze() {
    var proj = JSON.parse(ed.vm.toJSON());
    var ops = {}, kinds = {}, vars = [];
    proj.targets.forEach(function (t) {
      Object.keys(t.blocks || {}).forEach(function (id) {
        var b = t.blocks[id];
        if (b && typeof b === 'object' && b.opcode) { ops[b.opcode] = (ops[b.opcode] || 0) + 1; }
      });
      Object.keys(t.variables || {}).forEach(function (id) { vars.push({ name: t.variables[id][0], global: !!t.isStage, owner: t.name }); });
    });
    var has = function (o) { return (ops[o] || 0) > 0; };
    var cnt = function (o) { return ops[o] || 0; };
    var hasVar = function (n) { return vars.some(function (v) { return v.name.indexOf(n) >= 0; }); };
    var nSprites = proj.targets.filter(function (t) { return !t.isStage; }).length;
    return {
      modLife: hasVar('生命') && cnt('data_changevariableby') >= 2 && has('control_stop'),
      modBomb: nSprites >= 3 && cnt('control_create_clone_of') >= 2 && cnt('control_start_as_clone') >= 2,
      modSpeed: hasVar('速度') && (has('operator_subtract') || has('operator_multiply')),
      keysMove: has('sensing_keypressed') && (has('motion_changexby') || has('motion_setx')),
      keysWrongAxis: has('sensing_keypressed') && !(has('motion_changexby') || has('motion_setx')) && has('motion_changeyby'),
      spawn: has('control_create_clone_of') && has('control_forever'),
      cloneFall: has('control_start_as_clone') && (has('motion_changeyby') || has('motion_sety')),
      score: has('sensing_touchingobject') && has('data_changevariableby'),
      varGlobal: vars.some(function (v) { return v.global; }),
      varLocalOnly: vars.length > 0 && !vars.some(function (v) { return v.global; }),
      del: has('control_delete_this_clone'),
      hasVar: vars.length > 0
    };
  }
  function cloneCount() { return ed.vm ? ed.vm.runtime.targets.filter(function (t) { return !t.isStage && !t.isOriginal; }).length : 0; }

  var CHECKS = [
    { k: 'keysMove', t: '籃子：按住左右鍵就會左右移動', hint: '事件→「當綠旗被點擊」，加「重複無限次」，裡面放兩個「如果…那麼」，條件用偵測的「按下 ← 鍵？」，裡面放「x 改變 10」。', bad: function (a) { return a.keysWrongAxis ? '你用的是「y 改變」，籃子會上下跑。左右移動要用「x 改變」。' : null; } },
    { k: 'spawn', t: '水果：每隔一下就建立一個分身', hint: '水果角色：「當綠旗被點擊」→「重複無限次」→「建立 自己 的分身」→「等待 0.6 秒」。' },
    { k: 'cloneFall', t: '分身出生後往下掉', hint: '控制的「當分身產生時」→「移到 x:隨機 y:170」→「顯示」→「重複直到 y 座標 < -150」，裡面放「y 改變 -6」。' },
    { k: 'score', t: '分身碰到籃子就加分', hint: '在往下掉的「重複」裡，放「如果 碰到 籃子？ 那麼」→「將 分數 改變 1」。' },
    { k: 'varGlobal', t: '分數變數是「適用於所有角色」', hint: '變數→「建立一個變數」，名字叫「分數」，選「適用於所有角色」。選成「只適用於這個角色」，每個分身會各算各的。', bad: function (a) { return a.varLocalOnly ? '你的分數是「只適用於這個角色」。每個分身各算各的，總分加不起來。刪掉它，重新建立一個「適用於所有角色」的。' : null; } },
    { k: 'del', t: '用完的分身會被刪除', hint: '碰到籃子加完分之後、以及掉到地上的時候，都要接「刪除這個分身」。不刪的話，場上分身會越來越多。' }
  ];

  var POWERS = [
    { k: 'modLife', icon: '❤️', t: '生命模組', d: '漏接蘋果就少一條命，三條命用完，遊戲結束。',
      hint: '①變數→建立「生命」（適用於所有角色）。②綠旗時「將 生命 設為 3」。③蘋果掉到地上（沒接到）時「將 生命 改變 -1」。④加一個「如果 生命 < 1 那麼」→「停止 全部」。' },
    { k: 'modBomb', icon: '💣', t: '炸彈模組', d: '多一個炸彈角色，接到炸彈就扣命。',
      hint: '①畫一個新角色「炸彈」。②照蘋果的做法：綠旗→隱藏→重複無限次建立分身（等 2.5 秒）。③「當分身產生時」往下掉，碰到籃子就「將 生命 改變 -1」再刪除。（需要先裝好生命模組）' },
    { k: 'modSpeed', icon: '⚡', t: '加速模組', d: '越接越快，每接 5 顆，下落速度加 1。',
      hint: '①建立變數「速度」（適用於所有角色），綠旗時設為 5。②把掉落的「y 改變 -6」換成「y 改變（0 - 速度）」。③接到蘋果加分後：如果「分數 除以 5 的餘數 = 0」，就「將 速度 改變 1」。' }
  ];

  var DEBUG = [
    { k: 'a', sym: '玩一陣子之後，場上的水果越來越多，電腦會變慢。', hint: ['先按綠旗玩一下，看看左邊「場上分身數量」的數字。', '分身用完之後會去哪裡？看看控制裡有沒有一塊會讓分身消失。', '在水果的「當分身產生時」那一串，最後面接上「刪除這個分身」；接到籃子加分之後也要刪。'], fixed: function (a) { return a.del; }, why: '分身用完沒有刪除，會一直留在場上。' },
    { k: 'b', sym: '籃子明明接到了水果，左上角的分數卻一直是 0。', hint: ['先按綠旗，用 ← → 移動籃子去接水果，看看分數。', '到「變數」那一頁，看看「分數」前面的小框，是在舞台還是在水果角色上？', '把這個變數刪掉，重新建立，選「適用於所有角色」，再把積木裡的變數換成新的。'], fixed: function (a) { return a.varGlobal; }, why: '分數是「只適用於這個角色」的變數，每個分身各算各的。' },
    { k: 'c', sym: '按 ← → 時，籃子竟然往上、往下跑。', hint: ['選到「籃子」角色，看看它的程式。', '「x 改變」和「y 改變」差在哪裡？想想左右是 x 還是 y。', '把「y 改變」換成「x 改變」就好了。'], fixed: function (a) { return a.keysMove; }, why: '左右移動要用「x 改變」，上下才是「y 改變」。' }
  ];

  /* ---------- 3、4 實作：任務條與檢查 ---------- */
  var hintIdx = 0, curDebug = false, curMode = 'build';
  function fitEditor() {
    window.dispatchEvent(new Event('resize'));
  }
  function setMission(collapsed) {
    var m = document.getElementById('mission');
    m.classList.toggle('collapsed', collapsed);
    document.getElementById('mtoggle').textContent = collapsed ? '▶ 任務' : '◀ 收起任務';
    setTimeout(fitEditor, 50);
  }
  document.getElementById('mtoggle').onclick = function () {
    setMission(!document.getElementById('mission').classList.contains('collapsed'));
  };
  var MODE_TAG = { build: '第 4 步・拼積木', power: '第 5 步・強化模組', debug: '第 6 步・除錯' };
  function enterCode(mode) {
    if (window.innerWidth < 1300) setMission(true);
    stopDemo();
    var isDebug = mode === 'debug';
    curMode = mode; curDebug = isDebug; hintIdx = 0;
    var body = $('#missionBody'); body.innerHTML = '';
    body.append(h('div', { class: 'mcard' }, h('div', { class: 'tag' }, MODE_TAG[mode]), h('div', { class: 'lead', style: 'font-size:15px;margin:0' }, '準備編輯器中…')));
    var loading = $('#editorLoading'); loading.style.display = 'flex';
    ensureEditor().then(function () {
      var url = isDebug ? '/projects/l1_debug_' + DEBUG[S.debugVariant].k + '.sb3' : '/projects/l1_start.sb3';
      var key = isDebug ? 'debug' : 'build';
      var reuse = ed.loadedFor === key;
      if (reuse) return;
      var stash = (isDebug && ed.loadedFor === 'build') ? ed.vm.saveProjectSb3().then(function (blob) { ed.myBlob = blob; }) : Promise.resolve();
      return stash.then(function () { return loadProjectFile(url); }).then(function () { return isDebug ? null : applyArt(); }).then(function () { ed.loadedFor = key; });
    }).then(function () {
      loading.style.display = 'none';
      window.dispatchEvent(new Event('resize'));
      renderMission();
      clearInterval(ed.timer); ed.timer = setInterval(liveUpdate, 600);
    }).catch(function (e) { loading.textContent = '編輯器載入失敗：' + e.message; });
  }
  function renderMission() {
    var body = $('#missionBody'); body.innerHTML = '';
    var dbg = DEBUG[S.debugVariant];
    var head;
    if (curMode === 'debug') head = h('div', {}, h('h3', {}, '這個遊戲壞掉了'), h('p', {}, '症狀：', h('b', {}, dbg.sym)), h('p', {}, '先按綠旗玩玩看，找出哪裡不對，把它修好。修好再按「檢查」。'));
    else if (curMode === 'power') head = h('div', {}, h('h3', {}, '🎁 解鎖強化模組！'), h('p', {}, '基本版過關了。現在挑 ', h('b', {}, '至少 2 個'), ' 模組，裝到你自己的遊戲上，就會變成「接水果大師」。裝好會自動打勾。'));
    else head = h('div', {}, h('h3', {}, '把「接東西」做出來'), h('p', {}, '右邊已經有你剛畫好的籃子和水果。請用積木讓它們動起來。做好一項，下面就會自動打勾。'));
    body.append(h('div', { class: 'mcard' }, h('span', { class: 'tag' }, MODE_TAG[curMode]), head));
    body.append(h('div', { class: 'mcard' }, h('h3', {}, '場上分身數量'), h('div', { class: 'hud' }, h('b', { id: 'cc' }, '0'), h('span', { id: 'cn' }, '按綠旗開始'))));
    if (curMode === 'power') {
      var pl = h('ul', { class: 'check', id: 'plist' });
      POWERS.forEach(function (c) {
        pl.append(h('li', { 'data-k': c.k }, h('i', {}, ''), h('div', {}, h('b', {}, c.icon + ' ' + c.t), h('div', { style: 'font-size:14px;color:#555' }, c.d),
          h('details', { style: 'margin-top:4px;font-size:14px' }, h('summary', { style: 'cursor:pointer;color:#a33' }, '怎麼做？'), h('div', { style: 'line-height:1.6;margin-top:4px' }, c.hint)))));
      });
      body.append(h('div', { class: 'mcard' }, h('h3', {}, '模組清單（裝 2 個以上）'), pl));
    } else {
      var list = h('ul', { class: 'check', id: 'checklist' });
      CHECKS.forEach(function (c) { list.append(h('li', { 'data-k': c.k }, h('i', {}, ''), c.t)); });
      body.append(h('div', { class: 'mcard' }, h('h3', {}, curDebug ? '修好之後應該是這樣' : '完成清單'), list));
    }
    var backTo = curMode === 'build' ? 2 : (curMode === 'power' ? 3 : 4);
    body.append(h('div', { class: 'mcard' },
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
        curMode === 'power' ? null : h('button', { class: 'btn sec', onclick: showHint }, '💡 提示'),
        h('button', { class: 'btn', onclick: doCheck }, '✔ 檢查'),
        h('button', { class: 'btn sec', onclick: function () { go(backTo); } }, curMode === 'build' ? '回素材' : '上一步')),
      h('div', { class: 'fb', id: 'diag' })));
    liveUpdate();
  }
  function liveUpdate() {
    if (!ed.vm) return;
    var n = cloneCount(), cc = $('#cc'), cn = $('#cn');
    if (cc) { cc.textContent = n; cc.className = n > 60 ? 'bad' : ''; }
    if (cn) cn.textContent = n > 60 ? '個。太多了！電腦會變慢，Scratch 最多只能有 300 個。' : (n === 0 ? '個（按綠旗開始）' : '個');
    var a = analyze();
    document.querySelectorAll('#plist li').forEach(function (li) {
      var ok = !!a[li.getAttribute('data-k')];
      li.className = ok ? 'ok' : '';
      li.firstChild.textContent = ok ? '✓' : '';
    });
    document.querySelectorAll('#checklist li').forEach(function (li) {
      var c = CHECKS.filter(function (x) { return x.k === li.getAttribute('data-k'); })[0];
      var ok = !!a[c.k];
      li.className = ok ? 'ok' : '';
      li.firstChild.textContent = ok ? '✓' : '';
    });
  }
  function showHint() {
    S.hints++; save();
    var list;
    if (curDebug) list = DEBUG[S.debugVariant].hint;
    else {
      var a = analyze();
      var miss = CHECKS.filter(function (c) { return !a[c.k]; });
      list = miss.length ? [miss[0].hint] : ['都完成了！按「檢查」試試看。'];
      toast('💡 ' + list[0]); return;
    }
    toast('💡 ' + list[Math.min(hintIdx++, list.length - 1)]);
  }
  function liveTest() {
    // 實際跑一下：按綠旗、按住右鍵，看籃子和分身的反應
    var vm = ed.vm;
    return new Promise(function (resolve) {
      vm.stopAll();
      var basket = findSprite('籃子'); var x0 = basket ? basket.x : 0, y0 = basket ? basket.y : 0;
      var maxClones = 0;
      vm.greenFlag();
      var tick = setInterval(function () { maxClones = Math.max(maxClones, cloneCount()); }, 100);
      setTimeout(function () { vm.postIOData('keyboard', { key: 'ArrowRight', isDown: true }); }, 400);
      setTimeout(function () { vm.postIOData('keyboard', { key: 'ArrowRight', isDown: false }); }, 1300);
      setTimeout(function () {
        clearInterval(tick);
        var r = { maxClones: maxClones, dx: basket ? basket.x - x0 : 0, dy: basket ? basket.y - y0 : 0 };
        vm.stopAll();
        resolve(r);
      }, 3800);
    });
  }
  function doCheck() {
    var d = $('#diag'); d.className = 'fb show warn'; d.textContent = '試跑中…請稍等 4 秒，不要動滑鼠。';
    var a = analyze();
    liveTest().then(function (r) {
      var problems = [];
      if (curMode === 'power') {
        var got = POWERS.filter(function (p) { return a[p.k]; });
        if (got.length < 2) problems.push('目前裝好 ' + got.length + ' 個模組，至少要 2 個。打開模組旁邊的「怎麼做？」看步驟。');
        if (a.modBomb && !a.modLife) problems.push('炸彈要扣命，所以要先裝好「生命模組」。');
      } else CHECKS.forEach(function (c) {
        if (!a[c.k]) problems.push((c.bad && c.bad(a)) || ('還沒完成：' + c.t + '。'));
      });
      if (!problems.length) {
        if (r.maxClones === 0) problems.push('積木都有了，但按綠旗後場上一個水果都沒有出現。檢查「建立自己的分身」有沒有放在「當綠旗被點擊」下面，並且分身有「顯示」。');
        else if (Math.abs(r.dx) < 5) problems.push('試跑時按住 → 鍵，籃子沒有動。檢查「如果 按下 → 鍵」裡面有沒有放「x 改變」。');
        else if (Math.abs(r.dy) > 5) problems.push('籃子按左右鍵時，上下位置也變了。左右移動只能用「x 改變」。');
        else if (r.maxClones > 80) problems.push('試跑 4 秒就出現了 ' + r.maxClones + ' 個分身，太多了。分身用完要刪除。');
      }
      if (problems.length) {
        d.className = 'fb show warn';
        d.innerHTML = '';
        d.append(h('b', {}, '還差一點：'));
        problems.slice(0, 3).forEach(function (t) { d.append(h('div', {}, '• ' + t)); });
      } else {
        d.className = 'fb show good'; d.innerHTML = '';
        d.append(h('div', {}, curMode === 'power' ? '✓ 強化完成！你的遊戲升級了。按綠旗玩玩看！' : '✓ 通過！試跑 4 秒：籃子會跟著按鍵移動，場上最多 ' + r.maxClones + ' 個分身。'));
        var idx = { build: 3, power: 4, debug: 5 }[curMode]; done(idx);
        d.append(h('div', { class: 'row' }, h('span'), h('button', { class: 'btn', onclick: function () { go(idx + 1); } }, '下一步')));
      }
    });
  }

  /* ---------- 6 小測驗 ---------- */
  function buildQuiz() {
    clearInterval(ed.timer); if (ed.vm) ed.vm.stopAll();
    var p = $('#p-quiz'); p.innerHTML = '';
    var Q = [
      { q: '「分身」做的事做完了，卻沒有刪除。玩久了會怎麼樣？', o: ['沒有影響', '場上的分身越來越多，電腦會越來越慢', '分數會自動加倍'], a: 1, e: '分身會一直留在場上。Scratch 最多只能有 300 個，超過就不會再產生新的。' },
      { q: '為什麼「分數」要選「適用於所有角色」？', o: ['這樣比較好看', '因為每個分身都要一起加到同一個總分', '因為不選就不能建立變數'], a: 1, e: '「只適用於這個角色」的變數，每個分身各有一份，總分就加不起來。' },
      { q: '籃子要左右移動，應該用哪一塊積木？', o: ['y 改變', 'x 改變', '面朝 90 度'], a: 1, e: '左右是 x 方向，上下才是 y 方向。' }
    ];
    var ok = 0;
    var nb = h('button', { class: 'btn', onclick: function () { done(6); go(7); } }, '完成第 1 關');
    nb.disabled = true;
    var card = h('div', { class: 'card' }, h('span', { class: 'tag' }, '第 7 步・小測驗'), h('h2', {}, '最後三題'));
    Q.forEach(function (q, qi) {
      var ord = q.o.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      var opts = ord.map(function (i) { return q.o[i]; }); var ans = ord.indexOf(q.a);
      var fb = h('div', { class: 'fb' }); var solved = false;
      var box = h('div', { style: 'margin:16px 0' }, h('div', { style: 'font-size:18px;font-weight:700;line-height:1.6' }, (qi + 1) + '. ' + q.q));
      opts.forEach(function (o, oi) {
        var b = h('button', { class: 'item', style: 'width:100%;text-align:left;font-size:16px' }, o);
        b.onclick = function () {
          if (solved) return;
          if (oi === ans) { solved = true; b.classList.add('right'); fb.className = 'fb show good'; fb.textContent = '✓ ' + q.e; if (++ok === Q.length) nb.disabled = false; }
          else { b.classList.add('wrong'); fb.className = 'fb show warn'; fb.textContent = '再想想看。回想一下剛剛做的遊戲。'; }
        };
        box.append(b);
      });
      box.append(fb); card.append(box);
    });
    card.append(h('div', { class: 'row' }, h('span'), nb));
    p.append(card);
  }

  /* ---------- 7 完成 ---------- */
  function buildDone() {
    var p = $('#p-done'); p.innerHTML = '';
    var dl = h('button', { class: 'btn', onclick: function () {
      if (!ed.vm) return toast('編輯器還沒準備好');
      (ed.myBlob ? Promise.resolve(ed.myBlob) : ed.vm.saveProjectSb3()).then(function (blob) {
        var a = h('a', { href: URL.createObjectURL(blob), download: '接東西遊戲.sb3' }); document.body.append(a); a.click(); a.remove();
      });
    } }, '下載我的作品（.sb3）');
    p.append(h('div', { class: 'card', style: 'text-align:center' },
      h('div', { style: 'font-size:60px' }, '🥷'), h('h2', {}, '第 1 關通過！'),
      h('div', { class: 'lead' }, '你完成了：玩玩看、拆元素、畫素材、拼積木、強化模組、除錯、小測驗。', h('br'), '使用提示 ' + S.hints + ' 次。'),
      h('div', { class: 'note', style: 'text-align:left' }, '這是第 1 關的雛形。下一步會接上登入與老師後台，作品也會自動存起來。現在先用「下載」把作品留下來。'),
      h('div', { class: 'row', style: 'justify-content:center' }, dl, h('button', { class: 'btn sec', onclick: function () { S = { step: 0, done: [], hints: 0, art: S.art, debugVariant: Math.floor(Math.random() * 3) }; ed.loadedFor = null; ed.myBlob = null; save(); go(0); } }, '重玩一次'))));
  }

  window.__lv = { S: S, go: go, ed: ed, analyze: analyze, liveTest: liveTest };
  go(Math.min(S.step || 0, 7));
})();
