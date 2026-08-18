"""Print-ready PDFs for the b-card QR codes.

Everything is drawn as vector from the same module matrix the PNG and SVG use
(make_qr.prepare), so the geometry the decoders verified is the geometry that
goes on paper.

Layout convention, and why:

  The QR's own 4-module quiet zone IS the safe area. Sizing the symbol so that
  quiet zone runs out to the trim line maximises the module size, and a die-cut
  that drifts inward eats quiet zone rather than data — which is exactly what a
  quiet zone is for. The background then bleeds BLEED_MM past the trim on all
  sides so a drift outward never exposes paper.

  Page boxes are set properly (MediaBox = trim + bleed, TrimBox = the finished
  cut, BleedBox = the bleed edge), which is how a print shop's software finds
  the cut line. That is why the production files carry no drawn crop marks:
  the boxes are the marks, and they are machine-readable. PROOF-geometry.pdf
  draws the lines visibly for human checking and is not for printing.
"""

import os

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.units import mm, inch
from reportlab.pdfgen.canvas import Canvas

import make_qr as M

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "print")
os.makedirs(OUT, exist_ok=True)

BLEED_MM = 3.0
BLEED = BLEED_MM * mm

# The four looks, matching make_qr.VARIANTS.
LOOKS = {
    "mono":        dict(ecc="m", a="#000000", b="#000000", bg="#ffffff",
                        eye="#000000", rounded=False, logo=False, grad=False),
    "indigo":      dict(ecc="h", a="#4338ca", b="#6366f1", bg="#ffffff",
                        eye="#4338ca", rounded=True, logo=False, grad=True),
    "indigo-glyph": dict(ecc="h", a="#4338ca", b="#6366f1", bg="#ffffff",
                         eye="#4338ca", rounded=True, logo=True, grad=True),
    # No centre glyph here, matching make_qr.VARIANTS' qr-dark exactly.
    "dark":        dict(ecc="h", a="#c7d2fe", b="#a5b4fc", bg="#0a0a0a",
                        eye="#818cf8", rounded=True, logo=False, grad=True),
}


def _lerp_color(c1, c2, t):
    r1, g1, b1 = c1.red, c1.green, c1.blue
    r2, g2, b2 = c2.red, c2.green, c2.blue
    return Color(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)


def draw_qr(c, look, x, y, side):
    """Draw one QR, its quiet zone spanning exactly `side`, origin bottom-left."""
    spec = LOOKS[look]
    logo = M.glyph_logo if spec["logo"] else None
    body, n, hole, _ = M.prepare(spec["ecc"], logo)

    total = n + 2 * M.QUIET
    u = side / total                      # one module, in points
    q = M.QUIET * u
    mod_r = (M.MOD_R if spec["rounded"] else 0.0) * u
    eye_r = (M.EYE_R if spec["rounded"] else 0.0) * u

    ca, cb = HexColor(spec["a"]), HexColor(spec["b"])
    eye = HexColor(spec["eye"])
    bg = HexColor(spec["bg"])

    # PDF y grows upward; the matrix' row 0 is the top row.
    def py(row):
        return y + side - q - (row + 1) * u

    def px(col):
        return x + q + col * u

    # Each module is a separate fill, and abutting fills leave hairline seams
    # when the PDF is rasterised — a faint grid across what should read as one
    # solid blob. Stroking each shape in its own colour at a hair's width makes
    # neighbours overlap just enough to close the seam.
    seam = u * 0.03
    c.setLineWidth(seam)

    for r in range(n):
        # Vertical gradient, matching the SVG's linearGradient.
        paint = _lerp_color(ca, cb, r / max(n - 1, 1)) if spec["grad"] else ca
        c.setFillColor(paint)
        c.setStrokeColor(paint)
        for col in range(n):
            if not body[r][col]:
                continue
            if mod_r > 0:
                f = M.corner_flags(body, r, col, n)
                # roundRect cannot do per-corner radii, so draw the square and
                # re-square the corners that must stay sharp.
                c.roundRect(px(col), py(r), u, u, mod_r, stroke=1, fill=1)
                for key, (cx, cy) in (
                    ("tl", (px(col), py(r) + u - mod_r)),
                    ("tr", (px(col) + u - mod_r, py(r) + u - mod_r)),
                    ("br", (px(col) + u - mod_r, py(r))),
                    ("bl", (px(col), py(r))),
                ):
                    if not f[key]:
                        c.rect(cx, cy, mod_r, mod_r, stroke=1, fill=1)
            else:
                c.rect(px(col), py(r), u, u, stroke=1, fill=1)

    # Finder patterns: a 1-module ring plus a 3-module pupil.
    c.setFillColor(eye)
    c.setStrokeColor(eye)
    for (r0, c0) in ((0, 0), (0, n - 7), (n - 7, 0)):
        ex, ey = px(c0), py(r0 + 6)
        c.setLineWidth(u)
        # Inset by half a stroke so the ring's outer edge lands on the 7x7 bound.
        if eye_r > 0:
            c.roundRect(ex + u / 2, ey + u / 2, 6 * u, 6 * u,
                        max(eye_r - u / 2, 0), stroke=1, fill=0)
            c.roundRect(ex + 2 * u, ey + 2 * u, 3 * u, 3 * u,
                        max(eye_r - 0.85 * u, 0), stroke=0, fill=1)
        else:
            c.rect(ex + u / 2, ey + u / 2, 6 * u, 6 * u, stroke=1, fill=0)
            c.rect(ex + 2 * u, ey + 2 * u, 3 * u, 3 * u, stroke=0, fill=1)

    if hole:
        hr, hc, span = hole
        cx = px(hc) + span * u / 2
        cy = py(hr + span - 1) + span * u / 2
        s = (span - 0.9) * u
        c.setFillColor(eye)
        c.roundRect(cx - s / 2, cy - s / 2, s, s, s * 0.28, stroke=0, fill=1)
        inner = s * 0.42
        c.setFillColor(bg)
        c.roundRect(cx - inner / 2, cy - inner / 2, inner, inner,
                    inner * 0.22, stroke=0, fill=1)


