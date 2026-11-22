// 訂單 #1：水果攤老闆娘的「接水果」
// 流程：接單 → 問需求 → 簽約（拆成工作單）→ 備素材 → 開工（真的 Scratch）→ 交貨 → 客人追加（強化模組）→ 抓 Bug → 結單
import {META, sfx, setMuted, isMuted} from '/minigames.js';
import {createRpg} from '/rpg.js';

const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function toast(t) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { e.hidden = true; }, 3200); }
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 存檔 ---------- */
const KEY = 'ninja-o1-v1';
let S = null; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* 第一次 */ }
S = Object.assign({step: 0, done: [], asked: {}, art: {basket: 'basket', bc: '#c98a4b', item: 'apple', ic: '#e8483a'}, judged: false, split: false,
  mods: [], debugVariant: Math.floor(Math.random() * 3), hints: 0, checks: 0, coins: 0, paid: {}, selfck: {}, name: ''}, S || {});
if (!S.name) { try { S.name = (JSON.parse(localStorage.getItem('ninja-l0-v2')) || {}).name || ''; } catch (e) { /* 沒有 */ } }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 不影響 */ } };
const nm = () => S.name || '新人';

// 第一視角：說話的人是誰，視線就轉向誰（只在站在櫃台後面的場景啟用）
let look = false, wantFocus = false;
let lastEmote = 0;
const keyOf = who => who === 'boss' ? 'boss' : (who && who !== '@me' ? 'mei' : null);
function onSpeak(who, l) {
  if (!view) return;
  const key = keyOf(who);
  view.talk(key);                                          // 說話時點頭擺頭
  if (key && l) {                                          // 有動作：句子有強調語氣就比個手勢
    const e = l.e || (/[！？]/.test(l.t) && performance.now() - lastEmote > 3500 ? 'Interact' : null);
    if (e) { lastEmote = performance.now(); const a = view.actors[key]; a && a.once(e); }
  }
  if (!look) return;
  const bo = view.actors.boss;
  if (bo) bo.face = who === 'boss' || who === '@me' ? -2.2 : -.2;   // 老闆對主角說話就轉過來看著主角；客人說話就看客人
  if (who === '') return;                                  // 旁白不動
  if (who === 'boss') { if (wantFocus) view.unfocus(); view.shot('toBoss'); }
  else if (wantFocus) view.focus('mei'); else view.shot('customers');
}
const rpg = createRpg({sfx, toast, getName: nm, onSpeak, onTyped: who => { if (view && !who) view.talk(null); else if (view && who && who !== '@me') { /* 打字結束，停止點頭 */ view.talk(null); } }, onEnd: () => { if (look && wantFocus && view) view.focus('mei'); }});
const {talk, B, N, ME} = rpg;
const CUS = '水果攤老闆娘';
const M = (t, o) => Object.assign({w: CUS, t}, o || {});          // 客人說

/* ---------- 進度列、金幣 ---------- */
const STEPS = ['接單', '問需求', '簽約', '備素材', '開工', '客人試玩', '客人追加', '交貨前抓 Bug', '結單'];
function renderSteps() {
  const n = $('#steps'); n.replaceChildren();
  STEPS.forEach((name, i) => n.append(h('div', {class: 'dot' + (i === S.step ? ' cur' : '') + (S.done[i] ? ' done' : '') + (i > S.step && !S.done[i] ? ' todo' : '')}, h('b', {}, S.done[i] ? '✓' : String(i + 1)), name)));
}
function renderCoins() { $('#coinn').textContent = S.coins; }
function pay(key, n) {
  if (S.paid[key]) return; S.paid[key] = 1; S.coins += n; save(); sfx('combo');
  const f = h('div', {class: 'coinfly', style: 'left:50%;top:55%'}, '🪙 +' + n); document.body.append(f);
  requestAnimationFrame(() => { const r = $('#coins').getBoundingClientRect(); f.style.transform = `translate(${r.left - innerWidth / 2}px,${r.top - innerHeight * .55}px) scale(.6)`; f.style.opacity = '.2'; });
  setTimeout(() => { f.remove(); renderCoins(); }, 950);
}

/* ---------- 3D 櫃台場景 ---------- */
const CART_IDS = ['catch', 'slice', 'dodge', 'fight', 'parkour', 'puzzle'];
const SPARE = {parkour: {title: '跑酷', color: '#e8883a'}, puzzle: {title: '益智', color: '#3aa8a8'}};
const info = id => META[id] || SPARE[id];
let view = null;
async function stage(opening) {
  if (!view) return;
  view.enterRoom(); view.layout('none');
  const bo = view.actors.boss || await view.addActor('boss', 0, -1.8, {face: .5});
  if (opening) { view.props(true); bo.tx = -0.4; bo.tz = 1.2; bo.g.position.set(-0.4, 0, 1.2); bo.face = 0; bo.g.rotation.y = 0; }
  else { view.props(false); bo.tx = 1.6; bo.tz = -2.3; bo.g.position.set(1.6, 0, -2.3); bo.face = -.2; bo.g.rotation.y = -.2; }
  view.unfocus();
}
async function meiAt(x, z, face = Math.PI) {
  if (!view) return null;
  const a = view.actors.mei || await view.addActor('mei', x, z, {face});
  a.tx = x; a.tz = z; a.g.position.set(x, 0, z); a.face = face; a.g.rotation.y = face; return a;
}
const bossDo = anim => () => { const b = view && view.actors.boss; b && b.once(anim); };

/* ---------- 步驟切換 ---------- */
let stopX = null;
const side = () => $('#side');
function sideShow(...kids) { const s = side(); s.replaceChildren(...kids); s.hidden = false; s.classList.remove('in'); void s.offsetWidth; s.classList.add('in'); }
function sideHide() { side().hidden = true; }
function showBench(on) { $('#bench').hidden = !on; $('#gl').style.visibility = on ? 'hidden' : 'visible'; if (!on) { clearInterval(ed.timer); if (ed.vm) ed.vm.stopAll(); } }
function done(i) { S.done[i] = true; save(); renderSteps(); }
function go(i) {
  const tk = rpg.bump(); sideHide(); S.step = i; save(); sfx('whoosh'); renderSteps(); renderCoins();
  const f = [stepOrder, stepAsk, stepSign, stepArt, stepBuild, stepDeliver, stepPower, stepBug, stepWrap][i];
  f(tk);
}

