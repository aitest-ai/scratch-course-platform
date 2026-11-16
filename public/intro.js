// 開幕導覽 v3：RPG 一句一框對話＋第一人稱。被卡帶吸進「星光遊戲工作室」→ 為什麼做遊戲 → 拆開遊戲看積木 → 四要素 → 客人與樣品 → 訂單規格 → Bug 與麻煩事件 → 接單出發
import {GAMES, META, sfx, setMuted, isMuted} from '/minigames.js';
import {SKETCH} from '/sketches.js';

const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function toast(t) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { e.hidden = true; }, 3000); }
const wait = ms => new Promise(r => setTimeout(r, ms));

const KEY = 'ninja-l0-v2';
let S = null; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* 第一次 */ }
S = Object.assign({step: 0, done: [], played: {}, name: '', why: {}, lit: {}, quiz: false, bugs: {}, caught: false}, S || {});
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 不影響 */ } };

const CART_IDS = ['catch', 'slice', 'dodge', 'fight', 'parkour', 'puzzle'];
const SPARE = {parkour: {title: '跑酷', color: '#e8883a'}, puzzle: {title: '益智', color: '#3aa8a8'}};
const info = id => META[id] || SPARE[id];
// 四位客人 = 四款遊戲（每句話一個對話框）
const CUSTOMERS = {
  mei: {game: 'catch', job: '水果攤老闆娘', x: -2.1, z: 1.8, intro: '在街角賣了三十年水果，嗓門大、手腳快，最怕水果賣不完。', say: '「就是……水果會從天上掉下來，然後……要很好玩！」', want: ['水果一個一個從上面掉下來', '玩的人用籃子左右移動去接', '接到水果就加分，接到炸彈會扣命']},
  ting: {game: 'slice', job: '道場主人', x: -0.7, z: 1.8, intro: '道場裡最嚴格的師父，每天盯著徒弟練手速，最愛說「再快一點」。', say: '「要有那種……咻！一刀砍下去，很爽的感覺！」', want: ['水果被丟到空中', '用滑鼠劃過去就把水果切開', '切到炸彈會扣命']},
  lin: {game: 'dodge', job: '太空站站長', x: 0.7, z: 1.8, intro: '在太空站待了十年，什麼風浪都見過，只怕新人被隕石撞到。', say: '「石頭一直打過來，我的人要想辦法躲開，躲越久越厲害。」', want: ['隕石從上面不停掉下來', '玩的人移動太空船去躲', '撐越久，分數越高']},
  yu: {game: 'fight', job: '冒險隊長', x: 2.1, z: 1.8, intro: '帶著隊伍到處打怪的老手，說話很大聲，從來不怕怪物。', say: '「我要發射子彈！把怪物通通打趴！」', want: ['英雄在下面左右移動', '按空白鍵發射子彈打怪物', '怪物越來越多，血量用完就輸']}
};

let view = null;
const boss = () => view && view.actors.boss;
const cheer = () => { const b = boss(); b && b.once('Cheer'); sfx('right'); };
const nm = () => S.name || '新人';