def new_canvas(path, trim_w, trim_h):
    """Canvas whose page is trim + bleed, with the print boxes set."""
    page_w, page_h = trim_w + 2 * BLEED, trim_h + 2 * BLEED
    c = Canvas(path, pagesize=(page_w, page_h), pageCompression=1)
    c.setTrimBox((BLEED, BLEED, BLEED + trim_w, BLEED + trim_h))
    c.setBleedBox((0, 0, page_w, page_h))
    c.setArtBox((BLEED, BLEED, BLEED + trim_w, BLEED + trim_h))
    return c, page_w, page_h


def sticker(look, side_in, name):
    """Square sticker: QR quiet zone runs to trim, background bleeds past it."""
    trim = side_in * inch
    path = os.path.join(OUT, name)
    c, page_w, page_h = new_canvas(path, trim, trim)

    c.setFillColor(HexColor(LOOKS[look]["bg"]))
    c.rect(0, 0, page_w, page_h, stroke=0, fill=1)   # background across the bleed
    draw_qr(c, look, BLEED, BLEED, trim)

    c.setTitle(f"seanmh.com/card - {look} sticker {side_in}in")
    c.showPage()
    c.save()
    return path, trim / 1  # points


def card_back(look, name):
    """Business card back, 3.5x2in, QR centred and well inside the safe area."""
    trim_w, trim_h = 3.5 * inch, 2.0 * inch
    path = os.path.join(OUT, name)
    c, page_w, page_h = new_canvas(path, trim_w, trim_h)

    c.setFillColor(HexColor(LOOKS[look]["bg"]))
    c.rect(0, 0, page_w, page_h, stroke=0, fill=1)

    # 26mm across the quiet zone leaves a ~0.7mm module and a wide margin.
    side = 26 * mm
    draw_qr(c, look, BLEED + (trim_w - side) / 2, BLEED + (trim_h - side) / 2, side)

    c.setTitle("seanmh.com/card - business card back")
    c.showPage()
    c.save()
    return path