/* ================= 0 接單 ================= */
async function stepOrder(tk) {
  look = false; wantFocus = false;
  showBench(false); await stage(true); if (rpg.dead(tk)) return;
  view && view.shot('openBoss');
  if (!S.name) {
    const v = await talk([B('歡迎光臨星光遊戲工作室！'), B('你叫什麼名字？', {input: '輸入你的名字'})], tk);
    if (rpg.dead(tk)) return; S.name = v; save();
  }
  await talk([
    B(`歡迎來到星光遊戲工作室，${nm()}！`, {do: bossDo('Cheer')}),
    B('這裡專門幫客人「訂做遊戲」。客人想要什麼，我們就做什麼。'),
    B('我是老闆，負責接單。你是我的新設計師，要幫我把遊戲做出來。'),
    B('你看，那邊那台街機。', {do: () => view && view.shot('cabinet')}),
    B('它現在沒有新遊戲可以放，客人玩膩了，工作室才會這麼冷清。', {do: () => view && view.shot('cabinet')}),
    B('客人訂的遊戲做好了，就會插在那台機器上，讓客人親自玩玩看。', {do: () => view && view.shot('cabinet')}),
    B('所以每一張訂單，都是要做出一個「真的能玩」的遊戲。', {do: () => { view && view.shot('openBoss'); }}),
    B('接案的流程很簡單：接單、問清楚、拆成工作單、動手做、交貨。', {img: 'flow', do: bossDo('Interact')}),
    B('咦，門口有人來了。你站到櫃台後面，我們一起接這張單。', {img: ''})], tk);
  if (rpg.dead(tk)) return;
  if (view) {
    const bo = view.actors.boss; bo.goto(2.8, -0.5, null, () => bo.goto(1.6, -2.3, -.2)); view.shot('customers'); await wait(3800); view.props(false);
    const a = await meiAt(0.2, 5.0); a.speed = 2.8; a.goto(0.2, 1.8, Math.PI); await wait(3200);
  } else await wait(300);
  look = true;
  if (rpg.dead(tk)) return;
  await talk([
    M('老闆！我要訂一個遊戲！'), B('歡迎光臨！想要什麼樣的遊戲呀？'),
    M('就是……水果會從天上掉下來，然後……要很好玩！'), B(`${nm()}，你聽到了嗎？`),
    B('「水果從天上掉下來」，「要很好玩」。', {do: bossDo('Interact')}),
    B('這句話聽起來很清楚，其實很模糊。'), B('不知道誰來玩、怎麼玩、怎麼算贏。', {do: () => view && view.shot('customers')}),
    B('現在就開工的話，做出來很可能跟客人想的不一樣，還要整個重做。'),
    B('所以接單的第一件事，是「問清楚」。'),
    B(`${nm()}，這一張訂單，換你來問！`, {choices: ['好，我來問她！']})], tk);
  if (rpg.dead(tk)) return;
  sfx('right'); done(0); go(1);
}

/* ================= 1 問需求 ================= */
const QS = [
  {k: 'who', must: 1, q: '玩的人要怎麼控制？', sub: '誰在動、用什麼按',
    a: ['這還用問，當然是用鍵盤的左右鍵！', '玩的人控制一個籃子，左右移動去接水果。'], sheet: '玩家：用 ← → 鍵，左右移動籃子', empty: '玩家要怎麼控制？'},
  {k: 'fall', must: 1, q: '水果是怎麼出現的？', sub: '從哪裡來、怎麼動',
    a: ['從畫面最上面冒出來，位置隨便，不要每次都一樣！', '一顆接一顆，慢慢往下掉。'], sheet: '掉落物：從上方隨機位置出現，往下掉', empty: '水果怎麼出現、怎麼掉？'},
  {k: 'score', must: 1, q: '怎麼算得分？', sub: '什麼時候加、加多少',
    a: ['籃子接到一顆，就加 1 分！', '分數要一直顯示在畫面上，我才知道今天賺了多少。'], sheet: '規則：接到水果加 1 分，畫面上要看得到分數', empty: '怎麼得分？'},
  {k: 'miss', must: 1, q: '沒接到的水果怎麼辦？', sub: '掉到地上以後呢',
    a: ['掉到地上就讓它不見啦！', '不然地上堆滿水果，電腦會很慢，攤位也很亂。'], sheet: '規則：水果掉到地上就消失（用完的要收掉）', empty: '沒接到的水果怎麼辦？'},
  {k: 'look', q: '你想要什麼樣子？', sub: '外觀、顏色',
    a: ['籃子要像我攤位上那種竹籃！', '掉下來的就是紅蘋果，其他細節你來決定。'], sheet: '外觀：竹籃、紅蘋果（由設計師來畫）'},
  {k: 'fun', q: '你說的「很好玩」是什麼意思？', sub: '把感覺問成具體的事',
    a: ['呃……就是越玩越緊張的那種感覺？', '不過第一版先做簡單的就好，之後我再來提意見！'], sheet: '（客人說之後可能追加：更刺激的玩法）',
    boss: '「好玩」「刺激」這種感覺，客人常常說不清楚。先做簡單版給她玩，再根據她的反應改，這是很常見的做法。'},
  {k: 'junk', q: '你今年幾歲？', sub: '（跟遊戲有關嗎？）', junk: 1,
    a: ['哎呀，這是祕密啦～', '你還是多問問遊戲的事吧！'], boss: '跟遊戲沒有關係的問題，先省著。客人的時間很寶貴，要問就問會影響怎麼做的事。'}
];
const MUST = QS.filter(q => q.must);
const mustDone = () => MUST.every(q => S.asked[q.k]);
async function stepAsk(tk) {
  look = true; wantFocus = true;
  showBench(false); await stage(); if (rpg.dead(tk)) return;
  if (view) { await meiAt(0.2, 1.8); view.focus('mei'); }
  let busy = false;
  const render = () => {
    const sheetItems = [h('li', {}, '水果會從天上掉下來'), h('li', {}, '要很好玩')].concat(
      QS.filter(q => q.sheet && S.asked[q.k]).map(q => h('li', {class: S.asked[q.k] === 2 ? 'new' : ''}, q.sheet)),
      MUST.filter(q => !S.asked[q.k]).map(q => h('li', {class: 'empty'}, q.empty)));
    QS.forEach(q => { if (S.asked[q.k] === 2) S.asked[q.k] = 1; });
    const must = h('div', {class: 'must'}, '必問：', ...MUST.map(q => h('i', {class: S.asked[q.k] ? 'on' : ''}, S.asked[q.k] ? '✓' : '')), h('span', {}, mustDone() ? '都問到了！' : `還差 ${MUST.filter(q => !S.asked[q.k]).length} 個`));
    const nb = h('button', {class: 'btn', onclick: () => { if (!busy) next(); }}, '問完了，簽約');
    nb.disabled = !mustDone();
    sideShow(
      h('h2', {}, '向客人問清楚'),
      h('p', {class: 'sub'}, '客人的話常常很模糊。點一個問題問她，答案會寫進下面的「需求單」。'),
      h('div', {class: 'qlist'}, ...QS.map(q => h('button', {class: 'qbtn' + (S.asked[q.k] ? (q.junk ? ' off' : ' asked') : ''), onclick: () => ask(q)}, q.q, h('small', {}, q.sub)))),
      must,
      h('div', {class: 'sheet'}, h('h3', {}, '📝 訂單 #1 需求單'), h('ul', {}, ...sheetItems)),
      h('div', {class: 'sidebtns'}, h('span'), nb));
  };
  const next = async () => {
    busy = true;
    await talk([B('四件關鍵的事都問到了！'), B('接下來，我們把這些需求整理成「工作單」。')], tk);
    if (rpg.dead(tk)) return; done(1); go(2);
  };
  const ask = async q => {
    if (busy) return; busy = true;
    const first = !S.asked[q.k];
    const lines = [ME(q.q), ...q.a.map(t => M(t))];
    if (first && q.boss) lines.push(B(q.boss));
    if (first && !q.junk) { S.asked[q.k] = 2; save(); } else if (first) { S.asked[q.k] = 1; save(); }
    const r = await talk(lines, tk);
    if (rpg.dead(tk)) return;
    busy = false; render();
    if (first && !q.junk && mustDone() && !S.mustSaid) { S.mustSaid = true; save(); busy = true; await talk([B('漂亮！必問的四件事都問到了。', {do: bossDo('Cheer')}), B('還有想知道的可以繼續問，問完就按「簽約」。')], tk); busy = false; }
  };
  render();
  if (!S.askIntro) {
    S.askIntro = true; save(); busy = true;
    await talk([B('提醒你，需求單上有幾個「？」。'), B('玩家怎麼動、水果怎麼掉、怎麼得分、沒接到怎麼辦，這四件事一定要問清楚。'), B('點右邊的問題，開始問吧！')], tk);
    busy = false;
  }
}

