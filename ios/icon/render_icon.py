#!/usr/bin/env python3
"""Rendert ios/icon/boxolo_icon.svg mit Chromium (Playwright) als App-Icon:
1024x1024, PNG, sRGB, ohne Alphakanal -> ios/BeatBox/Assets.xcassets/AppIcon.appiconset/AppIcon.png
Aufruf: python3 ios/icon/render_icon.py [zieldatei]"""
import sys, io, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
SVG = ROOT / 'ios' / 'icon' / 'boxolo_icon.svg'
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'ios/BeatBox/Assets.xcassets/AppIcon.appiconset/AppIcon.png'
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1024, 'height': 1024}, device_scale_factor=1)
    pg.set_content('<html><body style="margin:0">' + SVG.read_text() + '</body></html>')
    png = pg.locator('svg').screenshot(); b.close()
im = Image.open(io.BytesIO(png)).convert('RGB')
assert im.size == (1024, 1024), im.size
im.save(OUT, 'PNG', optimize=True)
print(OUT, im.size, im.mode)
