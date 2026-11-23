import {roster, send} from './_lib.js';
// 只回傳班級與姓名（不含學號），給登入下拉選單用
export default function handler(req, res) {
  const r = roster();
  send(res, 200, {classes: Object.keys(r).map(c => ({name: c, students: r[c].map((s, i) => ({i, name: s[0]}))}))});
}
