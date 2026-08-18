"""Generate styled QR codes for the b-card version of seanmh.com.

One geometry pass drives both the PNG (PIL, supersampled) and the SVG (vector),
so what gets verified is what gets shipped.
"""

import os
import segno
from PIL import Image, ImageDraw

URL = "https://seanmh.com/card"
OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)

QUIET = 4          # quiet zone, in modules (spec minimum is 4)
SS = 6             # supersample factor for the PNG raster
MODULE_PX = 16     # nominal module size in output pixels


def matrix(ecc):
    """Module matrix as a list of lists of bools, no quiet zone."""
    qr = segno.make(URL, error=ecc, boost_error=False)
    rows = [[bool(m) for m in row] for row in qr.matrix]
    return rows, qr.version


def in_finder(r, c, n):
    """True if (r, c) belongs to one of the three 7x7 finder patterns."""
    return ((r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7))


# --- geometry -----------------------------------------------------------


def corner_flags(m, r, c, n):
    """Which corners of this module get rounded: no neighbour on either
    adjoining edge (and no diagonal filler) means the corner is exposed."""

    def on(rr, cc):
        return 0 <= rr < n and 0 <= cc < n and m[rr][cc]

    up, down, left, right = on(r - 1, c), on(r + 1, c), on(r, c - 1), on(r, c + 1)
    return {
        "tl": not up and not left,
        "tr": not up and not right,
        "br": not down and not right,
        "bl": not down and not left,
    }


def rounded_path(x, y, s, rad, flags):
    """SVG path for a square with a selected subset of corners rounded."""
    r = rad
    p = []
    p.append(f"M {x + (r if flags['tl'] else 0)} {y}")
    p.append(f"H {x + s - (r if flags['tr'] else 0)}")
    if flags["tr"]:
        p.append(f"A {r} {r} 0 0 1 {x + s} {y + r}")
    p.append(f"V {y + s - (r if flags['br'] else 0)}")
    if flags["br"]:
        p.append(f"A {r} {r} 0 0 1 {x + s - r} {y + s}")
    p.append(f"H {x + (r if flags['bl'] else 0)}")
    if flags["bl"]:
        p.append(f"A {r} {r} 0 0 1 {x} {y + s - r}")
    p.append(f"V {y + (r if flags['tl'] else 0)}")
    if flags["tl"]:
        p.append(f"A {r} {r} 0 0 1 {x + r} {y}")
    p.append("Z")
    return " ".join(p)


def draw_rounded_pil(d, x, y, s, rad, flags, fill):
    """Same shape as rounded_path, drawn into a PIL mask."""
    d.rounded_rectangle([x, y, x + s, y + s], radius=rad, fill=fill)
    # Square off the corners that should stay sharp.
    for key, (cx, cy) in (
        ("tl", (x, y)),
        ("tr", (x + s - rad, y)),
        ("br", (x + s - rad, y + s - rad)),
        ("bl", (x, y + s - rad)),
    ):
        if not flags[key]:
            d.rectangle([cx, cy, cx + rad, cy + rad], fill=fill)


def eye_shapes(r0, c0, s, radius_outer, radius_inner):
    """Finder pattern as three concentric rounded squares (outer ring + pupil)."""
    x, y = c0 * s, r0 * s
    return [
        ("ring_out", x, y, 7 * s, radius_outer * s),
        ("ring_in", x + s, y + s, 5 * s, (radius_outer - 1) * s),
        ("pupil", x + 2 * s, y + 2 * s, 3 * s, radius_inner * s),
    ]


# --- renderers ----------------------------------------------------------


