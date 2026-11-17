import {showPic, hidePic} from '/pics.js';
// RPG 一句一框對話引擎（訂單頁使用；開幕導覽 intro.js 有自己的同款）
// 需要頁面上有 #dlg #dlgname #dlgtext #dlgchoices #dlgnext，以及選用的 #card（說話時淡出）
const $ = s => document.querySelector(s);
const el = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};

export function createRpg({sfx = () => {}, toast = () => {}, getName = () => '新人', onSpeak = () => {}, onEnd = () => {}, onTyped = () => {}} = {}) {
  let token = 0, skipFn = null;
  const dead = tk => tk !== token;
  const hide = () => { hidePic(); const d = $('#dlg'); d.hidden = true; const c = $('#card'); c && c.classList.remove('mute'); skipFn = null; };

  // l = {w: 'boss' | '' (旁白) | '@me' | 其他名字, t: 台詞, choices?: [..], input?: true, do?: fn}
  function showLine(l, tk) {
    return new Promise(res => {
      const d = $('#dlg'); d.hidden = false; d.classList.remove('out'); const c = $('#card'); c && c.classList.add('mute');
      const who = l.w === undefined ? 'boss' : l.w;
      try { onSpeak(who, l); } catch (e) { /* 鏡頭失敗不影響對話 */ }
      const np = $('#dlgname');
      np.textContent = who === 'boss' ? '老闆' : who === '@me' ? getName() : (who || '');
      np.hidden = !who; np.className = 'nameplate ' + (who === 'boss' ? 'boss' : who === '@me' ? 'me' : 'npc');
      d.classList.toggle('narr', !who);
      const tx = $('#dlgtext'), ch = $('#dlgchoices'), nx = $('#dlgnext');
      tx.textContent = ''; ch.replaceChildren(); nx.hidden = true;
      if (l.img !== undefined) showPic(l.img);
      if (l.do) l.do();
      const full = l.t; let i = 0, typing = true, timer = null;
      const finish = () => {
        typing = false; clearInterval(timer); tx.textContent = full; try { onTyped(who); } catch (e) { /* 略 */ }
        if (l.choices) {
          l.choices.forEach((t, ci) => ch.append(el('button', {class: 'dchoice', onclick: () => { skipFn = null; sfx('right'); res(ci); }}, t)));
          skipFn = null;
        } else if (l.input) {
          const inp = el('input', {id: 'nm', maxlength: '8', placeholder: l.input, autocomplete: 'off'});
          const ok = () => { const v = inp.value.trim(); if (!v) { toast('先寫點東西吧'); return; } skipFn = null; sfx('right'); res(v); };
          inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ok(); };
          ch.append(inp, el('button', {class: 'dchoice', onclick: ok}, '好'));
          setTimeout(() => inp.focus(), 50); skipFn = null;
        } else { nx.hidden = false; skipFn = () => { skipFn = null; res(); }; }
      };
      timer = setInterval(() => {
        if (dead(tk)) { clearInterval(timer); res('x'); return; }
        i++; tx.textContent = full.slice(0, i); if (i % 2 === 0) sfx('blip'); if (i >= full.length) finish();
      }, 34);
      skipFn = () => { if (typing) finish(); };
      d.onclick = e => { if (e.target.closest('.dchoice,input')) return; advance(); };
    });
  }
  function advance() { if (skipFn) skipFn(); }
  addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { if (!$('#dlg').hidden) { e.preventDefault(); advance(); } }
  });

  // 依序演出；回傳最後一個有選擇／輸入的結果；被 bump() 打斷則回傳 'x'
  async function talk(lines, tk = token) {
    let out;
    for (const l of lines) {
      if (dead(tk)) return 'x';
      out = await showLine(typeof l === 'string' ? {t: l} : l, tk);
      if (out === 'x') return 'x';
    }
    if (!dead(tk)) { hide(); try { onTyped(''); onEnd(); } catch (e) { /* 略 */ } }
    return out;
  }
  const B = (t, o) => Object.assign({w: 'boss', t}, o || {});     // 老闆
  const N = (t, o) => Object.assign({w: '', t}, o || {});         // 旁白
  const ME = (t, o) => Object.assign({w: '@me', t}, o || {});     // 玩家（第一人稱，用自己的名字）
  return {talk, hide, B, N, ME, bump: () => { token++; hide(); return token; }, tok: () => token, dead};
}
