"""Check the print PDFs: page geometry, and that the artwork still decodes.

Rendering each PDF and reading the code back is the point — a PDF that looks
right but rasterises to something unscannable is the failure worth catching.
"""

import glob
import os
import sys

import pymupdf
from PIL import Image

import verify_qr as V

HERE = os.path.dirname(os.path.abspath(__file__))
PT_MM = 25.4 / 72.0
BLEED_MM = 3.0


def boxes(page):
    def mm(rect):
        return (round(rect.width * PT_MM, 2), round(rect.height * PT_MM, 2))
    return mm(page.mediabox), mm(page.trimbox), mm(page.bleedbox)


def render(path, dpi):
    doc = pymupdf.open(path)
    page = doc[0]
    pix = page.get_pixmap(dpi=dpi)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()
    return img


def check_sheet(path, cols=6, rows=8, side_in=1.0, gap_mm=4.0, dpi=300):
    """The sheet holds 48 separate stickers. Decoding the whole page is not the
    real-world case (and detectors give up on a dense page of small codes) — a
    phone frames one sticker, so each cell is cropped and read on its own."""
    img = render(path, dpi)
    scale = dpi / 72.0
    page_w, page_h = 8.5 * 72, 11 * 72
    side = side_in * 72
    gap = gap_mm / PT_MM
    grid_w = cols * side + (cols - 1) * gap
    grid_h = rows * side + (rows - 1) * gap
    x0 = (page_w - grid_w) / 2
    y0 = (page_h - grid_h) / 2

    ok = 0
    for r in range(rows):
        for c in range(cols):
            x = (x0 + c * (side + gap)) * scale
            # PDF origin is bottom-left; the image's is top-left.
            y = (page_h - (y0 + r * (side + gap)) - side) * scale
            cell = img.crop((int(x), int(y), int(x + side * scale),
                             int(y + side * scale)))
            if V.decode_zxing(cell) == V.URL:
                ok += 1
    total = cols * rows
    status = "PASS" if ok == total else "CHECK"
    print(f"{status:5} {os.path.basename(path):34} US Letter, {total} stickers  "
          f"cells decoding at {dpi}dpi: {ok}/{total}")
    return ok == total


def check(path):
    name = os.path.basename(path)
    if "sheet-" in name:
        return check_sheet(path)
    doc = pymupdf.open(path)
    page = doc[0]
    media, trim, bleed = boxes(page)
    doc.close()

    # The trim box must sit BLEED_MM inside the media box on every side.
    margin_w = round((media[0] - trim[0]) / 2, 2)
    margin_h = round((media[1] - trim[1]) / 2, 2)
    geom_ok = abs(margin_w - BLEED_MM) < 0.05 and abs(margin_h - BLEED_MM) < 0.05
    # Decode at a few real print resolutions.
    reads = []
    for dpi in (150, 300, 600):
        img = render(path, dpi)
        hit = V.decode_zxing(img) == V.URL
        reads.append((dpi, hit))

    ok_reads = sum(1 for _, h in reads if h)
    status = "PASS" if geom_ok and ok_reads == len(reads) else "CHECK"
    print(f"{status:5} {name:34} trim {trim[0]:>6}x{trim[1]:<6}mm  "
          f"bleed margin {margin_w}mm  decode "
          + " ".join(f"{d}dpi:{'ok' if h else 'FAIL'}" for d, h in reads))
    return status == "PASS"


if __name__ == "__main__":
    pats = sys.argv[1:] or ["print/*.pdf"]
    bad = 0
    for pat in pats:
        for path in sorted(glob.glob(os.path.join(HERE, pat))):
            if os.path.basename(path).startswith("PROOF"):
                continue
            if not check(path):
                bad += 1
    print(f"\n{'all print files pass' if not bad else f'{bad} file(s) need attention'}")