/* ---------- RPG 對話引擎 ---------- */
let token = 0;                       // go() 時加一，讓舊對話自動作廢
const dead = tk => tk !== token;
const dlg = () => $('#dlg');
let skipFn = null;
function showLine(l, tk) {
  return new Promise(res => {
    const d = dlg(); d.hidden = false; d.classList.remove('out'); $('#card').classList.add('mute');
    const who = l.w === undefined ? 'boss' : l.w;
    const np = $('#dlgname'); np.textContent = who === 'boss' ? '老闆' : (who || ''); np.hidden = !who; np.className = 'nameplate ' + (who === 'boss' ? 'boss' : 'npc');
    d.classList.toggle('narr', !who);
    const tx = $('#dlgtext'), ch = $('#dlgchoices'), nx = $('#dlgnext');
    tx.textContent = ''; ch.replaceChildren(); nx.hidden = true;
    if (l.do) l.do();
    const full = l.t; let i = 0, typing = true, timer = null;
    const finish = () => {
      typing = false; clearInterval(timer); tx.textContent = full;
      if (l.choices) {
        l.choices.forEach((c, ci) => ch.append(h('button', {class: 'dchoice', onclick: () => { skipFn = null; sfx('right'); res(ci); }}, c)));
        skipFn = null;
      } else if (l.input) {
        const inp = h('input', {id: 'nm', maxlength: '8', placeholder: '輸入你的名字', value: S.name, autocomplete: 'off'});
        const ok = () => { const v = inp.value.trim(); if (!v) { toast('先告訴老闆你叫什麼名字吧'); return; } skipFn = null; sfx('right'); res(v); };
        inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ok(); };
        ch.append(inp, h('button', {class: 'dchoice', onclick: ok}, '回答'));
        setTimeout(() => inp.focus(), 50); skipFn = null;
      } else { nx.hidden = false; skipFn = () => { skipFn = null; res(); }; }
    };
    timer = setInterval(() => { if (dead(tk)) { clearInterval(timer); res('x'); return; } i++; tx.textContent = full.slice(0, i); if (i % 2 === 0) sfx('blip'); if (i >= full.length) finish(); }, 34);
    skipFn = () => { if (typing) { finish(); } };
    d.onclick = e => { if (e.target.closest('.dchoice,input')) return; advance(); };
  });
}
function advance() { if (skipFn) skipFn(); }
addEventListener('keydown', e => { if (e.target && e.target.tagName === 'INPUT') return; if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advance(); } });
// 依序演出一串台詞；回傳最後一個有輸入／選擇的結果
async function talk(lines, tk = token) {
  let out;
  for (const l of lines) { if (dead(tk)) return 'x'; out = await showLine(typeof l === 'string' ? {t: l} : l, tk); if (out === 'x') return 'x'; }
  if (!dead(tk)) hideDlg();
  return out;
}
function hideDlg() { const d = dlg(); d.hidden = true; $('#card').classList.remove('mute'); skipFn = null; }
const B = (t, o) => Object.assign({w: 'boss', t}, o || {});          // 老闆說
const N = (t, o) => Object.assign({w: '', t}, o || {});              // 旁白

