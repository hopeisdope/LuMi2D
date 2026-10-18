#!/usr/bin/env python3
"""Maakt van de gegenereerde tekeningen in art-incoming/ de sprites voor het spel.

Schrijft bijgesneden, verkleinde PNG's naar public/sprites/ en de bijbehorende maten
(afmetingen, wielposities) naar src/render/spriteData.ts.

Gebruik:  python3 scripts/process-sprites.py [--debug MAP]
Nodig: Pillow. De originelen worden niet meegecommit (te groot); bewaar ze in
art-incoming/ (staat niet in git) met de namen hieronder.
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art-incoming')
OUT = os.path.join(ROOT, 'public', 'sprites')
DATA = os.path.join(ROOT, 'src', 'render', 'spriteData.ts')

CARS = ['classic', 'racer', 'jeep', 'bubble']
# Volgorde van de wielen in wheels.png, van links naar rechts.
WHEEL_ORDER = ['classic', 'racer', 'jeep', 'bubble']
FRIENDS = ['bunny', 'bear', 'dinoGreen', 'dinoOrange', 'alien', 'robot', 'unicorn', 'cupcake']

CAR_WIDTH = 480      # px; ~150 eenheden breed getekend, ~3 px per eenheid op een iPad
WHEEL_SIZE = 160     # px
FRIEND_HEIGHT = 288  # px per houding
ALPHA_MIN = 16       # vage randjes (anti-aliasing) negeren bij het bijsnijden

# Spullen uit de gameplayronde: losse plaatjes (max breedte/hoogte in px) en vellen met meerdere beelden
# (aantal beelden, hoogte van een vak in px). In vellen blijven de onderlinge groottes bewaard.
PROPS_SINGLE = {'pad': (360, 120), 'moment-cotton': (300, 270)}
PROPS_SHEETS = {'moment-egg': (3, 240), 'scene-ducks': (4, 180), 'scene-sheep': (2, 180)}
GARAGE_WIDTH = 960   # px; de opening wordt in de code ~200 eenheden breed


def load(name):
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        sys.exit(f'missing {path}')
    return Image.open(path).convert('RGBA')


def trim(im):
    box = im.getchannel('A').point(lambda v: 255 if v >= ALPHA_MIN else 0).getbbox()
    return im.crop(box)


def save_png(im, name):
    """PNG met palet van 256 kleuren: vlakke cartoonkleuren blijven zo goed en het bestand wordt veel kleiner."""
    path = os.path.join(OUT, name)
    im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)
    return os.path.getsize(path)


def dark(p):
    r, g, b, a = p
    return a > 200 and r < 60 and g < 60 and b < 70


def find_wheel(im, x0, x1):
    """Bandcirkel in kolommen [x0, x1): uit de breedte van de onderste strook donkere pixels."""
    px = im.load()
    w, h = im.size
    lowest = {}
    for x in range(x0, x1):
        for y in range(h - 1, h // 3, -1):
            if dark(px[x, y]):
                lowest[x] = y
                break
    bottom = max(lowest.values())
    k = 0.04 * h  # strookhoogte; de halve breedte a van de strook geeft r = (a^2 + k^2) / 2k
    cols = [x for x, y in lowest.items() if y >= bottom - k]
    a = (max(cols) - min(cols)) / 2
    r = (a * a + k * k) / (2 * k)
    return ((max(cols) + min(cols)) / 2, bottom - r, r)


def process_car(car, debug):
    im = trim(load(f'car-{car}.png'))
    w, h = im.size
    wheels = [find_wheel(im, 0, w // 2), find_wheel(im, w // 2, w)]
    scale = CAR_WIDTH / w
    out = im.resize((CAR_WIDTH, round(h * scale)), Image.LANCZOS)
    size = save_png(out, f'car-{car}.png')
    if debug:
        d = im.copy()
        dr = ImageDraw.Draw(d)
        for cx, cy, r in wheels:
            dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 0, 255, 255), width=6)
        d.save(os.path.join(debug, f'car-{car}-wheels.png'))
    r = sum(wr for _, _, wr in wheels) / 2 * scale
    return {
        'width': out.size[0],
        'height': out.size[1],
        'wheels': [(round(cx * scale, 1), round(cy * scale, 1)) for cx, cy, _ in wheels],
        'wheelR': round(r, 1),
        'bytes': size,
    }


def split_columns(im, count):
    """Splitst een rij figuren op de breedste doorzichtige tussenruimtes."""
    a = im.getchannel('A').point(lambda v: 255 if v >= 64 else 0)
    w, h = im.size
    filled = [a.crop((x, 0, x + 1, h)).getbbox() is not None for x in range(w)]
    runs, start = [], None
    for x, f in enumerate(filled + [False]):
        if f and start is None:
            start = x
        elif not f and start is not None:
            runs.append((start, x))
            start = None
    # Samenvoegen tot er `count` stukken over zijn, steeds over de kleinste tussenruimte.
    while len(runs) > count:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = gaps.index(min(gaps))
        runs[i:i + 2] = [(runs[i][0], runs[i + 1][1])]
    if len(runs) != count:
        sys.exit(f'expected {count} figures, found {len(runs)}')
    return [trim(im.crop((x0, 0, x1, h))) for x0, x1 in runs]


def foot_center(im):
    """Horizontaal midden van het onderste derde (benen/voeten): blijft gelijk tussen de houdingen."""
    w, h = im.size
    px = im.load()
    xs = [x for y in range(h * 2 // 3, h, 2) for x in range(0, w, 2) if px[x, y][3] >= 128]
    return sum(xs) / len(xs)


def process_wheels():
    sheet = load('wheels.png')
    result = {}
    for car, wheel in zip(WHEEL_ORDER, split_columns(sheet, 4)):
        side = max(wheel.size)
        square = Image.new('RGBA', (side, side))
        square.paste(wheel, ((side - wheel.size[0]) // 2, (side - wheel.size[1]) // 2))
        result[car] = save_png(square.resize((WHEEL_SIZE, WHEEL_SIZE), Image.LANCZOS), f'wheel-{car}.png')
    return result


def process_friend(kind):
    poses = split_columns(load(f'friend-{kind}.png'), 3)
    centers = [foot_center(p) for p in poses]
    half = max(max(c, p.size[0] - c) for p, c in zip(poses, centers))
    height = max(p.size[1] for p in poses)
    cell = (int(half * 2) + 2, height)
    sheet = Image.new('RGBA', (cell[0] * 3, cell[1]))
    for i, (p, c) in enumerate(zip(poses, centers)):
        # Voeten op de onderrand, benen in het midden van het vak.
        sheet.paste(p, (round(i * cell[0] + cell[0] / 2 - c), cell[1] - p.size[1]), p)
    scale = FRIEND_HEIGHT / cell[1]
    cw = round(cell[0] * scale)
    out = sheet.resize((cw * 3, FRIEND_HEIGHT), Image.LANCZOS)
    return {'cellWidth': cw, 'cellHeight': FRIEND_HEIGHT, 'bytes': save_png(out, f'friend-{kind}.png')}


def fit(im, max_w, max_h):
    scale = min(max_w / im.size[0], max_h / im.size[1])
    return im.resize((round(im.size[0] * scale), round(im.size[1] * scale)), Image.LANCZOS)


def process_single(name):
    out = fit(trim(load(f'{name}.png')), *PROPS_SINGLE[name])
    return {'width': out.size[0], 'height': out.size[1], 'bytes': save_png(out, f'{name}.png')}


def process_sheet(name):
    """Beelden naast elkaar in gelijke vakken: onderrand op de grond, horizontaal in het midden, zonder ze los te
    schalen (een kuiken blijft kleiner dan de moedereend)."""
    count, cell_height = PROPS_SHEETS[name]
    frames = split_columns(load(f'{name}.png'), count)
    cw = max(f.size[0] for f in frames) + 2
    ch = max(f.size[1] for f in frames)
    sheet = Image.new('RGBA', (cw * count, ch))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * cw + (cw - f.size[0]) // 2, ch - f.size[1]), f)
    scale = cell_height / ch
    out_w = round(cw * scale)
    out = sheet.resize((out_w * count, cell_height), Image.LANCZOS)
    return {'cellWidth': out_w, 'cellHeight': cell_height, 'frames': count, 'bytes': save_png(out, f'{name}.png')}


def find_opening(im):
    """Doorzichtige deuropening van de garage: de breedste doorzichtige strook tussen muren op 80% hoogte, en
    vanaf de onderrand omhoog tot de bovendorpel."""
    a = im.getchannel('A').load()
    w, h = im.size
    y = int(h * 0.8)
    runs, start, seen_wall = [], None, False
    for x in range(w):
        solid = a[x, y] >= 64
        if solid:
            if start is not None and seen_wall:
                runs.append((start, x))
            start = None
            seen_wall = True
        elif start is None:
            start = x
    x0, x1 = max(runs, key=lambda r: r[1] - r[0])
    cx = (x0 + x1) // 2
    top = h - 1
    while top > 0 and a[cx, top] < 64:
        top -= 1
    return x0, top + 1, x1 - x0, h - top - 1


def process_garage(debug):
    im = trim(load('garage.png'))
    x, y, w, h = find_opening(im)
    if debug:
        d = im.copy()
        ImageDraw.Draw(d).rectangle([x, y, x + w, y + h], outline=(255, 0, 255, 255), width=8)
        d.save(os.path.join(debug, 'garage-opening.png'))
    scale = GARAGE_WIDTH / im.size[0]
    out = im.resize((GARAGE_WIDTH, round(im.size[1] * scale)), Image.LANCZOS)
    opening = [round(v * scale, 1) for v in (x, y, w, h)]
    return {'width': out.size[0], 'height': out.size[1], 'opening': opening, 'bytes': save_png(out, 'garage.png')}


def write_data(cars, friends, props):
    lines = [
        '// Gegenereerd door scripts/process-sprites.py; niet met de hand aanpassen.',
        "import type { CarId, FriendKind } from '../types';",
        '',
        '/** Autoplaatje (px): wielmiddens en wielstraal, zodat de draaiende wielen precies over de getekende vallen. */',
        'export interface CarSprite {',
        '  width: number;',
        '  height: number;',
        '  wheels: readonly [readonly [number, number], readonly [number, number]];',
        '  wheelR: number;',
        '}',
        '',
        '/** Vriendje: drie houdingen naast elkaar (rustig, zwaaien, juichen), voeten op de onderrand. */',
        'export interface FriendSprite {',
        '  cellWidth: number;',
        '  cellHeight: number;',
        '}',
        '',
        f'export const WHEEL_SPRITE_SIZE = {WHEEL_SIZE};',
        '',
        'export const CAR_SPRITES: Readonly<Record<CarId, CarSprite>> = {',
    ]
    for car, c in cars.items():
        (x0, y0), (x1, y1) = c['wheels']
        lines.append(f"  {car}: {{ width: {c['width']}, height: {c['height']}, wheels: [[{x0}, {y0}], [{x1}, {y1}]], wheelR: {c['wheelR']} }},")
    lines += ['};', '', 'export const FRIEND_SPRITES: Readonly<Record<FriendKind, FriendSprite>> = {']
    for kind, f in friends.items():
        lines.append(f"  {kind}: {{ cellWidth: {f['cellWidth']}, cellHeight: {f['cellHeight']} }},")
    g = props['garage']
    lines += [
        '};',
        '',
        '/** Los plaatje (px). */',
        'export interface PropSprite {',
        '  width: number;',
        '  height: number;',
        '}',
        '',
        '/** Vel met beelden naast elkaar in gelijke vakken; onderrand = grond, beeld horizontaal in het midden. */',
        'export interface SheetSprite {',
        '  cellWidth: number;',
        '  cellHeight: number;',
        '  frames: number;',
        '}',
        '',
        '/** Garage (px) met de doorzichtige deuropening [x, y, breedte, hoogte]. */',
        f"export const GARAGE_SPRITE = {{ width: {g['width']}, height: {g['height']}, opening: [{', '.join(str(v) for v in g['opening'])}] }} as const;",
        '',
    ]
    for name in PROPS_SINGLE:
        p = props[name]
        lines.append(f"export const {const_name(name)}: PropSprite = {{ width: {p['width']}, height: {p['height']} }};")
    for name in PROPS_SHEETS:
        p = props[name]
        lines.append(f"export const {const_name(name)}: SheetSprite = {{ cellWidth: {p['cellWidth']}, cellHeight: {p['cellHeight']}, frames: {p['frames']} }};")
    lines.append('')
    with open(DATA, 'w') as fh:
        fh.write('\n'.join(lines))


def const_name(name):
    """'scene-ducks' -> 'SCENE_DUCKS_SPRITE'."""
    return name.upper().replace('-', '_') + '_SPRITE'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--debug', help='schrijf controleplaatjes van de wielherkenning naar deze map')
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    cars = {car: process_car(car, args.debug) for car in CARS}
    wheels = process_wheels()
    friends = {kind: process_friend(kind) for kind in FRIENDS}
    props = {'garage': process_garage(args.debug)}
    props.update({name: process_single(name) for name in PROPS_SINGLE})
    props.update({name: process_sheet(name) for name in PROPS_SHEETS})
    write_data(cars, friends, props)
    total = sum(c['bytes'] for c in cars.values()) + sum(wheels.values()) + sum(f['bytes'] for f in friends.values())
    for car, c in cars.items():
        print(f"car-{car}.png {c['width']}x{c['height']} wheels={c['wheels']} r={c['wheelR']} {c['bytes'] // 1024} KB")
    for car, b in wheels.items():
        print(f'wheel-{car}.png {b // 1024} KB')
    for kind, f in friends.items():
        print(f"friend-{kind}.png cell={f['cellWidth']}x{f['cellHeight']} {f['bytes'] // 1024} KB")
    for name, p in props.items():
        print(f"{name}.png {p} ".replace(f"'bytes': {p['bytes']}", f"{p['bytes'] // 1024} KB"))
    total += sum(p['bytes'] for p in props.values())
    print(f'total {total // 1024} KB')


if __name__ == '__main__':
    main()