/* ================= 2 簽約：拆成工作單 ================= */
async function stepSign(tk) {
  look = true; wantFocus = true;
  showBench(false); await stage(); if (rpg.dead(tk)) return;
  if (view) { await meiAt(0.2, 1.8); view.focus('mei'); }
  const items = [
    {t: '用左右鍵移動的籃子', a: '玩家'}, {t: '從天上掉下來的水果', a: '掉落物'},
    {t: '接到水果就加 1 分', a: '規則'}, {t: '水果掉到地上就消失', a: '規則'},
    {t: '每隔一下就掉下一顆新的水果', a: '規則'}, {t: '按住左鍵籃子往左、按住右鍵往右', a: '規則'}
  ];
  await talk([B('需求清楚了，不過工作單還不能直接開工。'), B('要先把需求拆成三種東西：'), B('「玩家」是你控制的，「掉落物」是會動的東西，「規則」是怎麼玩、怎麼算分。', {do: bossDo('Interact')}),
    B('把客人的需求一條一條分類，施工圖就畫好了。')], tk);
  if (rpg.dead(tk)) return;
  let right = 0;
  const nb = h('button', {class: 'btn'}, '請客人簽名'); nb.disabled = true;
  const list = h('div', {});
  items.forEach(it => {
    const why = h('div', {class: 'sub', style: 'display:none;margin-top:4px'});
    const row = h('div', {class: 'item'}, h('div', {class: 't'}, it.t, why));
    ['玩家', '掉落物', '規則'].forEach(k => row.append(h('button', {onclick: () => {
      if (row.classList.contains('right')) return;
      if (k === it.a) { sfx('right'); row.classList.remove('wrong'); row.classList.add('right'); why.style.display = 'none'; row.querySelectorAll('button').forEach(b => { b.disabled = true; }); row.append(h('b', {style: 'color:#1f6a43'}, '✓ ' + it.a)); if (++right === items.length) { nb.disabled = false; sfx('combo'); } }
      else { sfx('wrong'); row.classList.add('wrong'); setTimeout(() => row.classList.remove('wrong'), 500); why.style.display = 'block'; why.textContent = '再想想：它是「一個看得到的東西」，還是「一條怎麼玩的規則」？'; }
    }}, k)));
    list.append(row);
  });
  nb.onclick = async () => {
    nb.disabled = true;
    const sheet = h('div', {class: 'sheet'}, h('h3', {}, '📝 訂單 #1 工作單'), h('ul', {}, ...items.map(it => h('li', {}, `${it.a}：${it.t}`))), h('div', {class: 'stamp'}, '成立'));
    sideShow(h('h2', {}, '工作單完成'), sheet); sfx('boot');
    await talk([M('嗯嗯，跟我想的一樣！我簽名！', {do: () => { view && view.actors.mei && view.actors.mei.once('Cheer'); }}),
      B('訂單 #1 成立！', {do: () => view && view.burst({x: 0.2, y: 1.8, z: 1.8}, 0xffc83d, 60, 4)}),
      M('我下次來，就能玩到我的遊戲了吧？拜託你們囉！'), B('交給我們！'),
      B(`${nm()}，去工作台吧！先準備素材，再開工。`)], tk);
    if (rpg.dead(tk)) return;
    if (view && view.actors.mei) { view.unfocus(); view.actors.mei.goto(6.5, 1.8, Math.PI / 2); }
    done(2); go(3);
  };
  sideShow(h('h2', {}, '把需求拆成工作單'), h('p', {class: 'sub'}, '每一條需求，是「玩家」、「掉落物」，還是「規則」？'), list, h('div', {class: 'sidebtns'}, h('button', {class: 'btn sec', onclick: () => go(1)}, '回去問客人'), nb));
}

