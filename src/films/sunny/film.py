"""sunny — from life 04. Rendered in Blender, entirely from this code.

  B=/Applications/Blender.app/Contents/MacOS/Blender
  $B --background --factory-startup --python src/films/sunny/film.py -- --sheet
  $B ... -- --still feather:2.1,sunny:9      stills -> renders/sunny/<scene>-<t>s.png
  $B ... -- --scene feather                  one scene, draft -> renders/sunny/feather.mp4
  $B ... -- --release                        every scene -> public/sunny.mp4 + poster
  options: --look felt|paper|toon  --size 1080  --samples 32

The film moves on twos: the scene is posed 12 times a second and each pose is
held for two frames of the 24 fps film.
"""
import hashlib
import math
import os
import shutil
import subprocess
import sys
import time

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import cat as C          # noqa: E402
import sets as S         # noqa: E402
from scenes import SCENES  # noqa: E402

FPS, POSES = 24, 12
FFMPEG = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
OUT = os.path.join(ROOT, "renders", "sunny")


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = {"size": 1080, "samples": 32, "look": "felt"}
    i = 0
    while i < len(a):
        k = a[i].lstrip("-")
        if i + 1 < len(a) and not a[i + 1].startswith("--"):
            o[k] = a[i + 1]
            i += 2
        else:
            o[k] = True
            i += 1
    o["size"], o["samples"] = int(o["size"]), int(o["samples"])
    return o


def setup(o):
    s = bpy.context.scene
    s.render.engine = "BLENDER_EEVEE"
    s.render.resolution_x = s.render.resolution_y = o["size"]
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGB"
    s.render.use_stamp = False
    s.render.film_transparent = False
    s.eevee.taa_render_samples = o["samples"]
    s.eevee.use_shadows = True
    try:
        s.eevee.use_raytracing = True
        s.eevee.ray_tracing_method = "SCREEN"
        s.eevee.use_fast_gi = True
        s.eevee.fast_gi_distance = 1.5
    except Exception as e:           # older or newer EEVEE: the film still renders
        print("raytracing options unavailable:", e)
    s.view_settings.view_transform = "AgX"
    try:
        s.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    s.view_settings.exposure = 0.0
    C.LOOK["name"] = o["look"]


def apply_look(o):
    if o["look"] != "paper":
        return
    for ob in bpy.data.objects:
        if ob.type == "MESH" and (ob.name.startswith("sunny") or ob.name.startswith("grey")):
            if len(ob.data.vertices) > 400:
                d = ob.modifiers.new("fold", "DECIMATE")
                d.ratio = 0.035 if "body" in ob.name else 0.12
            for p in ob.data.polygons:
                p.use_smooth = False


def build(scene, o):
    S.reset()
    st = scene.build()
    apply_look(o)
    return st


def render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def pixel_hash(path):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return hashlib.md5(raw).hexdigest()


def render_scene(scene, o, tmp):
    """Render one scene's poses to PNGs in `tmp`, encode, delete. Returns the mp4."""
    os.makedirs(tmp, exist_ok=True)
    st = build(scene, o)
    n = int(round(scene.dur * POSES))
    t0 = time.time()
    for i in range(n):
        scene.frame(st, i / POSES)
        render(os.path.join(tmp, "f%04d.png" % i))
    mp4 = os.path.join(OUT, "%s%s.mp4" % (scene.id, "" if o["size"] == 1080 else "-%d" % o["size"]))
    subprocess.run([FFMPEG, "-v", "error", "-y", "-framerate", str(POSES), "-i", os.path.join(tmp, "f%04d.png"),
                    "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-pix_fmt", "yuv420p", mp4], check=True)
    shutil.rmtree(tmp)
    print("SCENE %s: %d poses in %.0f s -> %s" % (scene.id, n, time.time() - t0, mp4), flush=True)
    return mp4


def concat(parts, dest, crf=20):
    lst = os.path.join(OUT, "concat.txt")
    with open(lst, "w") as f:
        for p in parts:
            f.write("file '%s'\n" % p)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-r", str(FPS), "-c:v", "libx264",
                    "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", dest], check=True)
    os.remove(lst)


def main():
    o = args()
    setup(o)
    os.makedirs(OUT, exist_ok=True)
    by_id = {s.id: s for s in SCENES}

    if "sheet" in o:
        size = 360 if o["size"] == 1080 else o["size"]
        bpy.context.scene.render.resolution_x = bpy.context.scene.render.resolution_y = size
        bpy.context.scene.eevee.taa_render_samples = min(o["samples"], 12)
        pick = o["sheet"].split(",") if isinstance(o["sheet"], str) else [s.id for s in SCENES]
        cols = int(o.get("cols", 6))
        tmp = os.path.join(OUT, "sheet-tmp")
        os.makedirs(tmp, exist_ok=True)
        k = 0
        for sid in pick:
            sc = by_id[sid]
            st = build(sc, o)
            for j in range(cols):
                t = sc.dur * (j + 0.5) / cols if cols > 3 else (0.02, 0.5, 0.98)[j] * sc.dur
                t = round(t * POSES) / POSES
                sc.frame(st, t)
                render(os.path.join(tmp, "s%03d.png" % k))
                k += 1
        dest = os.path.join(OUT, "sheet%s.jpg" % ("" if not isinstance(o["sheet"], str) else "-" + pick[0]))
        subprocess.run([FFMPEG, "-v", "error", "-y", "-i", os.path.join(tmp, "s%03d.png"), "-vf", "tile=%dx%d" % (cols, len(pick)),
                        "-frames:v", "1", "-q:v", "3", dest], check=True)
        shutil.rmtree(tmp)
        print("SHEET", dest)
        return

    if "still" in o or "hash" in o:
        cur = None
        for item in (o.get("still") or o.get("hash")).split(","):
            sid, t = item.split(":")
            t = round(float(t) * POSES) / POSES
            if cur != sid:
                st = build(by_id[sid], o)
                cur = sid
            by_id[sid].frame(st, t)
            tag = "" if o["look"] == "felt" else "-" + o["look"]
            p = os.path.join(OUT, "%s-%gs%s.png" % (sid, t, tag))
            render(p)
            if "hash" in o:
                h1 = pixel_hash(p)
                st = build(by_id[sid], o)
                by_id[sid].frame(st, t)
                render(p)
                print("HASH %s %s %s %s" % (item, h1, pixel_hash(p), "same" if h1 == pixel_hash(p) else "DIFFERENT"))
            else:
                print("STILL", p)
        return

    if "scene" in o:
        for sid in o["scene"].split(","):
            render_scene(by_id[sid], o, os.path.join(OUT, "tmp-" + sid))
        return

    if "release" in o:
        only = o["only"].split(",") if "only" in o else None
        parts = []
        for sc in SCENES:
            mp4 = os.path.join(OUT, sc.id + ".mp4")
            if (only and sc.id not in only and os.path.exists(mp4)) or ("resume" in o and os.path.exists(mp4)):
                parts.append(mp4)
                continue
            parts.append(render_scene(sc, o, os.path.join(OUT, "tmp-" + sc.id)))
        dest = os.path.join(ROOT, "public", "sunny.mp4")
        concat(parts, dest)
        mib = os.path.getsize(dest) / 2 ** 20
        print("RELEASE %s %.2f MiB" % (dest, mib))
        if mib > 20:
            raise SystemExit("over the 20 MiB budget")
        return

    print(__doc__)


main()
