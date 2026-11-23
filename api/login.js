import {roster, sign, send, readBody} from './_lib.js';
const DAY = 24 * 3600 * 1000;
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {error: 'POST only'});
  let b; try { b = await readBody(req); } catch (e) { return send(res, 400, {error: 'bad body'}); }
  if (b.admin) {
    if (b.user === (process.env.ADMIN_USER || 'admin') && b.pw && b.pw === process.env.ADMIN_PASSWORD) return send(res, 200, {token: sign({role: 'admin', exp: Date.now() + 12 * 3600 * 1000})});
    return send(res, 401, {error: '帳號或密碼不對'});
  }
  const r = roster(), list = r[b.cls]; const s = list && list[b.i | 0];
  if (!s) return send(res, 400, {error: '請先選班級和姓名'});
  const pw = String(b.pw || '').trim().toLowerCase(), sid = s[1];
  if (pw !== sid && pw !== 'thes' + sid) return send(res, 401, {error: '密碼不對，再試一次（thes＋學號）'});
  send(res, 200, {token: sign({role: 's', cls: b.cls, i: b.i | 0, name: s[0], sid, exp: Date.now() + 7 * DAY}), name: s[0], cls: b.cls});
}
