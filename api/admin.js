import {list} from '@vercel/blob';
import {auth, send, roster} from './_lib.js';
export default async function handler(req, res) {
  const me = auth(req); if (!me || me.role !== 'admin') return send(res, 401, {error: '需要老師登入'});
  const r = roster(), metas = {};
  let cursor; const items = [];
  do { const l = await list({prefix: 'works/', cursor, limit: 1000}); items.push(...l.blobs); cursor = l.cursor; } while (cursor);
  await Promise.all(items.filter(b => b.pathname.endsWith('.json')).map(async b => { try { const m = await (await fetch(b.url + '?t=' + Date.now())).json(); metas[m.cls + ':' + m.sid] = m; } catch (e) { /* 略過 */ } }));
  const out = Object.keys(r).map(c => ({name: c, students: r[c].map((s, i) => { const m = metas[c + ':' + s[1]]; return {i, name: s[0], seat: i + 1, m: m ? {stage: m.stage, updated: m.updated, first: m.first, share: m.share, sb3Url: m.sb3Url, mods: m.mods, saves: m.saves} : null}; })}));
  send(res, 200, {classes: out, now: Date.now()});
}