/* ================= 素材（SVG 產生） ================= */
const COLORS = ['#e8483a', '#f29c1f', '#f2d229', '#4caf50', '#3b8ed8', '#9b59d0', '#e86aa8', '#c98a4b'];
function basketSVG(kind, c) {
  const dark = '#3a2a1c';
  if (kind === 'bowl') return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="56" viewBox="0 0 90 56"><path d="M4 8 H86 Q84 52 45 52 Q6 52 4 8Z" fill="${c}" stroke="${dark}" stroke-width="3"/><rect x="2" y="4" width="86" height="9" rx="4" fill="${c}" stroke="${dark}" stroke-width="3"/></svg>`;
  if (kind === 'bucket') return `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="64" viewBox="0 0 84 64"><path d="M8 10 H76 L68 58 H16Z" fill="${c}" stroke="${dark}" stroke-width="3"/><ellipse cx="42" cy="10" rx="34" ry="7" fill="#fff6" stroke="${dark}" stroke-width="3"/><path d="M12 28 H72" stroke="${dark}" stroke-width="2.5"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="60" viewBox="0 0 90 60"><path d="M6 8 H84 L74 52 Q73 56 68 56 H22 Q17 56 16 52 Z" fill="${c}" stroke="${dark}" stroke-width="3"/><path d="M24 10 L28 54 M45 10 V56 M66 10 L62 54" stroke="${dark}" stroke-width="2.5" fill="none"/><rect x="3" y="4" width="84" height="9" rx="4" fill="${c}" stroke="${dark}" stroke-width="3"/></svg>`;
}
function itemSVG(kind, c) {
  const dark = '#3a2a1c';
  if (kind === 'star') return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="52" viewBox="0 0 54 52"><polygon points="27,3 34,19 51,20 38,31 42,48 27,39 12,48 16,31 3,20 20,19" fill="${c}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  if (kind === 'cookie') return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" fill="${c}" stroke="${dark}" stroke-width="3"/><circle cx="17" cy="19" r="3.5" fill="${dark}"/><circle cx="33" cy="16" r="3.5" fill="${dark}"/><circle cx="30" cy="31" r="3.5" fill="${dark}"/><circle cx="18" cy="34" r="3.5" fill="${dark}"/></svg>`;
  if (kind === 'gem') return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="48" viewBox="0 0 52 48"><polygon points="14,4 38,4 50,18 26,46 2,18" fill="${c}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/><path d="M2 18 H50 M14 4 L20 18 L26 46 L32 18 L38 4" stroke="${dark}" stroke-width="2" fill="none"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="54" viewBox="0 0 80 90"><path d="M40 14 C 12 10, 4 40, 10 60 C 16 82, 34 86, 40 80 C 46 86, 64 82, 70 60 C 76 40, 68 10, 40 14 Z" fill="${c}" stroke="${dark}" stroke-width="3"/><path d="M40 14 C 40 6, 44 2, 50 2" fill="none" stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"/><path d="M44 10 C 54 0, 66 4, 66 4 C 64 14, 52 16, 44 10 Z" fill="#3ea34a" stroke="#1f6a2b" stroke-width="2"/></svg>`;
}
const svgSize = svg => { const m = svg.match(/width="(\d+)" height="(\d+)"/); return {w: +m[1], h: +m[2]}; };

/* ================= 3 備素材（工作台・素材工坊） ================= */
function benchHead(txt) { $('#bticket').textContent = txt || `訂單 #1｜${CUS}｜接水果遊戲`; }
function bossFeedAdd(t) {
  const f = $('#bfeed'); if (!f) { toast('老闆：' + t); return; }
  f.append(h('div', {class: 'bmsg'}, h('div', {class: 'av'}, '🧔'), h('div', {class: 'tx'}, t))); f.closest('.scard').scrollIntoView({block: 'nearest', behavior: 'smooth'});
}
function sheetCard() {
  const lines = QS.filter(q => q.sheet && S.asked[q.k] && q.k !== 'fun').map(q => h('li', {}, q.sheet));
  return h('div', {class: 'scard paper'}, h('h3', {}, '📝 客人的需求單'), h('ul', {style: 'list-style:none;padding:0;margin:0'}, ...lines));
}
let slipExtra = null;
function rest(next) {
  sfx('combo');
  const o = h('div', {id: 'rest', style: 'position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#0009'},
    h('div', {style: 'width:min(560px,92vw);background:#fffdf6;border:4px solid #5b4fd0;border-radius:22px;padding:26px 30px;box-shadow:0 0 0 4px #1d1840;text-align:center;color:#2b2358'},
      h('div', {style: 'font-size:46px'}, '☕'), h('h2', {style: 'margin:6px 0'}, '第一節完成！休息一下'),
      h('p', {style: 'font-size:17px;line-height:1.8;margin:6px 0 14px'}, '訂單已簽約、素材也備好了。進度已自動存檔，下課前關掉頁面也沒關係。第二節我們要在真正的 Scratch 裡，把遊戲做出來！'),
      h('button', {class: 'btn', onclick: () => { o.remove(); next(); }}, '第二節開始，開工！')));
  document.body.append(o);
}
function stepArt(tk) {
  showBench(true); stage(); preloadEditor();
  $('#editorLoading').style.display = 'none'; $('#bpage').hidden = false; benchHead();
  $('#slip').replaceChildren(); $('#slip').style.display = 'none';
  const page = $('#bpage'); page.replaceChildren();
  const A = S.art;
  const prevB = h('div', {class: 'prev'}), prevI = h('div', {class: 'prev'});
  const refresh = () => { prevB.innerHTML = basketSVG(A.basket, A.bc); prevI.innerHTML = itemSVG(A.item, A.ic); save(); };
  const choiceRow = (list, key) => { const r = h('div', {class: 'choices'}); list.forEach(c => { const b = h('button', {class: A[key] === c[0] ? 'on' : '', onclick: () => { A[key] = c[0]; r.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); refresh(); }}, c[1]); r.append(b); }); return r; };
  const colorRow = key => { const r = h('div', {class: 'colors'}); COLORS.forEach(c => { const b = h('button', {style: 'background:' + c, class: A[key] === c ? 'on' : '', onclick: () => { A[key] = c; r.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); refresh(); }}); r.append(b); }); return r; };
  const nb = h('button', {class: 'btn'}, '素材準備好了，開工'); nb.disabled = !S.judged; nb.onclick = () => { done(3); if (S.rested) return go(4); S.rested = true; save(); rest(() => go(4)); };
  const judge = [
    {t: '用素材工坊自己畫的籃子', ok: true, why: '自己畫的，可以放心用。'},
    {t: '同學畫的圖，他同意讓我用，我也在作品裡寫上他的名字', ok: true, why: '有經過同意並註明，這樣是尊重別人的作品。'},
    {t: '在網路上找到的卡通角色圖（例如皮卡丘），直接放進我的遊戲', ok: false, why: '那是別人的角色，有版權。作品要交給客人、也可能被分享，不能直接拿來用。'},
    {t: '把別人遊戲的畫面截圖，當成我的背景', ok: false, why: '截圖裡的圖是別人做的，不是你的。要用，就自己畫。'}
  ];
  let right = S.judged ? judge.length : 0;
  const jbox = h('div', {});
  judge.forEach(it => {
    const why = h('div', {class: 'sub', style: 'display:none;margin-top:4px'});
    const row = h('div', {class: 'item' + (S.judged ? ' right' : '')}, h('div', {class: 't'}, it.t, why));
    [['可以用', true], ['要小心', false]].forEach(k => row.append(h('button', {onclick: () => {
      if (row.classList.contains('right')) return;
      if (k[1] === it.ok) { sfx('right'); row.classList.remove('wrong'); row.classList.add('right'); why.style.display = 'block'; why.textContent = it.why; row.querySelectorAll('button').forEach(b => { b.disabled = true; }); if (++right === judge.length) { S.judged = true; save(); nb.disabled = false; sfx('combo'); toast('素材判斷全對！'); } }
      else { sfx('wrong'); row.classList.add('wrong'); setTimeout(() => row.classList.remove('wrong'), 500); why.style.display = 'block'; why.textContent = '再想想：這張圖是誰做的？我可以直接用嗎？'; }
    }}, k[0])));
    jbox.append(row);
  });
  const said = S.asked.look ? '客人說：「籃子要像我攤位上的竹籃，掉下來的是紅蘋果，其他你來決定。」' : '客人沒有特別指定樣子，你可以自己決定。';
  page.append(h('div', {class: 'pcard'},
    h('span', {class: 'tag'}, '備素材'), h('h2', {}, '素材工坊：做出遊戲裡的角色'),
    h('div', {class: 'bmsg', style: 'margin:8px 0'}, h('div', {class: 'av'}, '🧔'), h('div', {class: 'tx'}, `${nm()}，這裡是工作台！動手寫程式之前，先把遊戲要用的圖準備好。`)),
    h('div', {class: 'lead'}, said, '選好形狀和顏色，等一下它們會直接出現在 Scratch 裡。'),
    h('div', {class: 'ws'},
      h('div', {class: 'wsbox'}, h('h3', {}, '接東西的人（玩家）'), prevB, choiceRow([['basket', '編織籃'], ['bowl', '碗'], ['bucket', '水桶']], 'basket'), colorRow('bc')),
      h('div', {class: 'wsbox'}, h('h3', {}, '掉下來的東西（掉落物）'), prevI, choiceRow([['apple', '蘋果'], ['star', '星星'], ['cookie', '餅乾'], ['gem', '寶石']], 'item'), colorRow('ic'))),
    h('h3', {}, '用素材之前，老闆要你先判斷一下'), jbox,
    h('div', {class: 'row'}, h('button', {class: 'btn sec', onclick: () => go(2)}, '回櫃台'), nb)));
  refresh();
}

