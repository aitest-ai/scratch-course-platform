// 客人「想像中的遊戲」手繪草圖（故意畫得模糊、抽象，像真的客人隨手畫的）
const W = (body, tilt = -1.5) => `<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" class="sk" style="transform:rotate(${tilt}deg)">
<defs><filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.6"/></filter>
<pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#c9d6e8" stroke-width=".6"/></pattern></defs>
<rect width="320" height="240" fill="#fffdf2"/><rect width="320" height="240" fill="url(#grid)"/>
<g filter="url(#rough)" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-width="4">${body}</g>
<rect x="118" y="-6" width="84" height="22" fill="#ffe27a" opacity=".85" transform="rotate(-3 160 5)"/></svg>`;
export const SKETCH = {
  // 接水果：天上掉下蘋果，下面一個籃子
  catch: W(`
<path d="M30 40 q10 -14 22 -4 q12 -12 24 0 q14 -4 16 10 q-8 8 -26 6 q-22 6 -36 -12z" stroke="#9ec9ff"/>
<g stroke="#e8483a"><circle cx="70" cy="95" r="15"/><circle cx="150" cy="70" r="15"/><circle cx="225" cy="110" r="15"/><circle cx="260" cy="60" r="13"/></g>
<g stroke="#4caa3a" stroke-width="3"><path d="M70 80 q6 -10 12 -8"/><path d="M150 55 q6 -10 12 -8"/><path d="M225 95 q6 -10 12 -8"/></g>
<g stroke="#bbb" stroke-width="2.4"><path d="M70 122 v14"/><path d="M150 97 v12 M143 108 h14"/><path d="M225 137 v14"/></g>
<path d="M105 188 q55 40 110 0 z" stroke="#b9722f" fill="#ffe0b0" fill-opacity=".6"/><path d="M118 192 l14 28 M160 196 v26 M202 192 l-14 28" stroke="#b9722f" stroke-width="2.6"/>
<path d="M140 150 l5 -12 l5 12 l-11 -8 h12 z" stroke="#f5b400" stroke-width="2.6"/><path d="M255 170 q14 10 30 0" stroke="#ff7a8a" stroke-width="3"/><path d="M48 160 q0 -10 10 -10 q10 0 10 10" stroke="#ff7a8a" stroke-width="3"/>`, -2),
  // 切水果：西瓜被斜斜一刀切開
  slice: W(`
<path d="M70 70 a58 58 0 1 0 118 0 a58 58 0 1 0 -118 0" stroke="#3aa05a"/><path d="M82 72 a46 46 0 1 0 94 0" stroke="#e8483a" stroke-width="3" opacity=".8"/>
<g stroke="#222" stroke-width="3"><path d="M110 72 l3 7"/><path d="M135 66 l3 7"/><path d="M155 78 l3 7"/></g>
<path d="M40 190 L250 40" stroke="#ff4fa3" stroke-width="6" stroke-dasharray="2 12"/><path d="M236 36 l18 2 l-8 16" stroke="#ff4fa3" stroke-width="4"/>
<path d="M210 150 a40 40 0 0 1 70 30 q-30 14 -70 -30z" stroke="#e8483a" fill="#ff9a8a" fill-opacity=".5"/><path d="M52 150 a40 40 0 0 0 -4 70 q40 0 60 -50z" stroke="#3aa05a"/>
<g stroke="#f5b400" stroke-width="3"><path d="M150 140 v14 M143 147 h14"/><path d="M270 100 v12 M264 106 h12"/><path d="M30 110 v12 M24 116 h12"/></g>
<path d="M175 205 l20 -26 l8 28" stroke="#6a7cff" stroke-width="3"/>`, 1.5),
  // 躲隕石：小太空船在下面，石頭從上面掉
  dodge: W(`
<rect width="320" height="240" fill="#2a2a5c" stroke="none"/>
<g stroke="#fff" stroke-width="3"><path d="M30 30 v6 M27 33 h6"/><path d="M280 40 v6 M277 43 h6"/><path d="M200 18 v6 M197 21 h6"/><path d="M60 120 v6 M57 123 h6"/><path d="M300 150 v6 M297 153 h6"/></g>
<g stroke="#c9b08a"><path d="M60 50 q14 -22 36 -8 q16 18 -2 34 q-26 8 -34 -26z"/><path d="M170 30 q12 -16 30 -6 q10 14 -4 26 q-20 4 -26 -20z"/><path d="M245 95 q16 -22 40 -6 q10 20 -10 32 q-26 4 -30 -26z"/></g>
<g stroke="#ff9a3a" stroke-width="3" opacity=".8"><path d="M80 10 v-8 M70 14 l-4 -8"/><path d="M185 6 v-6"/><path d="M265 60 v-10 M274 62 l4 -8"/></g>
<path d="M155 150 l-14 40 h28 z" stroke="#7fe0ff"/><circle cx="155" cy="172" r="5" stroke="#7fe0ff" stroke-width="3"/><path d="M147 192 l-5 14 M163 192 l5 14" stroke="#ff9a3a" stroke-width="4"/>
<path d="M120 120 q10 -10 22 -4" stroke="#ff7a8a" stroke-width="3"/><path d="M175 120 q10 -10 22 -4" stroke="#ff7a8a" stroke-width="3"/><text x="110" y="226" fill="#ffe27a" stroke="none" font-size="22" font-family="cursive">GO!!</text>`, -1),
  // 打怪（橫向）：弓箭手在左邊射箭，史萊姆從右邊走過來
  fight: W(`
<path d="M0 190 h320" stroke="#3d7a3a" stroke-width="4"/><path d="M20 190 l22 -60 l22 60 M250 190 l18 -50 l18 50" stroke="#2f7a52"/>
<circle cx="62" cy="108" r="13" stroke="#e8883a"/><path d="M50 98 l12 -16 l12 16" stroke="#2f7fb8"/><path d="M62 121 v30 M62 150 l-10 24 M62 150 l12 24 M62 132 l22 -6" stroke="#e8883a"/>
<path d="M96 100 q22 26 0 52" stroke="#8a5a2a" stroke-width="4"/><path d="M96 100 l-4 26 l4 26" stroke="#555" stroke-width="2"/>
<g stroke="#f5b400" stroke-width="4"><path d="M120 126 h28 M150 126 l-7 -5 M150 126 l-7 5"/><path d="M164 126 h20"/></g>
<path d="M214 190 q-4 -50 36 -54 q40 4 36 54 z" stroke="#2f9a3a" fill="#8fe06a" fill-opacity=".5"/>
<circle cx="236" cy="168" r="6" stroke="#222" stroke-width="3"/><circle cx="262" cy="168" r="6" stroke="#222" stroke-width="3"/><path d="M240 182 q8 6 16 0" stroke="#222" stroke-width="3"/>
<path d="M285 40 l4 8 l9 1 l-7 6 l2 9 l-8 -4 l-8 4 l2 -9 l-7 -6 l9 -1z" stroke="#f5b400" stroke-width="2.6"/>`, 1)
};
