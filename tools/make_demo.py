#!/usr/bin/env python3
"""產生「接水果大師」厲害範例 public/projects/demo_catch.sb3
功能：左右鍵移動、水果掉落、炸彈、生命 3 條、越接越快、遊戲結束。"""
import json, os, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sb3 import Project, Blocks, num, op_in, BASKET_SVG, APPLE_SVG, BACK_SVG, OUT

BOMB_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" width="52" height="60" viewBox="0 0 52 60">'
            '<circle cx="26" cy="36" r="20" fill="#2b2b33" stroke="#000" stroke-width="3"/>'
            '<rect x="20" y="10" width="12" height="9" rx="2" fill="#555" stroke="#000" stroke-width="2"/>'
            '<path d="M26 10 C26 4 32 4 36 2" fill="none" stroke="#a66b2c" stroke-width="3"/>'
            '<circle cx="38" cy="3" r="4" fill="#ffb300"/><circle cx="18" cy="30" r="5" fill="#fff" opacity=".35"/></svg>')
OVER_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="90" viewBox="0 0 260 90">'
            '<rect x="3" y="3" width="254" height="84" rx="16" fill="#1c2430" stroke="#e8483a" stroke-width="5"/>'
            '<text x="130" y="58" font-size="40" font-weight="bold" text-anchor="middle" fill="#fff" '
            'font-family="sans-serif">遊戲結束</text></svg>')

VS, VL, VV = 'v_score', 'v_life', 'v_speed'
BC = 'b_over'


def var(name, vid):
    return [3, [12, name, vid], [4, '0']]