/* ================= 真的 Scratch 編輯器 ================= */
const ed = {vm: null, ready: null, loadedFor: null, timer: null, myBlob: null};
function loadScript(src) {
  return new Promise((res, rej) => { if (window.GUI) return res(); const s = h('script', {src}); s.onload = res; s.onerror = () => rej(new Error('編輯器檔案載入失敗')); document.head.append(s); });
}
function preloadEditor() { loadScript('/editor/scratch-gui-standalone.js').catch(() => { }); }
function ensureEditor() {
  if (ed.ready) return ed.ready;
  ed.ready = loadScript('/editor/scratch-gui-standalone.js').then(() => new Promise(resolve => {
    const host = $('#editor');
    GUI.setAppElement(host);
    const state = new GUI.EditorState({locale: 'zh-tw'});
    const root = GUI.createStandaloneRoot(state, host);
    root.render({menuBarHidden: true, canSave: false, canEditTitle: false, backpackVisible: false, onVmInit: vm => { ed.vm = vm; window.__vm = vm; }});
    state.store.dispatch(GUI.setProjectId(String(GUI.defaultProjectId)));
    const t = setInterval(() => { if (ed.vm && ed.vm.editingTarget) { clearInterval(t); setTimeout(resolve, 400); } }, 200);
  }));
  return ed.ready;
}
const loadProjectFile = url => fetch(url).then(r => r.arrayBuffer()).then(buf => { ed.vm.stopAll(); return ed.vm.loadProject(buf); });
function replaceCostume(target, svg) {
  const vm = ed.vm, st = vm.runtime.storage, sz = svgSize(svg);
  const asset = st.createAsset(st.AssetType.ImageVector, st.DataFormat.SVG, new TextEncoder().encode(svg), null, true);
  const md5ext = asset.assetId + '.svg';
  return vm.addCostume(md5ext, {name: '我的素材', md5: md5ext, assetId: asset.assetId, asset, dataFormat: 'svg', rotationCenterX: sz.w / 2, rotationCenterY: sz.h / 2, bitmapResolution: 1}, target.id).then(() => target.deleteCostume(0));
}
const findSprite = name => ed.vm.runtime.targets.filter(t => !t.isStage && t.isOriginal && t.sprite.name === name)[0];
function applyArt() {
  const b = findSprite('籃子'), f = findSprite('水果');
  const p1 = b ? replaceCostume(b, basketSVG(S.art.basket, S.art.bc)) : Promise.resolve();
  return p1.then(() => f ? replaceCostume(f, itemSVG(S.art.item, S.art.ic)) : null);
}
function analyze() {
  const proj = JSON.parse(ed.vm.toJSON());
  const ops = {}, vars = [];
  proj.targets.forEach(t => {
    Object.keys(t.blocks || {}).forEach(id => { const b = t.blocks[id]; if (b && typeof b === 'object' && b.opcode) ops[b.opcode] = (ops[b.opcode] || 0) + 1; });
    Object.keys(t.variables || {}).forEach(id => vars.push({name: t.variables[id][0], global: !!t.isStage, owner: t.name}));
  });
  const has = o => (ops[o] || 0) > 0, cnt = o => ops[o] || 0, hasVar = n => vars.some(v => v.name.indexOf(n) >= 0);
  const nSprites = proj.targets.filter(t => !t.isStage).length;
  return {
    modLife: hasVar('生命') && cnt('data_changevariableby') >= 2 && has('control_stop'),
    modBomb: nSprites >= 3 && cnt('control_create_clone_of') >= 2 && cnt('control_start_as_clone') >= 2,
    modSpeed: hasVar('速度') && (has('operator_subtract') || has('operator_multiply')),
    keysMove: has('sensing_keypressed') && (has('motion_changexby') || has('motion_setx')),
    keysWrongAxis: has('sensing_keypressed') && !(has('motion_changexby') || has('motion_setx')) && has('motion_changeyby'),
    spawn: has('control_create_clone_of') && has('control_forever'),
    cloneFall: has('control_start_as_clone') && (has('motion_changeyby') || has('motion_sety')),
    score: has('sensing_touchingobject') && has('data_changevariableby'),
    varGlobal: vars.some(v => v.global),
    varLocalOnly: vars.length > 0 && !vars.some(v => v.global),
    del: has('control_delete_this_clone'),
    hasVar: vars.length > 0
  };
}
const cloneCount = () => ed.vm ? ed.vm.runtime.targets.filter(t => !t.isStage && !t.isOriginal).length : 0;

