import crypto from 'node:crypto';

const SECRET = () => process.env.SESSION_SECRET || 'dev-secret';
export const STAGES = ['draft', 'build', 'power', 'debug', 'wrap'];
const CLASS_ORDER = ['五年一班', '五年二班', '五年三班', '五年四班'];

let _roster = null;
// 名單：{班級: [[姓名, 學號], ...]}，只存在伺服器環境變數裡
export function roster() {
  if (_roster) return _roster;
  let raw = {}; try { raw = JSON.parse(process.env.ROSTER_JSON || '{}'); } catch (e) { raw = {}; }
  const out = {}; Object.keys(raw).sort((a, b) => (CLASS_ORDER.indexOf(a) + 99) % 99 - (CLASS_ORDER.indexOf(b) + 99) % 99).forEach(k => { out[k] = raw[k]; });
  return (_roster = out);
}

const b64 = s => Buffer.from(s).toString('base64url');
export function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
  return body + '.' + sig;
}
export function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const want = crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); if (p.exp && p.exp < Date.now()) return null; return p; } catch (e) { return null; }
}
export function auth(req) {
  const h = req.headers['authorization'] || ''; return verify(h.replace(/^Bearer\s+/i, ''));
}
export const shareId = (cls, sid) => crypto.createHmac('sha256', SECRET()).update('share:' + cls + ':' + sid).digest('hex').slice(0, 14);
export function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
export async function readBody(req, limit = 4_000_000) {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw new Error('too large'); chunks.push(c); }
  const s = Buffer.concat(chunks).toString('utf8'); return s ? JSON.parse(s) : {};
}
