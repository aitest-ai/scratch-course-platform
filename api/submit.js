import {put, list} from '@vercel/blob';
import {auth, send, readBody, shareId, STAGES} from './_lib.js';
export const config = {api: {bodyParser: {sizeLimit: '4mb'}}};
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {error: 'POST only'});
  const me = auth(req); if (!me || me.role !== 's') return send(res, 401, {error: '請先登入'});
  let b; try { b = await readBody(req); } catch (e) { return send(res, 400, {error: 'bad body'}); }
  const stage = STAGES.includes(b.stage) ? b.stage : 'draft';
  const base = `works/${me.cls}/${me.sid}`, sid = shareId(me.cls, me.sid);
  const opt = {access: 'public', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60};
  // 讀舊紀錄：階段只會往前
  let old = null; try { const l = await list({prefix: `${base}.json`, limit: 1}); if (l.blobs[0]) old = await (await fetch(l.blobs[0].url + '?t=' + Date.now())).json(); } catch (e) { /* 第一次 */ }
  let sb3Url = old && old.sb3Url || '';
  if (b.sb3) {
    const buf = Buffer.from(b.sb3, 'base64'); if (buf.length > 3_500_000) return send(res, 413, {error: '作品太大'});
    const r1 = await put(`${base}.sb3`, buf, {...opt, contentType: 'application/octet-stream'}); sb3Url = r1.url;
  }
  const rank = s => STAGES.indexOf(s);
  const meta = {cls: me.cls, name: me.name, sid: me.sid, share: sid, stage: old && rank(old.stage) > rank(stage) ? old.stage : stage, mods: b.mods || (old && old.mods) || [], updated: Date.now(), first: (old && old.first) || Date.now(), sb3Url, saves: ((old && old.saves) || 0) + (b.sb3 ? 1 : 0)};
  const r2 = await put(`${base}.json`, JSON.stringify(meta), {...opt, contentType: 'application/json'});
  await put(`share/${sid}.json`, JSON.stringify({name: me.name, cls: me.cls, stage: meta.stage, sb3Url, updated: meta.updated}), {...opt, contentType: 'application/json'});
  send(res, 200, {ok: true, share: sid, sb3Url, stage: meta.stage, metaUrl: r2.url});
}