function done(i) { S.done[i] = true; save(); }
function go(i) {
  token++; closeGame(); stopX && stopX(); hideDlg();
  S.step = i; save(); sfx('whoosh');
  const c = $('#card'); c.replaceChildren(); c.classList.remove('in');
  [stepFall, stepWhy, stepXray, stepWhat, stepCustomers, stepRecipe, stepBug, stepGo][i](token);
}
function panel(...kids) { const c = $('#card'); c.replaceChildren(...kids); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
const nav = (back, next) => h('div', {class: 'row'}, back ? h('button', {class: 'btn sec', onclick: back}, '上一步') : h('span'), next);
const stage = shot => { if (!view) return; view.enterRoom(); view.props(true); view.layout('none'); (view.actors.boss || view.addActor('boss', 0, -1.8, {face: .5})); view.shot(shot || 'boss'); };

/* ---------- 步驟 1：掉進去 ---------- */
async function stepFall(tk) {
  if (!S.name) {
    view && (view.layout('portal'), view.shot('portal'));
    const r = await talk([
      N('你正準備上 Scratch 課。'), N('突然，螢幕閃了一下！'),
      N('一張發光的遊戲卡帶從裡面飛了出來，繞著你轉。', {choices: ['伸手摸摸卡帶']})], tk);
    if (dead(tk)) return;
    sfx('boot'); if (view) { view.flash(900); stage('boss'); view.actors.boss && view.actors.boss.once('Cheer'); }
    await wait(500);
    const nameIn = await talk([
      N('……咦？這裡是哪裡？'), N('眼前是一間燈光昏暗的工作室。'),
      B('哇！有人！太好了！'), B('我是這間「星光遊戲工作室」的老闆。'),
      B('你叫什麼名字？', {input: true})], tk);
    if (dead(tk)) return;
    S.name = nameIn; save();
  } else stage('boss');
  const r2 = await talk([
    B(`${nm()}，好名字！`), B('老實說，工作室快倒閉了……', {do: () => view && view.shot('cabinet')}),
    B('店裡唯一那台舊街機當機了，畫面全是亂碼。'), B('訂單堆成山，我只會收訂單，不會做遊戲。', {do: () => view && view.shot('boss')}),
    B('但我看得出來，你是做遊戲的料！'),
    B('來當我的見習設計師，好不好？', {choices: ['好，我來幫忙！', '當設計師要做什麼？']})], tk);
  if (dead(tk)) return;
  if (r2 === 1) await talk([B('做出客人想要的遊戲就行！'), B('我會一步一步教你，放心。', {choices: ['好，我來幫忙！']})], tk);
  if (dead(tk)) return;
  cheer(); view && view.burst({x: 0, y: 2, z: -1.8}, 0xffc83d, 60, 4); done(0); go(1);
}

/* ---------- 步驟 2：為什麼做遊戲 ---------- */
async function stepWhy(tk) {
  stage('pair');
  await talk([B(`${nm()}，動手之前，先回答你心裡可能在想的問題。`), B('為什麼要學做遊戲？'), B('我準備了五張卡片，一張一張點開看看！')], tk);
  if (dead(tk)) return;
  const R = [
    ['🎮', '從玩家變成創作者', '玩別人的遊戲，只能照別人的規則玩。自己做遊戲，規則你說了算：蘋果掉多快、怪物長什麼樣，都是你決定。'],
    ['🔧', '像工程師一樣解決問題', '遊戲做出來不會一次就對，常會冒出 Bug。找出哪裡壞掉、想辦法修好，就是軟體工程師每天在做的事。'],
    ['💡', '想法變成真的', '腦袋裡的點子，一堂課之後就能在螢幕上動起來，還能讓別人玩得很開心。'],
    ['🧠', '學到的東西到處能用', '你用積木學到的「變數、迴圈、條件」，跟手機遊戲、Python 程式用的是同一套想法。'],
    ['🏆', '還有大獎等著你', '做完訂單可以賺金幣，把工作室和你的機台升級得超酷。最後，你的遊戲會放上真正的街機機台，用搖桿來玩！']
  ];
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = async () => { await talk([B('五個理由都看完啦！'), B('接下來，我帶你看遊戲的「內臟」。')], tk); if (dead(tk)) return; done(1); go(2); };
  const box = h('div', {class: 'why'});
  const refresh = () => { nb.disabled = Object.keys(S.why).length < R.length; box.replaceChildren(...R.map((r, i) => h('button', {class: 'wcard' + (S.why[i] ? ' open' : '') + (i === 4 && Object.keys(S.why).length < 4 ? ' lock' : ''), onclick: () => { if (i === 4 && Object.keys(S.why).length < 4) { toast('先看完前面四張，才能看到大獎！'); sfx('wrong'); return; } if (!S.why[i]) { S.why[i] = 1; save(); sfx('right'); boss() && boss().once(i === 4 ? 'Cheer' : 'Interact'); view && view.burst({x: 1.4, y: 1.4, z: 0}, 0xffc83d, 24, 3); } refresh(); }},
    h('b', {}, r[0] + ' ' + (S.why[i] || i < 4 ? r[1] : '？？？')), S.why[i] ? h('div', {class: 'wtxt'}, r[2]) : h('div', {class: 'wtxt dim'}, i === 4 ? '看完前四張就會解鎖' : '點開看看')))); };
  refresh();
  panel(h('h2', {}, '老闆的五個理由'), box, nav(() => go(0), nb));
}

/* ---------- 步驟 3：拆開遊戲看積木 ---------- */
let stopX = null;
async function stepXray(tk) {
  stage('pair');
  await talk([B('給你看個祕密。'), B('遊戲裡每件事，背後都是一塊積木在指揮。'), B('你玩玩看，哪塊積木工作了，右邊就會亮起來！')], tk);
  if (dead(tk)) return;
  const BL = [['move', '按下 ← → 鍵', '改變 x 座標，籃子就會動'], ['clone', '建立分身', '一顆顆蘋果和炸彈一直掉下來'], ['catch', '碰到 籃子？', '是的話：分數 +1'], ['bomb', '碰到 炸彈？', '是的話：生命 −1'], ['miss', '碰到 地板？', '蘋果漏接：生命 −1'], ['speed', '如果 分數是 5 的倍數', '掉落速度加快']];
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = async () => { await talk([B('看到了吧？每個動作都是一塊積木。'), B('接下來要學「怎麼看懂一個遊戲」。')], tk); if (dead(tk)) return; done(2); go(3); };
  const list = h('div', {class: 'xlist'});
  const chips = {};
  BL.forEach(([k, t, d]) => { chips[k] = h('div', {class: 'xb' + (S.lit[k] ? ' got' : '')}, h('b', {}, '🧩 ' + t), h('span', {}, d)); list.append(chips[k]); });
  const prog = h('div', {class: 'xprog'});
  const upd = () => { const n = Object.keys(S.lit).length; prog.textContent = `已經點亮 ${n}／6 塊積木（點亮 4 塊就能繼續）`; nb.disabled = n < 4; };
  const fire = k => { if (!chips[k]) return; chips[k].classList.remove('lit'); void chips[k].offsetWidth; chips[k].classList.add('lit'); if (!S.lit[k]) { S.lit[k] = 1; chips[k].classList.add('got'); save(); upd(); sfx('combo'); } };
  const cv = h('canvas', {width: '480', height: '360', class: 'xcv'});
  const play = h('button', {class: 'btn', onclick: () => {
    stopX && stopX(); play.textContent = '再玩一次';
    const kd = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') fire('move'); }; window.addEventListener('keydown', kd);
    const st = GAMES.catch(cv, () => { play.disabled = false; }, fire); stopX = () => { st(); window.removeEventListener('keydown', kd); stopX = null; };
  }}, '▶ 開始試玩');
  upd();
  panel(h('h2', {}, '每個動作，都是一塊積木'), h('div', {class: 'xwrap'}, h('div', {class: 'xleft'}, cv, play), list), prog, nav(() => go(1), nb));
}

/* ---------- 步驟 4：遊戲四要素 ---------- */
async function stepWhat(tk) {
  stage('pair');
  await talk([B('做遊戲前，先學會「看」遊戲。'), B('不管客人的需求多亂，都逃不出四樣東西。'), B('先看看這四張卡，再來考考你！')], tk);
  if (dead(tk)) return;
  const els = [['玩家', '你控制的東西', '例：籃子'], ['場上的東西', '會出現、會動的東西', '例：蘋果、炸彈'], ['規則', '碰到會發生什麼事', '例：接到蘋果加分'], ['勝負', '什麼時候結束、算贏還是輸', '例：三條命用完']];
  const items = [['籃子', 0], ['掉下來的蘋果和炸彈', 1], ['接到蘋果就加 1 分', 2], ['三條命用完，遊戲結束', 3], ['碰到炸彈少一條命', 2]];
  let right = 0;
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = async () => { await talk([B('四要素你都學會了！'), B('客人已經在門口排隊了，我們去看看。')], tk); if (dead(tk)) return; done(3); go(4); };
  panel(h('h2', {}, '遊戲四要素：下面「接水果」裡的東西，各是哪一種？'),
    h('div', {class: 'grid4'}, els.map(e => h('div', {class: 'el'}, h('b', {}, e[0]), e[1], h('br'), e[2]))),
    ...items.map(([t, a]) => {
      const row = h('div', {class: 'item'}, h('div', {class: 't'}, t));
      els.forEach((e, i) => row.append(h('button', {onclick: () => {
        if (row.classList.contains('right')) return;
        if (i === a) { row.className = 'item right'; row.querySelectorAll('button').forEach(b => { b.disabled = true; }); row.append(h('b', {style: 'color:#1f6a43'}, '✓ ' + e[0])); sfx('right'); if (++right === items.length) { nb.disabled = false; cheer(); toast('全部答對了！'); } }
        else { row.classList.add('wrong'); sfx('wrong'); setTimeout(() => row.classList.remove('wrong'), 500); }
      }}, e[0])));
      return row;
    }),
    nav(() => go(2), nb));
  if (S.done[3]) nb.disabled = false;
}

/* ---------- 步驟 5：客人與樣品 ---------- */
let stopGame = null;
const withInsert = (id, cb) => view ? view.insert(id, cb) : cb();
function openGame(id) {
  const m = META[id];
  withInsert(id, () => {
    $('#modal').hidden = false; $('#gtitle').textContent = m.title; $('#gtip').textContent = m.tip + '（按「開始玩」）';
    $('#gplay').disabled = false; $('#gplay').textContent = '▶ 開始玩';
    const cv = $('#game'); cv.getContext('2d').clearRect(0, 0, 480, 360);
    $('#gplay').onclick = () => {
      stopGame && stopGame(); $('#gplay').disabled = true; $('#gtip').textContent = m.tip;
      stopGame = GAMES[id](cv, txt => { S.played[id] = true; save(); $('#gtip').textContent = `${txt}。你試玩過「${m.title}」了！可以關閉看下一位客人。`; $('#gplay').disabled = false; $('#gplay').textContent = '再玩一次'; refreshTypes(); });
    };
  });
}
function closeGame() { stopGame && stopGame(); stopGame = null; const m = $('#modal'); if (m && !m.hidden) { m.hidden = true; view && view.eject(); } }
$('#gclose').onclick = closeGame;
let refreshTypes = () => { };
async function stepCustomers(tk) {
  const ids = Object.keys(CUSTOMERS);
  const played = h('div', {class: 'played'});
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = async () => { await talk([B('四款樣品都試玩過了，你有感覺了吧？'), B('接單前還有一個規矩要教你。')], tk); if (dead(tk)) return; done(4); go(5); };
  refreshTypes = () => {
    played.replaceChildren(...ids.map(k => h('span', {class: S.played[CUSTOMERS[k].game] ? 'ok' : ''}, (S.played[CUSTOMERS[k].game] ? '✓ ' : '') + `${CUSTOMERS[k].job}（${META[CUSTOMERS[k].game].title}）`)));
    nb.disabled = !ids.every(k => S.played[CUSTOMERS[k].game]);
  };
  refreshTypes();
  const lobby = () => panel(h('h2', {}, '四位客人，四種遊戲'), h('div', {class: 'lead'}, '👆 點一位站在櫃檯前面的客人，聽他想要什麼。'), played, nav(() => go(3), nb));
  // 站到櫃檯後面、老闆旁邊，看向店門口的客人
  if (view) {
    view.enterRoom(); view.layout('types'); view.props(false);
    const bo = view.actors.boss || await view.addActor('boss', 0, -1.8, {face: .5});
    bo.tx = 1.6; bo.tz = -2.3; bo.g.position.set(1.6, 0, -2.3); bo.face = -.2; bo.g.rotation.y = -.2;
    view.shot('desk');
  }
  await talk([B('好，那事不宜遲，我們就來看看這些顧客們的需求吧！')], tk);
  if (dead(tk)) return;
  if (view) {
    view.shot('customers');
    ids.forEach((k, i) => { const c = CUSTOMERS[k]; view.addActor(k, (i - 1.5) * 1.0, 5.0, {face: Math.PI}).then(a => { a.speed = 2.8; setTimeout(() => a.goto(c.x, c.z, Math.PI), 500 + i * 700); }); });
    await wait(4200);
  }
  await talk([B('客人上門了！'), B('每個人想要的遊戲都不一樣，點一位來聽聽他的需求。'), B('四款樣品都試玩過，才能繼續。')], tk);
  if (dead(tk)) return;
  lobby();
  let busy = false;
  const brief = k => {
    const c = CUSTOMERS[k], m = META[c.game]; busy = true; sfx('right'); view && (view.actors[k].once('Interact'), view.focus(k));
    const back = h('button', {class: 'btn sec', onclick: () => { sfx('whoosh'); view && view.unfocus(); busy = false; $('#brief').hidden = true; $('#card').style.display = ''; }}, '← 看看其他客人');
    const play = h('button', {class: 'btn', onclick: () => { $('#brief').hidden = true; $('#card').style.display = ''; busy = false; view && view.unfocus(); openGame(c.game); }}, `▶ 試玩「${m.title}」樣品卡帶`);
    const B2 = $('#brief'); B2.hidden = false; $('#card').style.display = 'none';
    B2.replaceChildren(h('div', {class: 'bsk'}, h('div', {class: 'bcap'}, '客人畫的草圖（他說：就是這種感覺）'), h('div', {class: 'bimg', html: SKETCH[c.game]})),
      h('div', {class: 'btxt'}, h('div', {class: 'bname', style: `border-color:${m.color}`}, h('b', {}, c.job), h('span', {}, '委託人')),
        h('p', {class: 'bintro'}, c.intro), h('p', {class: 'bsay'}, c.say), h('div', {class: 'bwant'}, h('b', {}, '想要的效果'), h('ul', {}, c.want.map(w => h('li', {}, w)))),
        h('div', {class: 'row'}, back, play)));
  };
  view && view.pickCb(p => { if (p.kind === 'npc' && !busy) brief(p.id); });
  if (!view) { toast('3D 無法顯示，直接點下面的按鈕試玩'); panel(h('h2', {}, '四位客人，四種遊戲'), played, h('div', {class: 'row'}, ...ids.map(k => h('button', {class: 'btn sec', onclick: () => openGame(CUSTOMERS[k].game)}, CUSTOMERS[k].job))), nav(() => go(3), nb)); }
}

/* ---------- 步驟 6：訂單規格卡 ---------- */
async function stepRecipe(tk) {
  stage('pair');
  await talk([B('客人的需求常常講得亂七八糟。'), B('所以工作室有個規矩：接單之前，先整理成一張「規格卡」。'), B('你以後做自己的遊戲，也要先畫一張。看看下面四張，再來小測驗！')], tk);
  if (dead(tk)) return;
  const ids = Object.keys(META);
  const Q = [
    ['想讓「滑鼠劃過就切開」，要用到滑鼠的 x、y 座標。這最像哪一款？', 'slice'],
    ['「按下空白鍵就發射一顆子彈」，這最像哪一款？', 'fight'],
    ['用計時器算出「撐了幾秒」當分數，這最像哪一款？', 'dodge'],
    ['左右鍵移動籃子，再用「分身」做出一直掉下來的東西，這最像哪一款？', 'catch']
  ];
  let ok = 0;
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = async () => { await talk([B('規格卡難不倒你！'), B('最後一堂課：認識工作室最頭痛的傢伙。')], tk); if (dead(tk)) return; done(5); S.quiz = true; save(); go(6); };
  panel(h('h2', {}, '訂單規格卡'),
    ...ids.map(id => { const m = META[id]; return h('div', {class: 'recipe', style: `border-color:${m.color}`}, h('h3', {style: `color:${m.color}`}, m.title),
      h('div', {}, `玩家：${m.recipe.player}`), h('div', {}, `場上的東西：${m.recipe.things}`), h('div', {}, `規則：${m.recipe.rule}`), h('div', {}, `勝負：${m.recipe.end}`),
      h('div', {class: 'chips'}, m.blocks.map(b => h('span', {class: 'chip'}, '🧩 ' + b)))); }),
    h('h3', {}, '小測驗：這些積木，分別是哪一款要用的？'),
    ...Q.map(([q, a]) => {
      const row = h('div', {class: 'item'}, h('div', {class: 't'}, q));
      ids.forEach(id => row.append(h('button', {onclick: () => {
        if (row.classList.contains('right')) return;
        if (id === a) { row.className = 'item right'; row.querySelectorAll('button').forEach(b => { b.disabled = true; }); row.append(h('b', {style: 'color:#1f6a43'}, '✓ ' + META[id].title)); sfx('right'); if (++ok === Q.length) { nb.disabled = false; cheer(); toast('規格卡難不倒你！'); } }
        else { row.classList.add('wrong'); sfx('wrong'); setTimeout(() => row.classList.remove('wrong'), 500); }
      }}, META[id].title)));
      return row;
    }),
    nav(() => go(4), nb));
  if (S.quiz) nb.disabled = false;
}

/* ---------- 步驟 7：Bug 怪與麻煩事件 ---------- */
async function stepBug(tk) {
  const SC = [
    ['客人臨時說：「我想要再加一個炸彈！」', ['整個遊戲刪掉重做', '在原本的遊戲加一個新角色和新規則', '假裝沒聽到'], 1, '加新需求不用重來，在原本的程式上多加一個角色和規則就好。'],
    ['試玩員說：「籃子會飛出畫面外！」', ['把籃子刪掉', '找到控制 x 座標的積木，加上最左和最右的限制', '叫玩家不要往右邊走'], 1, '找出控制位置的積木，加上限制，這就是除錯。'],
    ['試玩員說：「我接到蘋果，分數怎麼不會加？」', ['檢查「碰到籃子」那一段，有沒有「分數加 1」的積木', '把分數改成固定 100', '重新開機'], 0, '分數不動，先檢查「碰到」那一段有沒有改變分數的積木。'],
    ['交期倒數：客人明天就來拿！', ['全部重做', '先做好最重要的玩法，其他功能之後再加', '放棄這張訂單'], 1, '時間不夠時，先做出可以玩的核心，再慢慢加功能。']
  ];
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = () => { done(6); go(7); };
  const body = h('div', {});
  const render = () => {
    body.replaceChildren();
    if (!S.caught) { body.append(h('div', {class: 'lead'}, '🐛 桌上有一隻亂跑的 Bug 怪，點他把他抓起來！')); return; }
    body.append(h('div', {class: 'lead'}, '抓到了！下面是接單路上會遇到的「麻煩事件卡」，選出最好的處理方式：'));
    SC.forEach(([q, opts, a, why], qi) => {
      const row = h('div', {class: 'item col' + (S.bugs[qi] ? ' right' : '')}, h('div', {class: 't'}, q));
      const bs = h('div', {class: 'opts'});
      opts.forEach((o, oi) => bs.append(h('button', {disabled: S.bugs[qi] ? '' : null, onclick: ev => {
        if (S.bugs[qi]) return;
        if (oi === a) { S.bugs[qi] = 1; save(); sfx('right'); row.classList.add('right'); bs.querySelectorAll('button').forEach(b => { b.disabled = true; }); row.append(h('div', {class: 'why2'}, '✓ ' + why)); if (Object.keys(S.bugs).length === SC.length) { nb.disabled = false; cheer(); toast('你已經是合格的 Bug 獵人！'); } }
        else { ev.target.classList.add('wrong'); sfx('wrong'); setTimeout(() => ev.target.classList.remove('wrong'), 600); }
      }}, o)));
      row.append(bs); if (S.bugs[qi]) row.append(h('div', {class: 'why2'}, '✓ ' + why)); body.append(row);
    });
  };
  if (view) { stage('desk'); }
  if (!S.caught) {
    await talk([B('最後一件事！'), B('工作室有個頭痛人物，叫做 Bug 怪。'), B('程式只要有一點點錯，他就跑出來搗亂。'), B('快看，他來了！點一下桌上亂跑的那隻，把他抓起來！')], tk);
    if (dead(tk)) return;
    if (view) { view.bug(true); view.pickCb(async p => { if (p.kind === 'bug') { view.bugCaught(); view.pickCb(null); S.caught = true; save(); sfx('combo'); view.actors.boss && view.actors.boss.once('Cheer'); render(); await talk([B('抓到了！太棒了！'), B('不過 Bug 怪只是在提醒你哪裡寫錯了。'), B('接單的路上還會碰到各種麻煩事件，來練習怎麼處理吧！')], tk); } }); } else S.caught = true;
  } else { view && view.bug(false); }
  render();
  if (Object.keys(S.bugs).length === SC.length) nb.disabled = false;
  panel(h('h2', {}, '抓 Bug 怪！'), body, nav(() => go(5), nb));
}

/* ---------- 步驟 8：接單出發 ---------- */
async function stepGo(tk) {
  if (view) { stage('boss'); view.layout('go'); view.addActor('mei', -4.5, 1.0, {face: 0}).then(a => { a.goto(-2.0, 0.2, .3); }); }
  await talk([B(`${nm()}，你已經知道遊戲是什麼、客人想要什麼、Bug 怪怎麼對付了。`), B('第一張訂單來了！'), {w: '水果攤老闆娘', t: '拜託你了！我的第一張訂單：接水果！'}, B('把卡帶插進舊街機，把它做出來吧！')], tk);
  if (dead(tk)) return;
  panel(h('h2', {}, `${nm()}，第一張訂單：接水果`), h('div', {class: 'lead'}, '準備好就插入卡帶，進到編輯器開始做。'),
    nav(() => go(6), h('button', {class: 'btn', onclick: () => { done(7); withInsert('catch', () => setTimeout(() => { location.href = '/level1.html'; }, 400)); }}, '接下訂單，插入卡帶')));
}

/* ---------- 啟動 ---------- */
$('#mute').onclick = () => { setMuted(!isMuted()); $('#mute').textContent = isMuted() ? '🔇' : '🔊'; };
try {
  const {createWorld} = await import('/intro3d.js');
  view = await createWorld($('#gl'), {META, info, CART_IDS});
  view.layout('portal');
} catch (err) { console.warn('3D 開不了，改純頁面', err); document.body.classList.add('flat'); view = null; }
window.__intro = {ready: true, S, go, get view() { return view; }};
go(Math.min(S.step || 0, 7));
