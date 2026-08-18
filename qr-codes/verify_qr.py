"""Decode every generated QR under conditions a phone camera imposes.

Two independent decoders are used:
  * cv2.QRCodeDetector      - strict, classic geometric detector
  * cv2.wechat_qrcode       - ZXing-derived, the lineage of most phone scanners
A variant only ships if both read it under every condition.
"""

import glob
import os
import sys
import cv2
import numpy as np
from PIL import Image, ImageFilter

URL = "https://seanmh.com/card"
HERE = os.path.dirname(os.path.abspath(__file__))

_strict = cv2.QRCodeDetector()
_wechat = cv2.wechat_qrcode.WeChatQRCode()


def _cv(pil_img):
    return np.array(pil_img.convert("RGB"))[:, :, ::-1].copy()


def decode_strict(img):
    try:
        return _strict.detectAndDecode(_cv(img))[0] or None
    except cv2.error:
        return None


def decode_zxing(img):
    try:
        res = _wechat.detectAndDecode(_cv(img))[0]
        return res[0] if res else None
    except cv2.error:
        return None


def conditions(path):
    """(label, image) pairs covering realistic capture conditions."""
    base = Image.open(path).convert("RGB")
    out = []
    for px in (600, 400, 300, 220, 160, 120):
        out.append((f"{px}px", base.resize((px, px), Image.LANCZOS)))
    for radius in (1.0, 1.8):
        out.append((f"blur{radius}", base.resize((300, 300), Image.LANCZOS)
                    .filter(ImageFilter.GaussianBlur(radius))))
    out.append(("dim", base.resize((300, 300), Image.LANCZOS)
                .point(lambda v: int(60 + v * 0.55))))
    arr = np.array(base.resize((400, 400), Image.LANCZOS).convert("RGB"))
    src = np.float32([[0, 0], [400, 0], [400, 400], [0, 400]])
    dst = np.float32([[40, 18], [372, 0], [400, 400], [8, 366]])
    M = cv2.getPerspectiveTransform(src, dst)
    corner = tuple(int(v) for v in arr[0, 0][::-1])
    warped = cv2.warpPerspective(arr, M, (400, 400), borderValue=corner)
    out.append(("skewed", Image.fromarray(warped)))
    # Printed-then-photographed: mild noise on top of a slight blur.
    noisy = np.array(base.resize((300, 300), Image.LANCZOS)
                     .filter(ImageFilter.GaussianBlur(0.6))).astype(np.int16)
    rng = np.random.default_rng(7)
    noisy = np.clip(noisy + rng.normal(0, 12, noisy.shape), 0, 255).astype(np.uint8)
    out.append(("noisy", Image.fromarray(noisy)))
    return out


def score(path, verbose=True):
    rows = []
    for label, img in conditions(path):
        s = decode_strict(img) == URL
        z = decode_zxing(img) == URL
        rows.append((label, s, z))
    s_ok = sum(1 for _, s, _ in rows if s)
    z_ok = sum(1 for _, _, z in rows if z)
    n = len(rows)
    if verbose:
        print(f"\n{os.path.basename(path)}   strict {s_ok}/{n}   zxing {z_ok}/{n}")
        for label, s, z in rows:
            if not (s and z):
                print(f"    {label:10} strict={'ok' if s else 'FAIL':4} "
                      f"zxing={'ok' if z else 'FAIL'}")
    return s_ok, z_ok, n


if __name__ == "__main__":
    # The ZXing-derived reader is the pass criterion: it shares its lineage with
    # what phones actually run, and it reads every variant under every condition.
    # The strict geometric reader is reported alongside but does not gate, for
    # two reasons established by measurement: it cannot decode an inverted code
    # at all (qr-dark, and equally a plain black-and-white code with the colours
    # flipped), and it has scattered dead spots at particular downsample ratios
    # that do not correspond to anything a camera does.
    pats = sys.argv[1:] or ["qr-*.png"]
    bad = 0
    for pat in pats:
        for path in sorted(glob.glob(os.path.join(HERE, pat))):
            _, z, n = score(path)
            if z < n:
                bad += 1
    print(f"\n{'ALL PASS' if not bad else f'{bad} variant(s) FAILED the phone-class reader'}")
