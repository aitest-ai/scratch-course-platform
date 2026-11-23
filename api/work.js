import {list} from '@vercel/blob';
import {send} from './_lib.js';
// 公開分享：用分享碼取得作品檔位置
export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').replace(/[^0-9a-f]/g, '');
  if (id.length < 10) return send(res, 400, {error: '分享碼不對'});
  const l = await list({prefix: `share/${id}.json`, limit: 1});
  const b = l.blobs[0]; if (!b) return send(res, 404, {error: '找不到這份作品'});
  try { send(res, 200, await (await fetch(b.url + '?t=' + Date.now())).json()); } catch (e) { send(res, 500, {error: '讀取失敗'}); }
}