def build():
    P = Project()
    cb = P.costume('籃子', BASKET_SVG, 45, 30)
    ca = P.costume('蘋果', APPLE_SVG, 24, 27)
    cm = P.costume('炸彈', BOMB_SVG, 26, 30)
    co = P.costume('結束', OVER_SVG, 130, 45)
    cg = P.costume('背景', BACK_SVG, 240, 180)

    def setv(b, name, vid, val):
        return b.mk('data_setvariableto', {'VALUE': [1, [10, str(val)]]}, {'VARIABLE': [name, vid]})

    def chg(b, name, vid, val):
        return b.mk('data_changevariableby', {'VALUE': num(val)}, {'VARIABLE': [name, vid]})

    def touching(b, who):
        m = b.mk('sensing_touchingobjectmenu', fields={'TOUCHINGOBJECTMENU': [who, None]}, shadow=True)
        t = b.mk('sensing_touchingobject', {'TOUCHINGOBJECTMENU': [1, m]})
        return t

    def cif(b, cond, inner):
        i = b.mk('control_if', {'CONDITION': [2, cond], 'SUBSTACK': b.sub(inner)})
        b.d[cond]['parent'] = i
        for x in inner:
            b.d[x]['parent'] = i
        return i

    def cloop(b, op, inputs, inner):
        l = b.mk(op, inputs, None)
        b.d[l]['inputs']['SUBSTACK'] = b.sub(inner)
        for x in inner:
            b.d[x]['parent'] = l
        return l

    def broadcast_over(b):
        m = b.mk('event_broadcast_menu', fields={'BROADCAST_OPTION': ['遊戲結束', BC]}, shadow=True)
        return b.mk('event_broadcast', {'BROADCAST_INPUT': [1, m]})

    def fall_dy(b):
        sp = b.mk('data_variable', fields={'VARIABLE': ['速度', VV]})
        sub = b.mk('operator_subtract', {'NUM1': num(0), 'NUM2': op_in(sp)})
        b.d[sp]['parent'] = sub
        return b.mk('motion_changeyby', {'DY': op_in(sub)})

    def life_lt1(b):
        lv = b.mk('data_variable', fields={'VARIABLE': ['生命', VL]})
        lt = b.mk('operator_lt', {'OPERAND1': op_in(lv), 'OPERAND2': num(1)})
        b.d[lv]['parent'] = lt
        return lt

    # 籃子
    bb = Blocks('k')
    hat = bb.mk('event_whenflagclicked')
    goto = bb.mk('motion_gotoxy', {'X': num(0), 'Y': num(-140)})
    ifs = []
    for key, dx in (('left arrow', -10), ('right arrow', 10)):
        km = bb.mk('sensing_keyoptions', fields={'KEY_OPTION': [key, None]}, shadow=True)
        kp = bb.mk('sensing_keypressed', {'KEY_OPTION': [1, km]})
        mv = bb.mk('motion_changexby', {'DX': num(dx)})
        ifs.append(cif(bb, kp, [mv]))
    fe = bb.mk('control_forever', {'SUBSTACK': bb.sub(ifs)})
    for i in ifs:
        bb.d[i]['parent'] = fe
    bb.chain([hat, goto, fe], 40, 40)

    # 水果
    fb = Blocks('f')
    hat = fb.mk('event_whenflagclicked')
    hide = fb.mk('looks_hide')
    s1, s2, s3 = setv(fb, '分數', VS, 0), setv(fb, '生命', VL, 3), setv(fb, '速度', VV, 5)
    cm_ = fb.mk('control_create_clone_of_menu', fields={'CLONE_OPTION': ['_myself_', None]}, shadow=True)
    cc = fb.mk('control_create_clone_of', {'CLONE_OPTION': [1, cm_]})
    wait = fb.mk('control_wait', {'DURATION': [1, [5, '0.7']]})
    fe = fb.mk('control_forever', {'SUBSTACK': fb.sub([cc, wait])})
    fb.d[cc]['parent'] = fe
    fb.chain([hat, hide, s1, s2, s3, fe], 40, 40)

    hat2 = fb.mk('control_start_as_clone')
    rnd = fb.mk('operator_random', {'FROM': num(-200), 'TO': num(200)})
    gt = fb.mk('motion_gotoxy', {'X': op_in(rnd), 'Y': num(170)})
    fb.d[rnd]['parent'] = gt
    show = fb.mk('looks_show')
    ypos = fb.mk('motion_yposition')
    lt = fb.mk('operator_lt', {'OPERAND1': op_in(ypos), 'OPERAND2': num(-150)})
    fb.d[ypos]['parent'] = lt
    dy = fall_dy(fb)
    add = chg(fb, '分數', VS, 1)
    sc = fb.mk('data_variable', fields={'VARIABLE': ['分數', VS]})
    md = fb.mk('operator_mod', {'NUM1': op_in(sc), 'NUM2': num(5)})
    fb.d[sc]['parent'] = md
    eq = fb.mk('operator_equals', {'OPERAND1': op_in(md), 'OPERAND2': [1, [10, '0']]})
    fb.d[md]['parent'] = eq
    faster = chg(fb, '速度', VV, 1)
    if_fast = cif(fb, eq, [faster])
    dele1 = fb.mk('control_delete_this_clone')
    if_touch = cif(fb, touching(fb, '籃子'), [add, if_fast, dele1])
    ru = cloop(fb, 'control_repeat_until', {'CONDITION': [2, lt]}, [dy, if_touch])
    fb.d[lt]['parent'] = ru
    lose = chg(fb, '生命', VL, -1)
    if_over = cif(fb, life_lt1(fb), [broadcast_over(fb)])
    dele2 = fb.mk('control_delete_this_clone')
    fb.chain([hat2, gt, show, ru, lose, if_over, dele2], 40, 380)

    # 炸彈
    mb = Blocks('m')
    hat = mb.mk('event_whenflagclicked')
    hide = mb.mk('looks_hide')
    w0 = mb.mk('control_wait', {'DURATION': [1, [5, '2.5']]})
    cm2 = mb.mk('control_create_clone_of_menu', fields={'CLONE_OPTION': ['_myself_', None]}, shadow=True)
    cc = mb.mk('control_create_clone_of', {'CLONE_OPTION': [1, cm2]})
    fe = mb.mk('control_forever', {'SUBSTACK': mb.sub([w0, cc])})
    mb.d[w0]['parent'] = fe
    mb.d[cc]['parent'] = fe
    mb.chain([hat, hide, fe], 40, 40)
    hat2 = mb.mk('control_start_as_clone')
    rnd = mb.mk('operator_random', {'FROM': num(-200), 'TO': num(200)})
    gt = mb.mk('motion_gotoxy', {'X': op_in(rnd), 'Y': num(170)})
    mb.d[rnd]['parent'] = gt
    show = mb.mk('looks_show')
    ypos = mb.mk('motion_yposition')
    lt = mb.mk('operator_lt', {'OPERAND1': op_in(ypos), 'OPERAND2': num(-150)})
    mb.d[ypos]['parent'] = lt
    dy = fall_dy(mb)
    lose = chg(mb, '生命', VL, -1)
    if_over = cif(mb, life_lt1(mb), [broadcast_over(mb)])
    dele1 = mb.mk('control_delete_this_clone')
    if_touch = cif(mb, touching(mb, '籃子'), [lose, if_over, dele1])
    ru = cloop(mb, 'control_repeat_until', {'CONDITION': [2, lt]}, [dy, if_touch])
    mb.d[lt]['parent'] = ru
    dele2 = mb.mk('control_delete_this_clone')
    mb.chain([hat2, gt, show, ru, dele2], 40, 380)

    # 結束橫幅
    ob = Blocks('o')
    h1 = ob.mk('event_whenflagclicked')
    hd = ob.mk('looks_hide')
    ob.chain([h1, hd], 40, 40)
    h2 = ob.mk('event_whenbroadcastreceived', fields={'BROADCAST_OPTION': ['遊戲結束', BC]})
    sh = ob.mk('looks_show')
    st = ob.mk('control_stop', fields={'STOP_OPTION': ['all', None]})
    ob.d[st]['mutation'] = {'tagName': 'mutation', 'children': [], 'hasnext': 'false'}
    ob.chain([h2, sh, st], 40, 200)

    def sprite(name, blocks, costume, layer, x, y, vis=True):
        return {'isStage': False, 'name': name, 'variables': {}, 'lists': {}, 'broadcasts': {}, 'blocks': blocks,
                'comments': {}, 'currentCostume': 0, 'costumes': [costume], 'sounds': [], 'volume': 100,
                'layerOrder': layer, 'visible': vis, 'x': x, 'y': y, 'size': 100, 'direction': 90,
                'draggable': False, 'rotationStyle': 'all around'}

    stage = {'isStage': True, 'name': 'Stage',
             'variables': {VS: ['分數', 0], VL: ['生命', 3], VV: ['速度', 5]}, 'lists': {},
             'broadcasts': {BC: '遊戲結束'}, 'blocks': {}, 'comments': {}, 'currentCostume': 0, 'costumes': [cg],
             'sounds': [], 'volume': 100, 'layerOrder': 0, 'tempo': 60, 'videoTransparency': 50,
             'videoState': 'on', 'textToSpeechLanguage': None}
    mons = []
    for i, (n, vid) in enumerate((('分數', VS), ('生命', VL), ('速度', VV))):
        mons.append({'id': vid, 'mode': 'default', 'opcode': 'data_variable', 'params': {'VARIABLE': n},
                     'spriteName': None, 'value': 0, 'width': 0, 'height': 0, 'x': 5, 'y': 5 + i * 26, 'visible': True})
    project = {'targets': [stage, sprite('籃子', bb.d, cb, 4, 0, -140), sprite('水果', fb.d, ca, 2, 0, 120),
                           sprite('炸彈', mb.d, cm, 1, 0, 120), sprite('結束', ob.d, co, 5, 0, 0, False)],
               'monitors': mons, 'extensions': [], 'meta': {'semver': '3.0.0', 'vm': '0.2.0', 'agent': 'ninja-dojo'}}
    return project, P.assets


if __name__ == '__main__':
    project, assets = build()
    path = os.path.join(OUT, 'demo_catch.sb3')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json', json.dumps(project, ensure_ascii=False))
        for k, v in assets.items():
            z.writestr(k, v)
    print('wrote', path, os.path.getsize(path))
