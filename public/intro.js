// 開幕導覽 v3：RPG 一句一框對話＋第一人稱。被卡帶吸進「星光遊戲工作室」→ 為什麼做遊戲 → 拆開遊戲看積木 → 四要素 → 客人與樣品 → 訂單規格 → Bug 與麻煩事件 → 接單出發
import {GAMES, META, sfx, setMuted, isMuted} from '/minigames.js';
import {SKETCH} from '/sketches.js';
import {showPic, hidePic} from '/pics.js';
import {startDemo} from '/bugdemo.js';

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
  ting: {game: 'slice', job: '獵人', x: -.7, z: 1.8, intro: '在山裡打獵多年，最近發現自己的刀工有點生疏，怕退步。', say: '「我想要一個會自動丟水果的遊戲，練我的速度和判斷力！」', want: ['水果自動被丟到空中（練速度）', '用滑鼠劃過去就把水果切開', '要分得出水果和炸彈，切到炸彈會扣命（練判斷力）']},
  lin: {game: 'dodge', job: '太空站站長', x: 0.7, z: 1.8, intro: '在太空站待了十年，什麼風浪都見過，只怕新人被隕石撞到。', say: '「石頭一直打過來，我的人要想辦法躲開，躲越久越厲害。」', want: ['隕石從上面不停掉下來', '玩的人移動太空船去躲', '撐越久，分數越高']},
  yu: {game: 'fight', job: '冒險隊長', x: 2.1, z: 1.8, intro: '帶著隊伍在森林裡巡邏的老手，說話很大聲，最怕史萊姆衝進營地。', say: '「史萊姆從右邊一直衝過來，我要用弓箭把牠們射趴！」', want: ['弓箭手站在左邊，上下移動', '按空白鍵射箭，史萊姆要射兩下才倒', '史萊姆衝過營地線就扣血，血用完就輸']}
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
    if (l.img !== undefined) showPic(l.img);
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
function hideDlg() { hidePic(); const d = dlg(); d.hidden = true; $('#card').classList.remove('mute'); skipFn = null; }
const B = (t, o) => Object.assign({w: 'boss', t}, o || {});          // 老闆說
const N = (t, o) => Object.assign({w: '', t}, o || {});              // 旁白

function done(i) { S.done[i] = true; save(); }
function go(i) {
  token++; closeGame(); stopX && stopX(); hideDlg();
  S.step = i; save(); sfx('whoosh');
  const c = $('#card'); c.replaceChildren(); c.classList.remove('in', 'wide');
  [stepFall, stepWhy, stepXray, stepWhat, stepCustomers, stepRecipe, stepBug, stepGo][i](token);
}
function panel(...kids) { const c = $('#card'); c.replaceChildren(...kids); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
const nav = (back, next) => h('div', {class: 'row'}, back ? h('button', {class: 'btn sec', onclick: back}, '上一步') : h('span'), next);
const stage = shot => { if (!view) return; Object.keys(CUSTOMERS).forEach(k => { const o = view.actors[k]; if (o) o.g.visible = false; }); view.enterRoom(); view.props(true); view.layout('none'); (view.actors.boss || view.addActor('boss', 0, -1.8, {face: .5})); view.shot(shot || 'boss'); };

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
    B(`${nm()}，好名字！`), B('老實說，工作室快撐不下去了……', {do: () => view && view.shot('cabinet')}),
    B('你看那台街機，已經好久沒有新遊戲可以放。', {do: () => view && view.shot('cabinet')}),
    B('我們一直做不出新的有趣遊戲，客人玩膩了，就不再上門。', {do: () => view && view.shot('boss')}),
    B('我只會收訂單，想不出好點子，也不會做遊戲。'),
    B('不過最近有幾位客人，想請我們訂做遊戲，這是翻身的機會！'),
    B('我看得出來，你是想得出好點子的人！'),
    B('來當我的見習設計師，幫工作室做出更有趣的遊戲，好不好？', {choices: ['好，我來幫忙！', '當設計師要做什麼？']})], tk);
  if (dead(tk)) return;
  if (r2 === 1) await talk([B('做出客人想要、又好玩的遊戲就行！'), B('我會一步一步教你，放心。', {choices: ['好，我來幫忙！']})], tk);
  if (dead(tk)) return;
  cheer(); view && view.burst({x: 0, y: 2, z: -1.8}, 0xffc83d, 60, 4); done(0); go(1);
}