const CHECKS = [
  {k: 'keysMove', t: '籃子：按住左右鍵就會左右移動', hint: '事件→「當綠旗被點擊」，加「重複無限次」，裡面放兩個「如果…那麼」，條件用偵測的「按下 ← 鍵？」，裡面放「x 改變 10」。', bad: a => a.keysWrongAxis ? '你用的是「y 改變」，籃子會上下跑。左右移動要用「x 改變」。' : null},
  {k: 'spawn', t: '水果：每隔一下就建立一個分身', hint: '水果角色：「當綠旗被點擊」→「重複無限次」→「建立 自己 的分身」→「等待 0.6 秒」。'},
  {k: 'cloneFall', t: '分身出生後往下掉', hint: '控制的「當分身產生時」→「移到 x:隨機 y:170」→「顯示」→「重複直到 y 座標 < -150」，裡面放「y 改變 -6」。'},
  {k: 'score', t: '分身碰到籃子就加分', hint: '在往下掉的「重複」裡，放「如果 碰到 籃子？ 那麼」→「將 分數 改變 1」。'},
  {k: 'varGlobal', t: '分數變數是「適用於所有角色」', hint: '變數→「建立一個變數」，名字叫「分數」，選「適用於所有角色」。選成「只適用於這個角色」，每個分身會各算各的。', bad: a => a.varLocalOnly ? '你的分數是「只適用於這個角色」。每個分身各算各的，總分加不起來。刪掉它，重新建立一個「適用於所有角色」的。' : null},
  {k: 'del', t: '用完的分身會被刪除', hint: '碰到籃子加完分之後、以及掉到地上的時候，都要接「刪除這個分身」。不刪的話，場上分身會越來越多。'}
];
const POWERS = [
  {k: 'modLife', icon: '❤️', t: '生命模組', d: '漏接水果就少一條命，三條命用完，遊戲結束。', hint: '①變數→建立「生命」（適用於所有角色）。②綠旗時「將 生命 設為 3」。③水果掉到地上（沒接到）時「將 生命 改變 -1」。④加一個「如果 生命 < 1 那麼」→「停止 全部」。'},
  {k: 'modBomb', icon: '💣', t: '炸彈模組', d: '多一個炸彈角色，接到炸彈就扣命。', hint: '①畫一個新角色「炸彈」。②照水果的做法：綠旗→隱藏→重複無限次建立分身（等 2.5 秒）。③「當分身產生時」往下掉，碰到籃子就「將 生命 改變 -1」再刪除。（需要先裝好生命模組）'},
  {k: 'modSpeed', icon: '⚡', t: '加速模組', d: '越接越快，每接 5 顆，下落速度加 1。', hint: '①建立變數「速度」（適用於所有角色），綠旗時設為 5。②把掉落的「y 改變 -6」換成「y 改變（0 - 速度）」。③接到水果加分後：如果「分數 除以 5 的餘數 = 0」，就「將 速度 改變 1」。'}
];
const DEBUG = [
  {k: 'a', sym: '玩一陣子之後，場上的水果越來越多，電腦會變慢。', hint: ['先按綠旗玩一下，看看左邊「場上分身數量」的數字。', '分身用完之後會去哪裡？看看控制裡有沒有一塊會讓分身消失。', '在水果的「當分身產生時」那一串，最後面接上「刪除這個分身」；接到籃子加分之後也要刪。'], fixed: a => a.del, why: '分身用完沒有刪除，會一直留在場上。'},
  {k: 'b', sym: '籃子明明接到了水果，左上角的分數卻一直是 0。', hint: ['先按綠旗，用 ← → 移動籃子去接水果，看看分數。', '到「變數」那一頁，看看「分數」前面的小框，是在舞台還是在水果角色上？', '把這個變數刪掉，重新建立，選「適用於所有角色」，再把積木裡的變數換成新的。'], fixed: a => a.varGlobal, why: '分數是「只適用於這個角色」的變數，每個分身各算各的。'},
  {k: 'c', sym: '按 ← → 時，籃子竟然往上、往下跑。', hint: ['選到「籃子」角色，看看它的程式。', '「x 改變」和「y 改變」差在哪裡？想想左右是 x 還是 y。', '把「y 改變」換成「x 改變」就好了。'], fixed: a => a.keysMove, why: '左右移動要用「x 改變」，上下才是「y 改變」。'}
];

