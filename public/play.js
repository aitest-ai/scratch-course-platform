/* 忍者道場：原型驗證
 * 左邊是我們的道場，右邊是嵌入的 Scratch 編輯器（上游 scratch-editor，不修改）。
 * 驗證兩件事：1) 讀得到作品的執行狀態  2) 能把素材直接加進角色。 */
(function () {
  'use strict';

  var editorEl = document.getElementById('editor');
  var vm = null;

  GUI.setAppElement(editorEl);
  var state = new GUI.EditorState({ locale: 'zh-tw' });
  var root = GUI.createStandaloneRoot(state, editorEl);
  root.render({
    menuBarHidden: true,        // 隱藏 Scratch 原本的選單與標誌，改用我們自己的介面
    canSave: false,
    canEditTitle: false,
    backpackVisible: false,
    onVmInit: function (v) {
      vm = v;
      window.__vm = v;          // 方便除錯與測試
      var l = document.getElementById('loading');
      if (l) l.remove();
      setInterval(updateHud, 250);
    }
  });

  // 告訴編輯器載入預設作品（之後這裡會改成載入學生自己存的作品）
  state.store.dispatch(GUI.setProjectId(String(GUI.defaultProjectId)));

  /* ---------- 即時：場上分身數量 ---------- */
  function countClones() {
    if (!vm) return 0;
    return vm.runtime.targets.filter(function (t) { return !t.isStage && !t.isOriginal; }).length;
  }
  function updateHud() {
    var n = countClones();
    var el = document.getElementById('cloneCount');
    var note = document.getElementById('cloneNote');
    el.textContent = n;
    var bad = n > 100;
    el.className = bad ? 'bad' : '';
    note.textContent = bad
      ? '個。太多了！電腦會變慢，Scratch 最多只能有 300 個。是不是忘了刪除分身？'
      : (n === 0 ? '個（按綠旗開始）' : '個');
  }

  /* ---------- 檢查站：用白話說明問題 ---------- */
  function analyze() {
    var proj = JSON.parse(vm.toJSON());
    var ops = {};
    var vars = []; // {name, isGlobal}
    proj.targets.forEach(function (t) {
      Object.keys(t.blocks || {}).forEach(function (id) {
        var b = t.blocks[id];
        if (b && typeof b === 'object' && b.opcode) ops[b.opcode] = (ops[b.opcode] || 0) + 1;
      });
      Object.keys(t.variables || {}).forEach(function (id) {
        vars.push({ name: t.variables[id][0], isGlobal: !!t.isStage });
      });
    });
    return { ops: ops, vars: vars };
  }

  function check() {
    var out = [];
    var a = analyze();
    var has = function (op) { return (a.ops[op] || 0) > 0; };

    if (!has('control_create_clone_of')) {
      out.push(['info', '還沒有看到「建立 自己 的分身」。水果要變很多顆，需要它。']);
    } else {
      out.push(['ok', '有建立分身了。']);
      if (!has('control_start_as_clone')) {
        out.push(['bad', '你建立了分身，但沒有「當分身產生時」。分身出生後不知道要做什麼，會原地不動。']);
      } else {
        out.push(['ok', '分身出生後有自己的動作。']);
      }
      if (!has('control_delete_this_clone')) {
        out.push(['bad', '沒有看到「刪除這個分身」。水果會越來越多，電腦會變慢。']);
      } else {
        out.push(['ok', '分身用完會刪除。']);
      }
    }

    var down = has('pen_penDown'), up = has('pen_penUp');
    if (down && !up) out.push(['bad', '刀光有「落筆」，但沒有「抬筆」。整個畫面可能會被畫滿線。']);
    else if (down && up) out.push(['ok', '刀光有落筆也有抬筆。']);

    var score = a.vars.filter(function (v) { return /分|score/i.test(v.name); });
    if (score.length) {
      var local = score.filter(function (v) { return !v.isGlobal; });
      if (local.length === score.length) {
        out.push(['bad', '「' + local[0].name + '」是「只適用於這個角色」的變數。每個分身會各算各的，總分加不起來。']);
      } else {
        out.push(['ok', '計分變數是「適用於所有角色」，分身可以一起加分。']);
      }
    }

    var ul = document.getElementById('results');
    ul.innerHTML = '';
    out.forEach(function (r) {
      var li = document.createElement('li');
      li.className = r[0];
      li.textContent = r[1];
      ul.appendChild(li);
    });
  }

  /* ---------- 素材直接加進角色 ---------- */
  function addFruit() {
    if (!vm || !vm.editingTarget) return;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="90" viewBox="0 0 80 90">' +
      '<path d="M40 14 C 12 10, 4 40, 10 60 C 16 82, 34 86, 40 80 C 46 86, 64 82, 70 60 C 76 40, 68 10, 40 14 Z" fill="#e8483a" stroke="#7a1f16" stroke-width="3"/>' +
      '<path d="M40 14 C 40 6, 44 2, 50 2" fill="none" stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M44 10 C 54 0, 66 4, 66 4 C 64 14, 52 16, 44 10 Z" fill="#3ea34a" stroke="#1f6a2b" stroke-width="2"/>' +
      '</svg>';
    var storage = vm.runtime.storage;
    var asset = storage.createAsset(
      storage.AssetType.ImageVector, storage.DataFormat.SVG,
      new TextEncoder().encode(svg), null, true
    );
    var md5ext = asset.assetId + '.svg';
    return vm.addCostume(md5ext, {
      name: '蘋果', md5: md5ext, assetId: asset.assetId, asset: asset,
      dataFormat: 'svg', rotationCenterX: 40, rotationCenterY: 45, bitmapResolution: 1
    }, vm.editingTarget.id);
  }

  document.getElementById('btnCheck').addEventListener('click', check);
  document.getElementById('btnSvg').addEventListener('click', addFruit);
})();