/* ---------- 步驟 2：為什麼做遊戲 ---------- */
async function stepWhy(tk) {
  stage('pair');
  const ME = (t, o) => Object.assign({w: nm(), t}, o || {});
  await talk([B(`${nm()}，動手之前，你心裡是不是有個疑問？`), ME('……老闆，我只是個學生，為什麼要學做遊戲啊？', {}),
    B('問得好！先聽我說一個祕密。'), B('你每天玩的遊戲，背後都有人決定：蘋果掉多快、怪物長怎樣、幾條命。'),
    B('玩遊戲，是照別人的規則走。做遊戲，規則你說了算！', {img: 'rules', do: () => boss() && boss().once('Cheer')}),
    ME('規則我說了算……聽起來有點酷。', {choices: ['那做遊戲會不會很難？']})], tk);
  if (dead(tk)) return;
  await talk([B('哈哈，一定會出錯，這很正常。'), B('遊戲常常冒出 Bug，像蘋果穿過籃子、分數亂跳。', {img: 'bug'}),
    B('可是找出哪裡壞掉、想辦法修好，就是軟體工程師每天在做的事。', {do: () => boss() && boss().once('Interact')}),
    ME('所以抓 Bug，其實是在練習當工程師？', {}), B('完全正確！你一開口就比我還懂。'),
    ME('那我學到的東西，只能拿來做遊戲嗎？', {choices: ['這個我也想知道']})], tk);
  if (dead(tk)) return;
  await talk([B('不只喔。你用積木學的「變數、迴圈、條件」，', {img: 'blocks'}), B('手機遊戲、Python 程式用的是同一套想法。'),
    B('今天腦袋裡冒出的點子，一堂課之後就能在螢幕上動起來，還能讓別人玩得很開心。'),
    ME('那我做完訂單，有什麼好處？', {choices: ['快說快說！']})], tk);
  if (dead(tk)) return;
  sfx('right'); view && view.burst({x: 1.4, y: 1.4, z: 0}, 0xffc83d, 40, 3);
  await talk([B('做完訂單賺金幣，工作室跟你的機台都能升級！', {img: 'reward', do: () => boss() && boss().once('Cheer')}),
    B('最後，你的遊戲會放上那台真正的街機，客人用搖桿親自玩！'),
    ME('哇，我的遊戲被別人玩……我要做！'),
    B('好！一句話整理：玩家變創作者，Bug 變挑戰，點子變真的。'), B('接下來，我帶你看遊戲的「內臟」。')], tk);
  if (dead(tk)) return;
  done(1); go(2);
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
    ids.forEach((k, i) => { const c = CUSTOMERS[k]; view.addActor(k, (i - 1.5) * 1.0, 5.0, {face: Math.PI}).then(a => { a.g.visible = true; a.speed = 2.8; setTimeout(() => a.goto(c.x, c.z, Math.PI), 500 + i * 700); }); });
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
    B2.replaceChildren(h('div', {class: 'bsk'}, h('div', {class: 'bcap'}, '客人畫的草圖（他說：就是這種感覺）'), h('div', {class: 'bimg', html: SKETCH[c.game]}), h('p', {class: 'bsay'}, c.say)),
      h('div', {class: 'btxt'}, h('div', {class: 'bname', style: `border-color:${m.color}`}, h('b', {}, c.job), h('span', {}, '委託人')),
        h('p', {class: 'bintro'}, c.intro), h('div', {class: 'bwant'}, h('b', {}, '想要的效果'), h('ul', {}, c.want.map(w => h('li', {}, w)))),
        h('div', {class: 'row'}, back, play)));
  };
  view && view.pickCb(p => { if (p.kind === 'npc' && !busy) brief(p.id); });
  if (!view) { toast('3D 無法顯示，直接點下面的按鈕試玩'); panel(h('h2', {}, '四位客人，四種遊戲'), played, h('div', {class: 'row'}, ...ids.map(k => h('button', {class: 'btn sec', onclick: () => openGame(CUSTOMERS[k].game)}, CUSTOMERS[k].job))), nav(() => go(3), nb)); }
}