/* ---------- 工作台：訂單單 + 編輯器 ---------- */
let curMode = 'build', hintIdx = 0;
const MODE_TXT = {build: '開工：把「接水果」做出來', power: '客人追加：強化模組', debug: 'Bug 怪來搗亂：修好它'};
function enterCode(mode, tk) {
  showBench(true); stage();
  curMode = mode; hintIdx = 0; $('#bpage').hidden = true; $('#slip').style.display = ''; benchHead(`訂單 #1｜${CUS}｜${MODE_TXT[mode]}`);
  renderSlip();
  const loading = $('#editorLoading'); loading.style.display = 'flex'; loading.textContent = '工作台準備中…第一次會慢一點';
  ensureEditor().then(() => {
    const isDebug = mode === 'debug', key = isDebug ? 'debug' : 'build';
    if (ed.loadedFor === key) return;
    const stash = (isDebug && ed.loadedFor === 'build') ? ed.vm.saveProjectSb3().then(b => { ed.myBlob = b; }) : Promise.resolve();
    return stash.then(() => loadProjectFile(isDebug ? `/projects/l1_debug_${DEBUG[S.debugVariant].k}.sb3` : '/projects/l1_start.sb3'))
      .then(() => isDebug ? null : applyArt()).then(() => { ed.loadedFor = key; });
  }).then(() => {
    loading.style.display = 'none'; window.dispatchEvent(new Event('resize'));
    clearInterval(ed.timer); ed.timer = setInterval(liveUpdate, 600); liveUpdate();
  }).catch(e => { loading.textContent = '編輯器載入失敗：' + e.message; });
  if (tk != null && !S['intro_' + mode]) {
    S['intro_' + mode] = 1; save();
    const msg = {build: '這裡就是工作台！右邊是真的 Scratch，左邊是客人的需求單。做好一項，清單就會打勾。卡住了就按「問老闆」。',
      power: '客人追加需求啦！從三個模組裡挑至少兩個，裝到你自己的遊戲上。每個模組旁邊都有「怎麼做」。',
      debug: 'Bug 怪溜進工作台，把這個遊戲弄壞了！先按綠旗玩玩看，找出哪裡不對，把它修好。'}[mode];
    setTimeout(() => bossFeedAdd(msg), 400);
  }
}
function renderSlip() {
  const s = $('#slip'); s.replaceChildren();
  const dbg = DEBUG[S.debugVariant];
  let head;
  if (curMode === 'debug') head = h('div', {}, h('h3', {}, '🐛 這個遊戲壞掉了'), h('p', {}, '症狀：', h('b', {}, dbg.sym)), h('p', {}, '找出原因，修好它，再按「檢查」。'));
  else if (curMode === 'power') head = h('div', {}, h('h3', {}, '📣 客人的追加要求'), h('p', {}, '「要更刺激！有生命、有炸彈、越接越快！」'), h('p', {}, '挑 ', h('b', {}, '至少 2 個'), ' 模組裝到你的遊戲上。'));
  else head = h('div', {}, h('h3', {}, '訂單 #1：接水果'), h('p', {}, '右邊已經有你畫好的籃子和水果，用積木讓它們動起來。'));
  s.append(h('div', {class: 'scard'}, head));
  s.append(h('div', {class: 'scard'}, h('div', {class: 'actions'},
    curMode === 'power' ? null : h('button', {class: 'btn sec small', onclick: showHint}, '💡 問老闆'),
    h('button', {class: 'btn small', onclick: doCheck}, curMode === 'debug' ? '✔ 檢查修好沒' : '✔ 交貨檢查'),
    curMode === 'build' ? h('button', {class: 'btn sec small', onclick: () => go(3)}, '回素材') : null),
    h('div', {class: 'fb', id: 'diag'})));
  s.append(h('div', {class: 'scard'}, h('h3', {}, '老闆的話'), h('div', {class: 'bossfeed', id: 'bfeed'})));
  if (curMode === 'power') {
    const pl = h('ul', {class: 'check', id: 'plist'});
    POWERS.forEach(c => pl.append(h('li', {'data-k': c.k}, h('i', {}, ''), h('div', {}, h('b', {}, c.icon + ' ' + c.t), h('div', {style: 'font-size:14px;color:#555'}, c.d),
      h('details', {style: 'margin-top:4px;font-size:14px'}, h('summary', {style: 'cursor:pointer;color:#a33'}, '怎麼做？'), h('div', {style: 'line-height:1.6;margin-top:4px'}, c.hint))))));
    s.append(h('div', {class: 'scard'}, h('h3', {}, '模組清單（裝 2 個以上）'), pl));
  } else {
    const list = h('ul', {class: 'check', id: 'checklist'});
    CHECKS.forEach(c => list.append(h('li', {'data-k': c.k}, h('i', {}, ''), c.t)));
    s.append(h('div', {class: 'scard'}, h('h3', {}, curMode === 'debug' ? '修好之後應該是這樣' : '完成清單'), list));
  }
  if (curMode === 'build') s.append(sheetCard());
  s.append(h('div', {class: 'scard'}, h('h3', {}, '場上分身數量'), h('div', {class: 'hud'}, h('b', {id: 'cc'}, '0'), h('span', {id: 'cn'}, '按綠旗開始'))));
}
function liveUpdate() {
  if (!ed.vm) return;
  const n = cloneCount(), cc = $('#cc'), cn = $('#cn');
  if (cc) { cc.textContent = n; cc.className = n > 60 ? 'bad' : ''; }
  if (cn) cn.textContent = n > 60 ? '個。太多了！電腦會變慢，Scratch 最多只能有 300 個。' : (n === 0 ? '個（按綠旗開始）' : '個');
  const a = analyze();
  document.querySelectorAll('#plist li').forEach(li => { const ok = !!a[li.getAttribute('data-k')]; li.className = ok ? 'ok' : ''; li.firstChild.textContent = ok ? '✓' : ''; });
  document.querySelectorAll('#checklist li').forEach(li => { const ok = !!a[li.getAttribute('data-k')]; li.className = ok ? 'ok' : ''; li.firstChild.textContent = ok ? '✓' : ''; });
}
function showHint() {
  S.hints++; save();
  if (curMode === 'debug') { const l = DEBUG[S.debugVariant].hint; bossFeedAdd(l[Math.min(hintIdx++, l.length - 1)]); return; }
  const a = analyze(), miss = CHECKS.filter(c => !a[c.k]);
  bossFeedAdd(miss.length ? miss[0].hint : '都完成了！按「交貨檢查」試試看。');
}
document.addEventListener('click', e => { if (e.target && e.target.id === 'callboss') showHint(); });
$('#callboss').onclick = showHint;
function liveTest() {
  const vm = ed.vm;
  return new Promise(resolve => {
    vm.stopAll();
    const basket = findSprite('籃子'); const x0 = basket ? basket.x : 0, y0 = basket ? basket.y : 0; let maxClones = 0;
    vm.greenFlag();
    const tick = setInterval(() => { maxClones = Math.max(maxClones, cloneCount()); }, 100);
    setTimeout(() => vm.postIOData('keyboard', {key: 'ArrowRight', isDown: true}), 400);
    setTimeout(() => vm.postIOData('keyboard', {key: 'ArrowRight', isDown: false}), 1300);
    setTimeout(() => { clearInterval(tick); const r = {maxClones, dx: basket ? basket.x - x0 : 0, dy: basket ? basket.y - y0 : 0}; vm.stopAll(); resolve(r); }, 3800);
  });
}
function doCheck() {
  const d = $('#diag'); d.className = 'fb show warn'; d.textContent = '試跑中…請稍等 4 秒，不要動滑鼠。'; S.checks++; save();
  const a = analyze();
  liveTest().then(r => {
    const problems = [];
    if (curMode === 'power') {
      const got = POWERS.filter(p => a[p.k]);
      if (got.length < 2) problems.push(`目前裝好 ${got.length} 個模組，至少要 2 個。打開模組旁邊的「怎麼做？」看步驟。`);
      if (a.modBomb && !a.modLife) problems.push('炸彈要扣命，所以要先裝好「生命模組」。');
    } else if (curMode === 'debug') {
      const dbg = DEBUG[S.debugVariant];
      if (!dbg.fixed(a)) problems.push('還沒修好。' + dbg.sym + ' 想想看原因，需要的話按「問老闆」。');
    } else CHECKS.forEach(c => { if (!a[c.k]) problems.push((c.bad && c.bad(a)) || ('還沒完成：' + c.t + '。')); });
    if (!problems.length && curMode !== 'debug') {
      if (r.maxClones === 0) problems.push('積木都有了，但按綠旗後場上一個水果都沒有出現。檢查「建立自己的分身」有沒有放在「當綠旗被點擊」下面，並且分身有「顯示」。');
      else if (Math.abs(r.dx) < 5) problems.push('試跑時按住 → 鍵，籃子沒有動。檢查「如果 按下 → 鍵」裡面有沒有放「x 改變」。');
      else if (Math.abs(r.dy) > 5) problems.push('籃子按左右鍵時，上下位置也變了。左右移動只能用「x 改變」。');
      else if (r.maxClones > 80) problems.push(`試跑 4 秒就出現了 ${r.maxClones} 個分身，太多了。分身用完要刪除。`);
    }
    if (problems.length) {
      d.className = 'fb show warn'; d.replaceChildren(h('b', {}, '還差一點：'), ...problems.slice(0, 3).map(t => h('div', {}, '• ' + t)));
      sfx('wrong');
    } else {
      sfx('combo'); d.className = 'fb show good'; d.replaceChildren();
      const idx = {build: 4, power: 6, debug: 7}[curMode], nextI = idx + 1;
      if (curMode === 'power') { S.mods = POWERS.filter(p => a[p.k]).map(p => p.k); save(); }
      if (curMode === 'debug') d.append(h('div', {}, '✓ 修好了！' + DEBUG[S.debugVariant].why));
      else d.append(h('div', {}, curMode === 'power' ? '✓ 強化完成！按綠旗玩玩看，是不是刺激多了？' : `✓ 通過！試跑 4 秒：籃子會跟著按鍵移動，場上最多 ${r.maxClones} 個分身。`));
      done(idx);
      d.append(h('div', {class: 'row', style: 'margin-top:8px'}, h('span'), h('button', {class: 'btn small', onclick: () => go(nextI)}, curMode === 'build' ? '交貨給客人' : (curMode === 'power' ? '下一步' : '交差，結單'))));
    }
  });
}
/* 這幾步進入工作台時啟動編輯器 */
const enterBuild = tk => enterCode('build', tk);
const stepBuild = tk => enterBuild(tk);

