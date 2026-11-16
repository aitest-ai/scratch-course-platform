#!/usr/bin/env python3
"""產生第 1 關（接東西）用的 Scratch 專案檔。
輸出到 public/projects/：
  l1_start.sb3      空白起始（有舞台、籃子、水果，沒有任何積木）
  l1_debug_a.sb3    壞掉版本 A：分身用完沒有刪除
  l1_debug_b.sb3    壞掉版本 B：計分變數是「只適用於這個角色」
  l1_debug_c.sb3    壞掉版本 C：籃子按左右鍵會上下移動
  l1_solution.sb3   標準答案（只用來測試檢查器，不會給學生）
"""
import hashlib, json, os, sys, zipfile

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'projects')
os.makedirs(OUT, exist_ok=True)

BASKET_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="60" viewBox="0 0 90 60">'
              '<path d="M6 8 H84 L74 52 Q73 56 68 56 H22 Q17 56 16 52 Z" fill="#c98a4b" stroke="#6b4423" stroke-width="3"/>'
              '<path d="M24 10 L28 54 M45 10 V56 M66 10 L62 54" stroke="#6b4423" stroke-width="2.5" fill="none"/>'
              '<rect x="3" y="4" width="84" height="9" rx="4" fill="#e0a566" stroke="#6b4423" stroke-width="3"/></svg>')
APPLE_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="54" viewBox="0 0 80 90">'
             '<path d="M40 14 C 12 10, 4 40, 10 60 C 16 82, 34 86, 40 80 C 46 86, 64 82, 70 60 C 76 40, 68 10, 40 14 Z" fill="#e8483a" stroke="#7a1f16" stroke-width="3"/>'
             '<path d="M40 14 C 40 6, 44 2, 50 2" fill="none" stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"/>'
             '<path d="M44 10 C 54 0, 66 4, 66 4 C 64 14, 52 16, 44 10 Z" fill="#3ea34a" stroke="#1f6a2b" stroke-width="2"/></svg>')
BACK_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">'
            '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe4ff"/><stop offset="1" stop-color="#f1faff"/></linearGradient></defs>'
            '<rect width="480" height="360" fill="url(#g)"/><rect y="320" width="480" height="40" fill="#7cc27c"/></svg>')


def asset(svg):
    data = svg.encode('utf-8')
    md5 = hashlib.md5(data).hexdigest()
    return md5, data


class Project:
    def __init__(self):
        self.n = 0
        self.var_id = 'var_score'
        self.assets = {}

    def costume(self, name, svg, cx, cy):
        md5, data = asset(svg)
        self.assets[md5 + '.svg'] = data
        return {'assetId': md5, 'name': name, 'md5ext': md5 + '.svg', 'dataFormat': 'svg',
                'rotationCenterX': cx, 'rotationCenterY': cy, 'bitmapResolution': 1}


class Blocks:
    """很小的積木產生器：用 mk() 建積木，用 chain() 接成一串。"""
    def __init__(self, prefix):
        self.d = {}
        self.n = 0
        self.p = prefix

    def _id(self):
        self.n += 1
        return '%s%d' % (self.p, self.n)

    def mk(self, op, inputs=None, fields=None, shadow=False):
        bid = self._id()
        self.d[bid] = {'opcode': op, 'next': None, 'parent': None, 'inputs': inputs or {}, 'fields': fields or {},
                       'shadow': shadow, 'topLevel': False}
        for v in (inputs or {}).values():
            for item in v[1:]:
                if isinstance(item, str) and item in self.d:
                    self.d[item]['parent'] = bid
        return bid

    def chain(self, ids, x=0, y=0):
        for a, b in zip(ids, ids[1:]):
            self.d[a]['next'] = b
            self.d[b]['parent'] = a
        self.d[ids[0]]['topLevel'] = True
        self.d[ids[0]]['x'] = x
        self.d[ids[0]]['y'] = y
        return ids[0]

    def sub(self, ids):
        """把一串積木接成 C 型積木的內層，回傳要放進 SUBSTACK 的 input。"""
        for a, b in zip(ids, ids[1:]):
            self.d[a]['next'] = b
            self.d[b]['parent'] = a
        return [2, ids[0]]

    def fix_substack_parent(self, owner, inp):
        self.d[inp[1]]['parent'] = owner