def letter_sheet(look, name, cols=6, rows=8, side_in=1.0, gap_mm=4.0):
    """Kiss-cut/office sheet: a grid of stickers on US Letter. No bleed, because
    each cell sits inside the sheet carrying its own background.

    The sticker is defined once as a Form XObject and then placed 48 times.
    Drawing it 48 times over would repeat every module's path operators and
    balloon the file (1.4 MB against the 60 KB this produces) for identical
    output.
    """
    page_w, page_h = 8.5 * inch, 11 * inch
    path = os.path.join(OUT, name)
    c = Canvas(path, pagesize=(page_w, page_h), pageCompression=1)

    side = side_in * inch
    gap = gap_mm * mm
    grid_w = cols * side + (cols - 1) * gap
    grid_h = rows * side + (rows - 1) * gap
    x0 = (page_w - grid_w) / 2
    y0 = (page_h - grid_h) / 2

    form = f"sticker_{look}"
    c.beginForm(form, 0, 0, side, side)
    c.setFillColor(HexColor(LOOKS[look]["bg"]))
    c.rect(0, 0, side, side, stroke=0, fill=1)
    draw_qr(c, look, 0, 0, side)
    # Faint cut guide; it sits on the quiet zone, never on data.
    c.setStrokeColor(Color(0.75, 0.75, 0.8))
    c.setLineWidth(0.25)
    c.rect(0, 0, side, side, stroke=1, fill=0)
    c.endForm()

    for r in range(rows):
        for col in range(cols):
            c.saveState()
            c.translate(x0 + col * (side + gap), y0 + r * (side + gap))
            c.doForm(form)
            c.restoreState()

    c.setTitle(f"seanmh.com/card - {cols}x{rows} sheet of {side_in}in stickers")
    c.showPage()
    c.save()
    return path


def proof(look, side_in, name):
    """Human-readable proof: trim, bleed and quiet-zone lines drawn on top.
    Not for printing."""
    trim = side_in * inch
    path = os.path.join(OUT, name)
    c, page_w, page_h = new_canvas(path, trim, trim)

    c.setFillColor(HexColor(LOOKS[look]["bg"]))
    c.rect(0, 0, page_w, page_h, stroke=0, fill=1)
    draw_qr(c, look, BLEED, BLEED, trim)

    # Bleed edge (page edge).
    c.setStrokeColor(Color(0.85, 0.3, 0.3))
    c.setLineWidth(0.5)
    c.setDash(3, 2)
    c.rect(0.25, 0.25, page_w - 0.5, page_h - 0.5, stroke=1, fill=0)

    # Trim line.
    c.setStrokeColor(Color(0.1, 0.6, 0.3))
    c.setDash()
    c.rect(BLEED, BLEED, trim, trim, stroke=1, fill=0)

    # Quiet-zone inner edge: nothing inside this may be cut into.
    body, n, _, _ = M.prepare(LOOKS[look]["ecc"],
                              M.glyph_logo if LOOKS[look]["logo"] else None)
    u = trim / (n + 2 * M.QUIET)
    c.setStrokeColor(Color(0.2, 0.4, 0.9))
    c.setDash(2, 2)
    c.rect(BLEED + M.QUIET * u, BLEED + M.QUIET * u, n * u, n * u, stroke=1, fill=0)

    c.setDash()
    c.setFont("Helvetica", 5)
    c.setFillColor(Color(0.3, 0.3, 0.35))
    c.drawString(2, 3, "red = bleed edge | green = trim | blue = data area (quiet zone between)")
    c.setFont("Helvetica-Bold", 6)
    c.drawString(2, page_h - 7, "PROOF - DO NOT PRINT")

    c.setTitle("seanmh.com/card - geometry proof")
    c.showPage()
    c.save()
    return path


if __name__ == "__main__":
    made = []
    for look in ("mono", "indigo", "indigo-glyph", "dark"):
        made.append(sticker(look, 2.0, f"sticker-2in-{look}.pdf")[0])
    made.append(sticker("indigo-glyph", 1.0, "sticker-1in-indigo-glyph.pdf")[0])
    made.append(sticker("indigo-glyph", 1.5, "sticker-1.5in-indigo-glyph.pdf")[0])
    made.append(card_back("indigo-glyph", "card-back-3.5x2in.pdf"))
    made.append(letter_sheet("indigo-glyph", "sheet-letter-1in-x48.pdf"))
    made.append(proof("indigo-glyph", 2.0, "PROOF-geometry-2in.pdf"))

    for p in made:
        print(f"  {os.path.basename(p)}")