/* ================= 5 交貨 + 客人抱怨（追加需求） ================= */
async function stepDeliver(tk) {
  look = true; wantFocus = false;
  showBench(false); await stage(); if (rpg.dead(tk)) return;
  if (view) { await meiAt(6.5, 1.8, Math.PI / 2); const a = view.actors.mei; a.speed = 2.8; a.goto(0.2, 1.8, Math.PI); view.shot('customers'); await wait(2600); }
  await talk([
    B(`${nm()}，你的第一個遊戲做好了！`), B('我把它插上街機，請客人來試玩看看。', {do: () => view && view.cabinet('idle', '')}),
    N('水果攤老闆娘拿起搖桿……不，是按了鍵盤的左右鍵。'),
    M('哇！籃子會動！水果真的掉下來了！', {do: () => { view && view.actors.mei && view.actors.mei.once('Cheer'); view && view.burst({x: 0.2, y: 1.8, z: 1.8}, 0xffc83d, 50, 3); }}),
    M('跟我說的一模一樣，太棒了！')], tk);
  if (rpg.dead(tk)) return;
  pay('deliver', 40);
  await wait(900);
  await talk([
    M('……不過，玩了一分鐘，好像有點無聊耶。'), M('水果掉了也沒差，我又不會輸。'),
    M('你們能不能讓它更刺激一點？比如要有「生命」，漏接會扣，還要有炸彈，而且越接越快！'),
    B('哈哈，客人追加需求了！'), B('這在接案時很常見，客人玩過了才知道自己想要什麼。', {do: bossDo('Interact')}),
    B('這次追加的酬勞，我另外算給你。'),
    B(`${nm()}，三個模組挑兩個以上，去裝到你的遊戲上吧！`, {choices: ['接下追加訂單！']})], tk);
  if (rpg.dead(tk)) return;
  if (view && view.actors.mei) view.actors.mei.goto(6.5, 1.8, Math.PI / 2);
  done(5); go(6);
}

/* ================= 6 客人追加：強化模組 ================= */
const stepPower = tk => enterCode('power', tk);

/* ================= 7 Bug 怪事件 ================= */
async function stepBug(tk) {
  look = false; wantFocus = false;
  showBench(false); await stage(); if (rpg.dead(tk)) return;
  pay('power', 50);
  if (view) { view.shot('desk'); await wait(400); }
  await talk([
    B('強化版做得不錯！客人看了很滿意。', {do: bossDo('Cheer')}), B('不過先別急著叫客人來拿。'),
    B('遊戲交出去之前，一定要先抓 Bug。'), B('不然客人拿到會壞掉的遊戲，馬上就會來客訴。', {img: 'bug'}),
    N('就在老闆說話的時候，街機螢幕突然閃了一下，畫面全是亂碼。', {img: '', do: () => { sfx('bad'); view && view.cabinet('glitch', ''); view && view.flash(500); }}),
    B('說曹操，曹操就到……是 Bug 怪！'), B('他又溜進來搗亂了！快看，他在桌上亂跑，點一下把他抓起來！')], tk);
  if (rpg.dead(tk)) return;
  if (!view) { await caughtBug(tk); return; }
  view.bug(true); view.pickCb(async p => { if (p.kind === 'bug') { view.bugCaught(); view.pickCb(null); sfx('combo'); view.actors.boss && view.actors.boss.once('Cheer'); await caughtBug(tk); } });
}
async function caughtBug(tk) {
  await talk([B('抓到了！'), B('不過他在逃走前，把一個遊戲弄壞了。', {do: () => view && view.shot('desk')}), B('這是客人帶來的測試卡帶，症狀我寫在工作台上。'), B(`${nm()}，去找出問題，把它修好！`)], tk);
  if (rpg.dead(tk)) return; enterCode('debug', tk);
}

/* ================= 8 結單 ================= */
async function stepWrap(tk) {
  look = true; wantFocus = false;
  showBench(false); await stage(); if (rpg.dead(tk)) return;
  if (view) { await meiAt(6.5, 1.8, Math.PI / 2); const a = view.actors.mei; a.speed = 2.8; a.goto(0.2, 1.8, Math.PI); view.shot('customers'); view.cabinet('idle', ''); await wait(2400); }
  pay('debug', 40);
  await talk([
    B('Bug 修好了，客人來取貨，也順利驗收了。', {do: bossDo('Cheer')}),
    M(`${nm()}，謝謝你！我的水果攤要靠你的遊戲吸引客人囉！`, {do: () => { view && view.actors.mei && view.actors.mei.once('Cheer'); }}),
    B('訂單 #1，完成！'), B('先別急著開心，結單之前，要自己檢查一下。')], tk);
  if (rpg.dead(tk)) return;
  const CK = ['我能說出遊戲裡的三種東西：玩家、掉落物、規則', '客人說得很模糊的時候，我知道要先「問清楚」', '遊戲有問題的時候，我會先看症狀，再找原因', '我用的圖都是自己畫的，或有經過同意'];
  const list = h('ul', {class: 'selfck'});
  const nb = h('button', {class: 'btn'}, '送出，結單'); nb.disabled = !CK.every((_, i) => S.selfck[i]);
  CK.forEach((t, i) => { const li = h('li', {class: S.selfck[i] ? 'on' : '', onclick: () => { S.selfck[i] = !S.selfck[i]; li.classList.toggle('on', !!S.selfck[i]); save(); nb.disabled = !CK.every((_, j) => S.selfck[j]); sfx('blip'); }}, h('i', {}, S.selfck[i] ? '✓' : ''), t); li.addEventListener('click', () => { li.firstChild.textContent = S.selfck[i] ? '✓' : ''; }); list.append(li); });
  const dl = h('button', {class: 'btn sec', onclick: () => {
    const get = ed.myBlob ? Promise.resolve(ed.myBlob) : (ed.vm ? ed.vm.saveProjectSb3() : Promise.reject());
    get.then(blob => { const a = h('a', {href: URL.createObjectURL(blob), download: '我的接水果遊戲.sb3'}); document.body.append(a); a.click(); a.remove(); }).catch(() => toast('作品暫時不在這個頁面裡，回工作台再下載'));
  }}, '下載我的作品（.sb3）');
  nb.onclick = async () => {
    done(8); S.finished = true; save(); sfx('combo');
    await talk([B(`${nm()}，你做完第一張訂單了。`), B(`賺到 ${S.coins} 枚金幣，工作室的燈也亮了一點。`), B('下一張訂單，是那位獵人，他在門口等好久了。')], tk);
    sideShow(h('h2', {}, '訂單 #1 結單'), h('div', {class: 'rewards'}, h('span', {}, `🪙 金幣 ${S.coins}`), h('span', {}, '🔓 解鎖：強化模組'), h('span', {}, '🔓 解鎖：下一張訂單（獵人）')),
      h('p', {class: 'sub'}, '下一張訂單「獵人・切水果」準備中。'), h('div', {class: 'sidebtns'}, dl, h('a', {class: 'btn', href: '/week1.html', style: 'text-decoration:none'}, '回首頁')));
  };
  sideShow(h('h2', {}, '結單前自我檢查'), h('p', {class: 'sub'}, '誠實勾選。每一項都做到了，才能結單。'), list, h('div', {class: 'sidebtns'}, dl, nb));
}

/* ---------- 啟動 ---------- */
$('#mute').onclick = () => { setMuted(!isMuted()); $('#mute').textContent = isMuted() ? '🔇' : '🔊'; };
try {
  const {createWorld} = await import('/intro3d.js');
  view = await createWorld($('#gl'), {META, info, CART_IDS});
  view.layout('none');
} catch (err) { console.warn('3D 開不了，改純頁面', err); document.body.classList.add('flat'); view = null; }
window.__o1 = {ready: true, S, go, enterCode, caughtBug, get view() { return view; }, rpg};
renderSteps(); renderCoins();
go(Math.min(S.step || 0, 8));