def num(v):
    return [1, [4, str(v)]]


def op_in(bid):
    return [3, bid, [4, '0']]


def build(variant):
    """variant: None=標準答案, 'a','b','c'=壞掉版本, 'start'=空白"""
    P = Project()
    basket_c = P.costume('籃子', BASKET_SVG, 45, 30)
    apple_c = P.costume('蘋果', APPLE_SVG, 24, 27)
    back_c = P.costume('背景', BACK_SVG, 240, 180)

    var_global = variant != 'b'
    sprite_vars_fruit = {} if var_global else {P.var_id: ['分數', 0]}
    stage_vars = {P.var_id: ['分數', 0]} if (var_global and variant != 'start') else {}

    # ---------- 籃子 ----------
    bb = Blocks('k')
    if variant != 'start':
        hat = bb.mk('event_whenflagclicked')
        goto = bb.mk('motion_gotoxy', {'X': num(0), 'Y': num(-140)})
        key_l_menu = bb.mk('sensing_keyoptions', fields={'KEY_OPTION': ['left arrow', None]}, shadow=True)
        key_l = bb.mk('sensing_keypressed', {'KEY_OPTION': [1, key_l_menu]})
        key_r_menu = bb.mk('sensing_keyoptions', fields={'KEY_OPTION': ['right arrow', None]}, shadow=True)
        key_r = bb.mk('sensing_keypressed', {'KEY_OPTION': [1, key_r_menu]})
        move_l = bb.mk('motion_changeyby' if variant == 'c' else 'motion_changexby',
                       {('DY' if variant == 'c' else 'DX'): num(-10)})
        move_r = bb.mk('motion_changeyby' if variant == 'c' else 'motion_changexby',
                       {('DY' if variant == 'c' else 'DX'): num(10)})
        if_l = bb.mk('control_if', {'CONDITION': [2, key_l], 'SUBSTACK': bb.sub([move_l])})
        if_r = bb.mk('control_if', {'CONDITION': [2, key_r], 'SUBSTACK': bb.sub([move_r])})
        for i, (c, s) in enumerate(((key_l, move_l), (key_r, move_r))):
            pass
        bb.d[move_l]['parent'] = if_l
        bb.d[move_r]['parent'] = if_r
        bb.d[key_l]['parent'] = if_l
        bb.d[key_r]['parent'] = if_r
        forever = bb.mk('control_forever', {'SUBSTACK': bb.sub([if_l, if_r])})
        bb.d[if_l]['parent'] = forever
        bb.chain([hat, goto, forever], 40, 40)

    # ---------- 水果 ----------
    fb = Blocks('f')
    if variant != 'start':
        # 綠旗：隱藏、分數歸零、每隔一下建立分身
        hat = fb.mk('event_whenflagclicked')
        hide = fb.mk('looks_hide')
        setv = fb.mk('data_setvariableto', {'VALUE': [1, [10, '0']]}, {'VARIABLE': ['分數', P.var_id]})
        menu = fb.mk('control_create_clone_of_menu', fields={'CLONE_OPTION': ['_myself_', None]}, shadow=True)
        cc = fb.mk('control_create_clone_of', {'CLONE_OPTION': [1, menu]})
        wait = fb.mk('control_wait', {'DURATION': [1, [5, '0.6']]})
        fe = fb.mk('control_forever', {'SUBSTACK': fb.sub([cc, wait])})
        fb.d[cc]['parent'] = fe
        fb.chain([hat, hide, setv, fe], 40, 40)

        # 分身出生：隨機位置掉下來
        hat2 = fb.mk('control_start_as_clone')
        rnd = fb.mk('operator_random', {'FROM': num(-200), 'TO': num(200)})
        goto = fb.mk('motion_gotoxy', {'X': op_in(rnd), 'Y': num(170)})
        show = fb.mk('looks_show')
        ypos = fb.mk('motion_yposition')
        lt = fb.mk('operator_lt', {'OPERAND1': op_in(ypos), 'OPERAND2': num(-150)})
        dy = fb.mk('motion_changeyby', {'DY': num(-6)})
        tmenu = fb.mk('sensing_touchingobjectmenu', fields={'TOUCHINGOBJECTMENU': ['籃子', None]}, shadow=True)
        touch = fb.mk('sensing_touchingobject', {'TOUCHINGOBJECTMENU': [1, tmenu]})
        add = fb.mk('data_changevariableby', {'VALUE': num(1)}, {'VARIABLE': ['分數', P.var_id]})
        inner = [add]
        if variant != 'a':
            inner.append(fb.mk('control_delete_this_clone'))
        if_touch = fb.mk('control_if', {'CONDITION': [2, touch], 'SUBSTACK': fb.sub(inner)})
        fb.d[add]['parent'] = if_touch
        if variant != 'a':
            fb.d[inner[1]]['parent'] = if_touch
        fb.d[touch]['parent'] = if_touch
        ru = fb.mk('control_repeat_until', {'CONDITION': [2, lt], 'SUBSTACK': fb.sub([dy, if_touch])})
        fb.d[if_touch]['parent'] = ru
        fb.d[dy]['parent'] = ru
        fb.d[lt]['parent'] = ru
        seq = [hat2, goto, show, ru]
        if variant != 'a':
            seq.append(fb.mk('control_delete_this_clone'))
        fb.chain(seq, 40, 320)
        fb.d[rnd]['parent'] = goto

    stage = {'isStage': True, 'name': 'Stage', 'variables': stage_vars, 'lists': {}, 'broadcasts': {}, 'blocks': {},
             'comments': {}, 'currentCostume': 0, 'costumes': [back_c], 'sounds': [], 'volume': 100, 'layerOrder': 0,
             'tempo': 60, 'videoTransparency': 50, 'videoState': 'on', 'textToSpeechLanguage': None}
    basket = {'isStage': False, 'name': '籃子', 'variables': {}, 'lists': {}, 'broadcasts': {}, 'blocks': bb.d,
              'comments': {}, 'currentCostume': 0, 'costumes': [basket_c], 'sounds': [], 'volume': 100,
              'layerOrder': 2, 'visible': True, 'x': 0, 'y': -140, 'size': 100, 'direction': 90,
              'draggable': False, 'rotationStyle': 'all around'}
    fruit = {'isStage': False, 'name': '水果', 'variables': sprite_vars_fruit, 'lists': {}, 'broadcasts': {},
             'blocks': fb.d, 'comments': {}, 'currentCostume': 0, 'costumes': [apple_c], 'sounds': [], 'volume': 100,
             'layerOrder': 1, 'visible': True, 'x': 0, 'y': 120, 'size': 100, 'direction': 90,
             'draggable': False, 'rotationStyle': 'all around'}
    monitor = {'id': P.var_id, 'mode': 'default', 'opcode': 'data_variable',
               'params': {'VARIABLE': '分數'}, 'spriteName': None if var_global else '水果', 'value': 0,
               'width': 0, 'height': 0, 'x': 5, 'y': 5, 'visible': True}
    project = {'targets': [stage, basket, fruit], 'monitors': [monitor] if variant != 'start' else [],
               'extensions': [], 'meta': {'semver': '3.0.0', 'vm': '0.2.0', 'agent': 'ninja-dojo'}}
    return project, P.assets


def write(name, variant):
    project, assets = build(variant)
    path = os.path.join(OUT, name)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json', json.dumps(project, ensure_ascii=False))
        for k, v in assets.items():
            z.writestr(k, v)
    print('wrote', path, os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    write('l1_start.sb3', 'start')
    write('l1_debug_a.sb3', 'a')
    write('l1_debug_b.sb3', 'b')
    write('l1_debug_c.sb3', 'c')
    write('l1_solution.sb3', None)