/* ---------- 步驟 6：訂單規格卡 ---------- */
async function stepRecipe(tk) {
  stage('pair');
  await talk([B('客人的需求常常講得亂七八糟。'), B('所以接單之前，先整理成一張「規格卡」。'),
    B('我把四位客人的需求，一位一位交給你。'), B('你照清單，一項一項幫我檢查：玩家、場上的東西、規則、勝負，還有要用哪組積木。'),
    B('每一項都選對，這張單才算整理好！')], tk);
  if (dead(tk)) return;
  const ids = Object.keys(CUSTOMERS), cap = $('#card');
  const FIELDS = [['player', '玩家是誰？', '玩家'], ['things', '場上有什麼東西？', '場上的東西'], ['rule', '規則是什麼？', '規則'], ['end', '怎麼分出勝負？', '勝負'], ['blocks', '最需要哪一組積木？', '主要積木']];
  const val = (g, f) => f === 'blocks' ? META[g].blocks.slice(0, 2).join('、') : META[g].recipe[f];
  const mix = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const doneC = {};
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步');
  nb.onclick = async () => { await talk([B('規格卡難不倒你！'), B('最後一堂課：認識工作室最頭痛的傢伙。')], tk); if (dead(tk)) return; done(5); S.quiz = true; save(); go(6); };
  const finishAll = () => { nb.disabled = false; cheer(); toast('四張規格卡都整理好了！'); };
  const show = ci => {
    cap.classList.add('wide');
    const k = ids[ci], c = CUSTOMERS[k], g = c.game, m = META[g];
    const filled = {}; let fi = 0;
    const lines = FIELDS.map(([f, , lab]) => h('li', {class: ''}, '☐ ' + lab + '：', h('b', {}, '？？？')));
    const qbox = h('div', {class: 'rqbox'});
    const tabs = h('div', {class: 'rtabs'}, ids.map((id, i) => h('button', {class: 'rtab' + (i === ci ? ' on' : '') + (doneC[id] ? ' ok' : ''), onclick: () => { if (i !== ci) { sfx('whoosh'); show(i); } }}, (doneC[id] ? '✓ ' : '') + CUSTOMERS[id].job)));
    const ask = () => {
      if (fi >= FIELDS.length) {
        doneC[k] = true; sfx('combo'); qbox.replaceChildren(h('div', {class: 'rdone'}, `✓ ${c.job}的規格卡整理好了！`),
          ids.every(i => doneC[i]) ? h('div', {}, '四張都完成了，按「下一步」！') : h('button', {class: 'btn', onclick: () => show(ids.findIndex(i => !doneC[i]))}, '下一位客人 →'));
        tabs.querySelectorAll('.rtab')[ci].className = 'rtab on ok'; tabs.querySelectorAll('.rtab')[ci].textContent = '✓ ' + c.job;
        boss() && boss().once('Cheer');
        if (ids.every(i => doneC[i])) finishAll();
        return;
      }
      const [f, q] = FIELDS[fi], right = val(g, f);
      const others = mix([...new Set(Object.values(CUSTOMERS).filter(o => o.game !== g).map(o => val(o.game, f)))]).slice(0, 2);
      qbox.replaceChildren(h('div', {class: 'rq'}, `第 ${fi + 1} 項：${q}`),
        ...mix([right, ...others]).map(o => h('button', {class: 'ropt', onclick: e => {
          if (o === right) { sfx('right'); lines[fi].className = 'got'; lines[fi].replaceChildren('☑ ' + FIELDS[fi][2] + '：', h('b', {}, right)); fi++; ask(); }
          else { sfx('wrong'); e.target.classList.add('bad'); setTimeout(() => e.target.classList.remove('bad'), 600); toast('再想想：客人說的是「' + c.say.replace(/[「」]/g, '') + '」'); }
        }}, o)));
    };
    ask();
    panel(h('div', {class: 'rform'},
      h('div', {class: 'rl'}, h('div', {class: 'bname', style: 'border-color:#5b4fd0'}, c.job, h('span', {}, '的需求')), h('div', {class: 'bimg', html: SKETCH[g]}), h('p', {class: 'bsay'}, c.say)),
      h('div', {class: 'rr'}, h('h3', {}, `📋 ${c.job}的規格卡`), h('ul', {class: 'rlist'}, lines), qbox)),
      tabs, nav(() => { cap.classList.remove('wide'); go(4); }, nb));
    cap.classList.add('wide');
    if (S.quiz) { nb.disabled = false; ids.forEach(i => { doneC[i] = true; }); }
  };
  show(0);
}