def prepare(ecc, logo=None):
    """Resolve the matrix into what actually gets drawn.

    Returns the module matrix with the finder patterns and any centre-logo hole
    removed (those are drawn as their own shapes), plus the hole's placement.
    Every output target — PNG, SVG, PDF — goes through here, so none of them can
    drift from the geometry the decoders were verified against.
    """
    m, version = matrix(ecc)
    n = len(m)

    # Blank the finder areas out of the module pass; they are drawn as shapes.
    body = [[m[r][c] and not in_finder(r, c, n) for c in range(n)] for r in range(n)]

    # Knock a hole for the centre logo. ECC H tolerates ~30% loss; a 5x5 hole in
    # a 29x29 code is 3%, so this stays far inside the budget.
    hole = None
    if logo:
        span = 7 if n >= 33 else 5
        start = (n - span) // 2
        hole = (start, start, span)
        for r in range(start, start + span):
            for c in range(start, start + span):
                body[r][c] = False

    return body, n, hole, version


def build(name, ecc, fg_a, fg_b, bg, eye_color=None, rounded=True,
          logo=None, gradient=True, mod_round=0.5, eye_round=True):
    body, n, hole, version = prepare(ecc, logo)
    eye_color = eye_color or fg_a
    total = n + 2 * QUIET

    rad_ratio = mod_round if rounded else 0.0

    # ---- PNG (supersampled mask -> gradient -> composite) ----
    s = MODULE_PX * SS
    px = total * s
    mask = Image.new("L", (px, px), 0)
    d = ImageDraw.Draw(mask)
    off = QUIET * s
    rad = int(s * rad_ratio)

    for r in range(n):
        for c in range(n):
            if not body[r][c]:
                continue
            flags = corner_flags(body, r, c, n) if rounded else \
                {k: False for k in ("tl", "tr", "br", "bl")}
            draw_rounded_pil(d, off + c * s, off + r * s, s, max(rad, 1), flags, 255)

    eye_mask = Image.new("L", (px, px), 0)
    de = ImageDraw.Draw(eye_mask)
    ro = float(eye_round) if rounded else 0.0
    ri = max(ro - 0.85, 0.0)
    for (r0, c0) in ((0, 0), (0, n - 7), (n - 7, 0)):
        shapes = eye_shapes(r0, c0, s, ro, ri)
        for i, (kind, x, y, size, radius) in enumerate(shapes):
            fill = 255 if kind != "ring_in" else 0
            if radius > 0:
                de.rounded_rectangle([off + x, off + y, off + x + size, off + y + size],
                                     radius=int(radius), fill=fill)
            else:
                de.rectangle([off + x, off + y, off + x + size, off + y + size], fill=fill)

    canvas = Image.new("RGB", (px, px), bg)

    def gradient_img(c1, c2):
        g = Image.new("RGB", (px, px))
        gd = ImageDraw.Draw(g)
        for i in range(px):
            t = i / max(px - 1, 1)
            col = tuple(int(c1[k] + (c2[k] - c1[k]) * t) for k in range(3))
            gd.line([(0, i), (px, i)], fill=col)
        return g

    a = tuple(int(fg_a[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(fg_b[i:i + 2], 16) for i in (1, 3, 5))
    paint = gradient_img(a, b) if gradient else Image.new("RGB", (px, px), fg_a)

    canvas.paste(paint, (0, 0), mask)
    ec = tuple(int(eye_color[i:i + 2], 16) for i in (1, 3, 5))
    canvas.paste(Image.new("RGB", (px, px), ec), (0, 0), eye_mask)

    if logo:
        logo(canvas, off, s, n, hole, ec, bg)

    out_png = f"{OUT}/{name}.png"
    canvas.resize((total * MODULE_PX * 2, total * MODULE_PX * 2),
                  Image.LANCZOS).save(out_png)

    # ---- SVG (same geometry, vector) ----
    u = 10  # SVG user units per module
    size = total * u
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
        f'width="{size}" height="{size}" shape-rendering="geometricPrecision" '
        f'role="img" aria-label="QR code linking to {URL}">',
        '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{fg_a}"/><stop offset="1" stop-color="{fg_b}"/>'
        '</linearGradient></defs>',
        f'<rect width="{size}" height="{size}" fill="{bg}"/>',
    ]
    q = QUIET * u
    rr = u * rad_ratio
    paths = []
    for r in range(n):
        for c in range(n):
            if not body[r][c]:
                continue
            flags = corner_flags(body, r, c, n) if rounded else \
                {k: False for k in ("tl", "tr", "br", "bl")}
            paths.append(rounded_path(q + c * u, q + r * u, u, rr,
                                      flags if rounded else
                                      {k: False for k in ("tl", "tr", "br", "bl")}))
    fill_ref = "url(#g)" if gradient else fg_a
    parts.append(f'<path fill="{fill_ref}" d="{" ".join(paths)}"/>')

    for (r0, c0) in ((0, 0), (0, n - 7), (n - 7, 0)):
        x, y = q + c0 * u, q + r0 * u
        # SVG strokes straddle the path, so the ring is inset by half a module:
        # a 6u box stroked at width u lands its outer edge exactly on the 7x7
        # finder bounds. Without the inset the eye renders 8 modules wide and
        # eats the separator, which breaks decoding.
        parts.append(
            f'<rect x="{x + u / 2}" y="{y + u / 2}" width="{6 * u}" height="{6 * u}" '
            f'rx="{max(ro - 0.5, 0) * u}" fill="none" stroke="{eye_color}" '
            f'stroke-width="{u}"/>')
        parts.append(
            f'<rect x="{x + 2 * u}" y="{y + 2 * u}" width="{3 * u}" height="{3 * u}" '
            f'rx="{ri * u}" fill="{eye_color}"/>')

    if logo:
        hr, hc, span = hole
        cx = q + (hc + span / 2) * u
        cy = q + (hr + span / 2) * u
        side = (span - 0.9) * u
        parts.append(
            f'<rect x="{cx - side / 2}" y="{cy - side / 2}" width="{side}" '
            f'height="{side}" rx="{side * 0.28}" fill="{eye_color}"/>')
        inner = side * 0.42
        parts.append(
            f'<rect x="{cx - inner / 2}" y="{cy - inner / 2}" width="{inner}" '
            f'height="{inner}" rx="{inner * 0.22}" fill="{bg}"/>')

    parts.append("</svg>")
    with open(f"{OUT}/{name}.svg", "w") as f:
        f.write("\n".join(parts))

    return version, n, out_png


def glyph_logo(canvas, off, s, n, hole, color, bg):
    """The card version's ▣ glyph: a rounded square with a knocked-out core."""
    hr, hc, span = hole
    d = ImageDraw.Draw(canvas)
    cx = off + (hc + span / 2) * s
    cy = off + (hr + span / 2) * s
    side = (span - 0.9) * s
    d.rounded_rectangle([cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2],
                        radius=int(side * 0.28), fill=color)
    inner = side * 0.42
    d.rounded_rectangle([cx - inner / 2, cy - inner / 2, cx + inner / 2, cy + inner / 2],
                        radius=int(inner * 0.22), fill=bg)


# Tuned by sweeping both decoders over the full stress matrix (see verify_qr.py).
# Module corners are nearly free; finder-eye corners are not — at 1.0 module the
# strict geometric detector stops recognising the 1:1:3:1:1 finder ratio and
# drops to 7/11. These two values are the roundest that still score 11/11 on
# both decoders under every condition.
MOD_R = 0.35
EYE_R = 0.5

VARIANTS = [
    # name, ecc, grad a, grad b, bg, eye, rounded, logo, gradient
    ("qr-mono", "m", "#000000", "#000000", "#ffffff", "#000000", False, None, False),
    ("qr-indigo", "h", "#4338ca", "#6366f1", "#ffffff", "#4338ca", True, None, True),
    ("qr-indigo-glyph", "h", "#4338ca", "#6366f1", "#ffffff", "#4338ca", True, glyph_logo, True),
    ("qr-dark", "h", "#c7d2fe", "#a5b4fc", "#0a0a0a", "#818cf8", True, None, True),
]

if __name__ == "__main__":
    for v in VARIANTS:
        name, ecc, a, b, bg, eye, rounded, logo, grad = v
        version, n, path = build(name, ecc, a, b, bg, eye, rounded, logo, grad,
                                 mod_round=MOD_R, eye_round=EYE_R)
        print(f"{name:18} ecc={ecc.upper()} version={version} modules={n}x{n} -> {path}")