/* ---------- 步驟 7：Bug 怪與麻煩事件 ---------- */
async function stepBug(tk) {
  const SC = [
    ['fly', '試玩員回報：「籃子會飛出畫面外！」', ['把籃子刪掉', '找到控制 x 座標的積木，加上最左和最右的限制', '叫玩家不要往右邊走'], 1, '找出控制位置的積木，加上限制，這就是除錯。'],
    ['score', '試玩員回報：「我接到蘋果，分數怎麼不會加？」', ['檢查「碰到籃子」那一段，有沒有「分數加 1」的積木', '把分數改成固定 100', '重新開機'], 0, '分數不動，先檢查「碰到」那一段有沒有改變分數的積木。'],
    ['pile', '試玩員回報：「蘋果掉到地板還一直留在畫面上，越堆越多！」', ['讓蘋果掉慢一點', '在「碰到地板」時，加上「刪除這個分身」的積木', '把地板顏色換掉'], 1, '分身用完要刪掉，不然會越積越多，遊戲就會越來越卡。'],
    ['bomb', '試玩員回報：「炸彈碰到籃子，生命卻沒有減少！」', ['把炸彈改成蘋果', '把生命一開始改成 100', '檢查炸彈「碰到籃子」那一段，有沒有「生命 −1」的積木'], 2, '先看症狀，再找到負責那件事的積木，通常就是少了一塊或放錯地方。']
  ];
  const nb = h('button', {class: 'btn', disabled: ''}, '下一步'); nb.onclick = () => { done(6); go(7); };
  const body = h('div', {});
  let stopDemo = null; stopX = () => { stopDemo && stopDemo(); stopDemo = null; };
  const render = () => {
    stopX(); body.replaceChildren();
    if (!S.caught) { body.append(h('div', {class: 'lead'}, '🐛 桌上有一隻亂跑的 Bug 怪，點他把他抓起來！')); return; }
    const qi = SC.findIndex((_, i) => !S.bugs[i]);
    if (qi < 0) { body.append(h('div', {class: 'lead'}, `✓ ${SC.length} 隻 Bug 都找出來了！以後交貨前，就靠你檢查囉。`)); nb.disabled = false; return; }
    const [kind, q, opts, a, why] = SC[qi];
    const cv = h('canvas', {class: 'bdcv'}); const cap = h('div', {class: 'bdcap'}, '🔴 試玩員的錄影（第 ' + (qi + 1) + ' / ' + SC.length + ' 隻 Bug）');
    stopDemo = startDemo(cv, kind, false);
    const right = h('div', {class: 'bdq'}, h('div', {class: 'bdt'}, q), h('div', {class: 'lead'}, '看影片：哪裡怪怪的？選出「最該檢查的地方」：'));
    const bs = h('div', {class: 'bdopts'});
    opts.forEach((o, oi) => bs.append(h('button', {class: 'ropt', onclick: ev => {
      if (oi === a) {
        S.bugs[qi] = 1; save(); sfx('right'); bs.querySelectorAll('button').forEach(b => { b.disabled = true; }); ev.target.classList.add('okopt');
        stopDemo && stopDemo(); stopDemo = startDemo(cv, kind, true); cap.textContent = '🟢 修好之後的樣子';
        right.append(h('div', {class: 'why2'}, '✓ ' + why),
          h('button', {class: 'btn', onclick: () => { sfx('whoosh'); render(); }}, qi + 1 < SC.length ? '下一隻 Bug →' : '全部找完了！'));
        boss() && boss().once('Cheer');
        if (Object.keys(S.bugs).length === SC.length) { nb.disabled = false; cheer(); toast('你已經是合格的 Bug 獵人！'); }
      } else { ev.target.classList.add('bad'); sfx('wrong'); setTimeout(() => ev.target.classList.remove('bad'), 600); }
    }}, o)));
    right.append(bs);
    body.append(h('div', {class: 'bdwrap'}, h('div', {class: 'bdl'}, cv, cap), right));
  };
  if (view) { stage('desk'); }
  if (!S.caught) {
    await talk([B('最後一件事，也是最重要的一件。'), B('遊戲交給客人之前，一定要先抓 Bug。'), B('要是客人拿到會當機、會亂跳分數的遊戲，馬上就會來客訴。', {img: 'bug'}), B('客訴多了，工作室的招牌就垮了，不會再有人上門。', {img: ''}), B('所以每次交貨前，都要把工作室的頭痛人物抓出來，那就是 Bug 怪。'), B('程式只要有一點點錯，他就跑出來搗亂。快看，他來了！'), B('點一下桌上亂跑的那隻，把他抓起來！')], tk);
    if (dead(tk)) return;
    if (view) { view.bug(true); view.pickCb(async p => { if (p.kind === 'bug') { view.bugCaught(); view.pickCb(null); S.caught = true; save(); sfx('combo'); view.actors.boss && view.actors.boss.once('Cheer'); render(); await talk([B('抓到了！太棒了！'), B('不過 Bug 怪只是在提醒你，哪裡寫錯了。'), B('抓 Bug 有三步驟：看症狀、猜是哪一段積木、改了再試一次。', {img: 'bug'}), B('來，先練習幫試玩員找找這幾隻 Bug，以後交貨前就靠你檢查了！', {img: ''})], tk); } }); } else S.caught = true;
  } else { view && view.bug(false); }
  render();
  if (Object.keys(S.bugs).length === SC.length) nb.disabled = false;
  panel(h('h2', {}, '抓 Bug 怪！'), body, nav(() => go(5), nb));
}

/* ---------- 步驟 8：接單出發 ---------- */
async function stepGo(tk) {
  if (view) { stage('boss'); view.layout('go'); view.addActor('mei', -4.5, 1.0, {face: 0}).then(a => { a.g.visible = true; a.goto(-2.0, 0.2, .3); }); }
  await talk([B(`${nm()}，你已經知道遊戲是什麼、客人想要什麼，交貨前要先抓 Bug 避免客訴。`), B('第一張訂單來了！'), {w: '水果攤老闆娘', t: '拜託你了！我的第一張訂單：接水果！'}, B('把卡帶插進舊街機，把它做出來吧！')], tk);
  if (dead(tk)) return;
  panel(h('h2', {}, `${nm()}，第一張訂單：接水果`), h('div', {class: 'lead'}, '準備好就插入卡帶，進到編輯器開始做。'),
    nav(() => go(6), h('button', {class: 'btn', onclick: () => { done(7); withInsert('catch', () => setTimeout(() => { location.href = '/order1.html'; }, 400)); }}, '接下訂單，插入卡帶')));
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
