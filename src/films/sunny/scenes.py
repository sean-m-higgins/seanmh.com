"""The nine scenes. Each has `dur`, `build()` -> state and `frame(state, t)`.

`frame` is a pure function of scene time `t` (seconds): it places the cat,
poses it, moves props, lights and camera. Nothing is keyframed.
"""
import math

import bpy
from mathutils import Matrix, Vector

import anim as A
import sets as S
from anim import blend, blink, clamp, ease, ease_in, ease_out, lerp, rot, span
from cat import Cat

V = Vector
PI = math.pi

# Sunny has three legs, so he has three ways of moving, all of them hops.
# D is the ground covered in one cycle (see anim.gait for why that keeps paws planted).
WALK = dict(D=0.5, mode="walk")
TROT = dict(D=0.72, mode="canter")
RUN_PER = 0.6 / 0.35


def camera(lens=50.0, fstop=0.6, clip=0.05):
    cd = bpy.data.cameras.new("cam")
    cd.lens, cd.clip_start, cd.clip_end = lens, clip, 300
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = fstop
    cam = S.link(bpy.data.objects.new("cam", cd))
    bpy.context.scene.camera = cam
    return cam


def aim(cam, pos, target, focus=None, roll=0.0):
    pos, target = V(pos), V(target)
    cam.location = pos
    q = (target - pos).to_track_quat("-Z", "Y")
    cam.rotation_euler = (q.to_matrix().to_4x4() @ Matrix.Rotation(roll, 4, "Z")).to_euler()
    cam.data.dof.focus_distance = (V(focus) - pos).length if focus is not None else (target - pos).length


def per(g):
    return g["D"]


def walk_pose(dist, g=WALK, **kw):
    a = dict(g)
    a.update(kw)
    return A.gait(dist / g["D"], **a)


def move_pose(dist, k, **kw):
    """Canter blending down to a walk as k goes 0 -> 1."""
    return blend(walk_pose(dist, TROT, **kw), walk_pose(dist, WALK, **kw), k)


def along(p0, p1, u):
    p0, p1 = V(p0), V(p1)
    d = p1 - p0
    return p0 + d * u, math.atan2(d.y, d.x), d.length * u


def head_world(cat, pose):
    return cat.root @ pose["head"].translation


def look_at(cat_pos, heading, target, eye_h=0.72, max_yaw=1.3):
    """Yaw and pitch (in cat space) for the head to face a world point."""
    d = V(target) - V((cat_pos[0], cat_pos[1], cat_pos[2] if len(cat_pos) > 2 else 0)) - V((0, 0, eye_h))
    yaw = math.atan2(d.y, d.x) - heading
    yaw = (yaw + PI) % (2 * PI) - PI
    pitch = math.atan2(d.z, math.hypot(d.x, d.y))
    return clamp(yaw, -max_yaw, max_yaw), clamp(pitch, -0.7, 0.9)


# ================================================================ 1 morning

HIGH_CAM = (V((0.1, -2.9, 4.6)), V((0.1, 0.05, 0.0)))
LOW_CAM = (V((0.0, -4.3, 0.8)), V((0.1, 0.3, 0.66)))
END_CAM = (V((0.1, -2.5, 3.6)), V((0.1, -0.05, 0.0)))   # the last frame: the opening angle, closer
SPOT = V((0.1, 0.3, 0.0))            # where the light falls, and where Sunny sits


def _living(night):
    S.living_room(night)
    cat = Cat("sunny")
    cam = camera(50, 0.9)
    return dict(cat=cat, cam=cam)


class Morning:
    id, dur = "morning", 8.0

    def build(self):
        st = _living(False)
        d = (0.5, -0.55, -0.68)
        S.sun(d, 8.5, "#ffdca6", angle=0.02, shaft=5.0)
        S.gobo(SPOT + V((0.0, 0.1, 0)), d, w=1.7, h=2.0)
        for o in bpy.data.objects:
            if o.name.startswith("wall"):
                o.visible_shadow = False
        S.world("#ecdcc8", 0.46)
        S.area((2, -6, 5), (0, 0, 0.5), 420, "#dfe8ff", 6).data.volume_factor = 0.0
        S.haze((15, 13, 6.8), (0, 0.4, 3.4), 0.008)
        return st

    def frame(self, st, t):
        cat, cam = st["cat"], st["cam"]
        p0, p1 = (3.5, 2.5, 0.07), (SPOT.x + 0.05, SPOT.y, 0.07)
        u = ease_out(span(t, 1.0, 4.3)) * 0.999
        pos, h0, dist = along(p0, p1, u)
        walk = move_pose(dist, ease(span(t, 3.2, 3.9)), look=(0.15, 0.05))
        h1 = -PI / 2 + 0.22
        k = ease(span(t, 4.2, 5.0))
        look = (0.0, 0.08)
        if t > 5.0:
            y = 0.75 * ease(span(t, 5.2, 5.6)) - 1.5 * ease(span(t, 6.1, 6.6)) + 0.55 * ease(span(t, 7.0, 7.35))
            look = (y, 0.08 + 0.1 * ease(span(t, 7.0, 7.4)))
        sit = A.sit(look=look, tall=0.6 + 0.4 * ease(span(t, 5.0, 5.4)), eyes=blink(t, 7.55), pupil=0.55)
        cat.place(pos, lerp(h0, h1 - 2 * PI, k) if False else h0 + ((h1 - h0 + PI) % (2 * PI) - PI) * k)
        cat.apply_pose(blend(walk, sit, k))
        c = ease(span(t, 1.4, 4.4))
        cp = HIGH_CAM[0].lerp(LOW_CAM[0], c)
        ct = HIGH_CAM[1].lerp(LOW_CAM[1], c)
        aim(cam, cp, ct, focus=SPOT + V((0, 0, 0.5 * c)))


# ================================================================ 2 hello

class Hello:
    id, dur = "hello", 5.0

    def build(self):
        st = Morning().build()
        st["cam"].data.lens = 35
        st["cam"].data.clip_start = 0.004
        st["cam"].data.dof.aperture_fstop = 1.4
        return st

    def frame(self, st, t):
        cat, cam = st["cat"], st["cam"]
        cam_pos = V((0.1, -3.5, 0.74))
        y_end = cam_pos.y + 0.76
        h = -PI / 2
        k = ease(span(t, 0.2, 0.8))
        u = span(t, 0.7, 4.1)
        u = u * u * (3 - 2 * u) * 0.5 + u * 0.5
        y = lerp(SPOT.y, y_end, u)
        x = lerp(SPOT.x + 0.05, 0.0, ease(u))
        dist = SPOT.y - y
        walk = walk_pose(dist, look=(0, 0.05))
        walk["pupil"] = 0.55 + 0.4 * span(t, 3.2, 4.3)
        walk["eyes"] = blink(t, 1.6)
        sit = A.sit(look=(0, 0.1), eyes=1.0)
        cat.place((x, y, 0.07), h)
        pose = blend(sit, walk, k)
        cat.apply_pose(pose)
        hw = head_world(cat, pose)
        d = V((0.72, 0.5, 0.1)).normalized()
        eye = cat.root @ pose["head"] @ (d * 0.185)
        k_eye = ease(span(t, 2.6, 3.9))
        target = V((0.1, 0.0, 0.64)).lerp(eye, k_eye)
        aim(cam, cam_pos + V((0, 0, -0.04 * (1 - u))), target, focus=(hw + V((0, -0.17, 0))).lerp(eye + V((0, -0.03, 0)), k_eye))


# ================================================================ 3 throw

HAND = V((0.55, -0.4, 3.7))


def _mouse_path(t):
    """The toy: dangled, thrown, landed, slid."""
    dangle = V((0.25 + 0.12 * math.sin(t * 5.0), 0.75 + 0.06 * math.cos(t * 3.7), 1.75 + 0.1 * math.sin(t * 7.0)))
    if t < 1.05:
        return dangle
    a, b = V((0.3, 0.8, 1.8)), V((-0.9, 5.6, 0.09))
    if t < 1.95:
        u = (t - 1.05) / 0.9
        p = a.lerp(b, u)
        p.z = lerp(a.z, b.z, u) + 2.6 * 4 * u * (1 - u) * 0.5
        return p
    u = ease_out(span(t, 1.95, 2.6))
    return V((b.x - 0.2 * u, b.y + 0.9 * u, 0.09))


def _ribbon_pts(n, t, release=1.05, lag=0.55):
    m = _mouse_path(t)
    free = ease(span(t, release, release + 0.35))
    pts = []
    for i in range(n):
        s = i / (n - 1)
        held = m.lerp(HAND, s) + V((0.12 * math.sin(s * PI) * math.sin(t * 4), 0, -0.25 * math.sin(s * PI)))
        q = _mouse_path(max(t - s * lag, release - 0.02 if t > release else 0))
        q = V((q.x + 0.1 * math.sin(s * 9 + t * 3) * s, q.y, max(0.02, q.z - s * 1.2 * (0.4 + free))))
        pts.append(held.lerp(q, free))
    return pts


class Throw:
    id, dur = "throw", 5.0

    def build(self):
        S.play_floor()
        st = dict(cat=Cat("sunny"), cam=camera(24, 2.0), mouse=S.toy_mouse(), rib=S.Ribbon(36))
        S.socks(0.0, -0.1, legs=False, k=0.85)
        S.sun((-0.35, 0.3, -0.85), 3.2, "#fff6e8", angle=0.25)
        S.world("#f4f1ec", 1.0)
        S.area((-6, 2, 7), (0, 5, 0), 900, "#ffffff", 8)
        return st

    def frame(self, st, t):
        cat, cam, mouse = st["cat"], st["cam"], st["mouse"]
        m = _mouse_path(t)
        start = V((0.25, 1.7, 0))
        land = V((-1.1, 6.5, 0))
        stop = land + V((0.1, -0.62, 0))
        pos, hrun, dist = along(start, stop, ease_in(span(t, 1.35, 1.6)) * 0.12 + 0.88 * span(t, 1.55, 3.0))
        h_sit = -PI / 2
        turn = ease(span(t, 1.05, 1.45))
        heading = h_sit + ((hrun - h_sit + PI) % (2 * PI) - PI) * turn
        yaw, pitch = look_at(pos, heading, m)
        sit = A.sit(look=(yaw * 0.9, pitch), pupil=0.9, tall=1.0)
        cr = A.crouch(look=(yaw * 0.5, pitch * 0.5))
        run = A.gallop(dist / RUN_PER, look=(0, 0))
        pose = blend(sit, cr, ease(span(t, 1.0, 1.25)))
        pose = blend(pose, run, ease(span(t, 1.35, 1.6)))
        grab = ease(span(t, 2.9, 3.25))
        down = A.crouch(look=(0, -0.5), depth=0.7)
        pose = blend(pose, down, grab)
        # mouse in the mouth; turn to look back at us
        back = ease(span(t, 3.5, 4.3))
        heading2 = heading + (-2.6) * back
        st_pose = A.stand(look=(0.25 * back, 0.12), tail=None, pupil=0.8)
        st_pose["eyes"] = blink(t, 4.55)
        pose = blend(pose, st_pose, ease(span(t, 3.3, 3.7)))
        cat.place((pos.x, pos.y, 0), heading2 if t > 3.5 else heading)
        cat.apply_pose(pose)
        if t > 3.2:
            mw = cat.root @ pose["head"] @ V((0.27, 0, -0.1))
            k = ease(span(t, 3.2, 3.35))
            mouse.matrix_world = Matrix.Translation(m.lerp(mw, k)) @ Matrix.Rotation(heading2 + PI / 2, 4, "Z")
            pts = _ribbon_pts(36, 3.2)
            off = mouse.matrix_world.translation - pts[0]
            n = len(pts)
            pts = [p + off * (1 - i / (n - 1)) ** 2 for i, p in enumerate(pts)]
            for i, p in enumerate(pts):
                p.z = max(0.02, p.z) if i > 4 else p.z
            st["rib"].set(pts)
        else:
            spin = t * 9.0 if 1.05 < t < 1.95 else 0.0
            mouse.matrix_world = Matrix.Translation(m) @ Matrix.Rotation(1.3 + spin, 4, "Z") @ Matrix.Rotation(0.6 if t < 1.05 else spin, 4, "Y")
            st["rib"].set(_ribbon_pts(36, t))
        hw = head_world(cat, pose)
        fol = ease(span(t, 1.2, 3.2))
        aim(cam, (0.05, -0.9, 3.5), V((0.1, 1.5, 0.3)).lerp(V((-0.9, 6.0, 0.45)), fol), focus=hw)
        cam.data.lens = lerp(24, 80, ease(span(t, 1.6, 3.4)))


# ================================================================ 4 fetch

class Fetch:
    id, dur = "fetch", 7.0

    def build(self):
        S.play_floor()
        st = dict(cat=Cat("sunny"), cam=camera(38, 1.4), mouse=S.toy_mouse(), rib=S.Ribbon(36))
        S.socks(-0.1, 0.1)
        S.sun((-0.35, 0.3, -0.85), 3.2, "#fff6e8", angle=0.25)
        S.world("#f4f1ec", 1.0)
        S.area((-6, 2, 7), (0, 5, 0), 900, "#ffffff", 8)
        return st

    def frame(self, st, t):
        cat, cam, mouse = st["cat"], st["cam"], st["mouse"]
        p0, p1 = V((-1.0, 6.4, 0)), V((0.05, 1.75, 0))
        u = span(t, 0.2, 3.3)
        u = 1 - (1 - u) ** 1.5
        pos, h, dist = along(p0, p1, u)
        trot = walk_pose(dist, TROT, look=(0, 0.22), head_up=0.05)
        trot["tail"] = A.tail_for(trot["hips"], 1.35, 0.06, sway=0.1 * math.sin(dist * 9))
        k_sit = ease(span(t, 3.9, 4.6))
        drop = ease(span(t, 3.3, 3.75))
        up = ease(span(t, 4.5, 5.1))
        tilt_head = 0.32 * ease(span(t, 5.9, 6.2))
        stand_low = A.stand(look=(0, -0.55), pupil=0.7)
        sit = A.sit(look=(0.12, 0.25 + 0.4 * up), tall=0.5 + 0.5 * up, pupil=0.85)
        sit["head"] = sit["head"] @ rot("X", tilt_head)
        sit["eyes"] = blink(t, 5.35, 0.45)
        pose = blend(trot, stand_low, drop)
        pose = blend(pose, sit, k_sit)
        hh = h + ((-PI / 2 - h + PI) % (2 * PI) - PI) * ease(span(t, 3.0, 4.2))
        cat.place(pos, hh)
        cat.apply_pose(pose)
        mouth = cat.root @ pose["head"] @ V((0.27, 0, -0.1))
        floor_at = V((0.02, 0.98, 0.09))
        fall = ease_in(span(t, 3.7, 3.95))
        mp = mouth.lerp(floor_at, fall)
        mouse.matrix_world = Matrix.Translation(mp) @ Matrix.Rotation(hh + PI / 2 + 0.5 * fall, 4, "Z")
        # the ribbon trails back along the way Sunny came
        pts = []
        n = 36
        for i in range(n):
            s = i / (n - 1)
            back = max(0.0, dist - s * 2.6)
            q = p0 + (p1 - p0).normalized() * back
            q = q + V((0.16 * math.sin(back * 2.3) * s, 0, 0))
            q.z = 0.02
            lift = (1 - s) ** 6
            pts.append(q.lerp(mp, lift))
        st["rib"].set(pts)
        hw = head_world(cat, pose)
        aim(cam, (2.7, -1.0, 0.95), (-0.15, 1.5, 0.62 + 0.1 * up), focus=hw)


# ================================================================ 5 feather

def _feather(t, top):
    z = top
    keys = [(0.0, (1.5, 0.3, z + 1.9)), (1.5, (1.4, 0.3, z + 1.75)), (2.0, (1.9, 0.3, z + 3.3)), (2.9, (0.6, 0.3, z + 2.9)),
            (3.6, (-2.1, 0.3, z + 2.0)), (4.5, (-2.2, 0.3, z + 2.05)), (5.0, (-2.6, 0.3, z + 2.75)), (5.25, (-2.75, 0.3, z + 2.6))]
    for (ta, a), (tb, b) in zip(keys, keys[1:]):
        if t <= tb:
            p = V(a).lerp(V(b), ease(span(t, ta, tb)))
            break
    else:
        p = V(keys[-1][1])
    p += V((0.1 * math.sin(t * 6.1), 0, 0.07 * math.sin(t * 8.3)))
    return p


def _leap(t, t0, t1, height, pitch_dir=1.0, twist=1.0):
    """Returns (z offset, pose, tilt) for a leap between t0 and t1."""
    u = span(t, t0, t1)
    z = 4 * height * u * (1 - u)
    pitch = lerp(1.05, -0.35, ease(u))
    pose, _ = A.airborne(stretch=math.sin(u * PI) ** 0.7, twist=twist * math.sin(u * PI) * 1.1, tuck=ease(span(u, 0.7, 1.0)) * 0.6,
                         reach=ease(span(u, 0.0, 0.45)) * (1 - ease(span(u, 0.75, 1.0))), look=(0, 0.2))
    c = V((0, 0, 0.47))
    tilt = Matrix.Translation(c) @ rot("Y", -pitch) @ Matrix.Translation(-c)
    return z, pose, tilt


class Feather:
    id, dur = "feather", 9.0

    def build(self):
        bed = S.bedroom()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = bed.evaluated_get(dg)
        mw = ev.matrix_world
        top = max((mw @ v.co).z for v in ev.data.vertices if abs((mw @ v.co).x) < 2.5 and abs((mw @ v.co).y - 0.3) < 1.0)
        st = dict(cat=Cat("sunny"), cam=camera(58, 1.2), top=top - 0.03)
        st["rod"] = S.cyl(0.018, 1.0, (0, 0, 0), S.mat("#2a2a2e", rough=0.4), name="rod", seg=8)
        st["string"] = S.Ribbon(8, width=0.012, color="#3a3a3e")
        f = S.link(bpy.data.objects.new("feather", None))
        for i, (c, a) in enumerate((("#f4efe6", 0.0), ("#e98aa0", 0.5), ("#f4efe6", -0.5), ("#8fb6e0", 0.9))):
            b = S.ball(0.17, (0, 0, -0.2), S.mat(c, sheen=0.6), scale=(0.55, 0.12, 2.0), rot=(0, a, 0.4 * i), name="plume")
            b.parent = f
        st["feather"] = f
        S.sun((0.35, 0.55, -0.75), 2.6, "#fff4e2", angle=0.3)
        S.world("#f3efe9", 0.7)
        S.area((-6, -6, 9), (0, 0, 2.5), 1300, "#fff8ee", 9)
        return st

    def frame(self, st, t):
        cat, cam, top = st["cat"], st["cam"], st["top"]
        F = _feather(t, top)
        x = lerp(-0.5, 0.45, ease(span(t, 1.6, 2.5)))
        x = lerp(x, -0.9, ease(span(t, 4.4, 5.5)))
        heading = PI * ease(span(t, 2.55, 3.1))
        tilt = None
        z = 0.0
        wig = math.sin(t * 22) * 0.07
        yaw, pitch = look_at((x, 0.3, top), heading, F)
        if t < 1.6:
            pose = A.crouch(wiggle=wig * span(t, 0.5, 1.5), look=(yaw, pitch), depth=0.6 + 0.4 * span(t, 0, 1.4))
        elif t < 2.5:
            z, pose, tilt = _leap(t, 1.6, 2.5, 1.25, twist=0.7)
        elif t < 4.4:
            land = A.crouch(look=(yaw, pitch), depth=1.15 - 0.35 * ease(span(t, 2.5, 2.9)))
            pose = A.crouch(wiggle=wig * span(t, 3.5, 4.3), look=(yaw, pitch), depth=0.75 + 0.25 * span(t, 3.4, 4.4))
            pose = blend(land, pose, ease(span(t, 2.8, 3.3)))
        elif t < 5.5:
            z, pose, tilt = _leap(t, 4.4, 5.5, 1.85, twist=-1.0)
        else:
            land = A.crouch(look=(0.2, -0.3), depth=1.1)
            sit = A.sit(look=(-0.9 * ease(span(t, 7.0, 7.5)), -0.25 + 0.3 * ease(span(t, 7.0, 7.5))), pupil=0.8)
            sit["eyes"] = blink(t, 8.0, 0.3)
            pose = blend(land, sit, ease(span(t, 5.9, 6.6)))
            heading = PI + 0.5 * ease(span(t, 5.9, 6.6))
        cat.place((x, 0.3, top + z), heading, tilt)
        cat.apply_pose(pose)
        if t > 5.0:                     # caught: the feather rides on the front paws, then lies on the bed
            paws = cat.root @ ((pose["feet"]["fl"] + pose["feet"]["fr"]) / 2) + V((0, -0.05, 0.08))
            rest = V((-1.35, 0.1, top + 0.06))
            F = F.lerp(paws, ease(span(t, 5.0, 5.2))).lerp(rest, ease(span(t, 5.5, 5.9)))
        st["feather"].matrix_world = Matrix.Translation(F) @ rot("Y", 0.6 * math.sin(t * 5) + (1.4 if t > 5.6 else 0))
        slack = ease(span(t, 5.0, 5.6))
        tip = V((F.x + (2.2 if t < 2.9 else lerp(2.2, 1.6, ease(span(t, 2.9, 3.6)))), 0.3, F.z + 1.6 + 0.2 * math.sin(t * 5)))
        tip = tip.lerp(V((0.2, 0.3, top + 3.2)), slack)
        base = V((7.0, 0.1, top + 3.4))
        rod = st["rod"]
        d = tip - base
        rod.matrix_world = Matrix.Translation((tip + base) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4() @ Matrix.Diagonal((1, 1, d.length, 1))
        st["string"].set([tip.lerp(F, i / 7) + V((0, 0, -0.5 * slack * math.sin(i / 7 * PI))) for i in range(8)])
        aim(cam, (-0.4, -7.6, top + 1.1), (-0.85, 0.3, top + 1.45), focus=(x, 0.3, top + 0.5))


# ================================================================ 6 hallway

class Hallway:
    id, dur = "hallway", 8.0

    def build(self):
        S.hallway()
        st = dict(cat=Cat("sunny"), grey=Cat("grey", grey=True, scale=1.08), cam=camera(35, 1.6))
        S.world("#8a786a", 0.8)
        S.haze((5.0, 44, 8.9), (0, 20, 4.5), 0.012)
        return st

    def frame(self, st, t):
        cat, grey, cam = st["cat"], st["grey"], st["cam"]
        a, b, c = V((0.5, 0.2, 0)), V((0.1, 5.6, 0)), V((-0.35, 7.55, 0))
        u1 = span(t, 0.0, 1.5)
        u1 = 1 - (1 - u1) ** 1.5
        u2 = ease_out(span(t, 1.5, 3.6))
        pos, h, d1 = along(a, b, u1)
        run = A.gallop(d1 / RUN_PER + 0.2)
        if t > 1.5:
            pos, h, d2 = along(b, c, u2 * 0.999)
            walk = move_pose(d2, ease(span(u2, 0.45, 0.75)), look=(0.3, 0.05))
            pose = blend(run, walk, ease(span(t, 1.5, 1.8)))
        else:
            pose = run
        flop = ease(span(t, 3.7, 4.6))
        h_end = -PI / 2 + 0.75
        hh = h + ((h_end - h + PI) % (2 * PI) - PI) * ease(span(t, 3.3, 4.4))
        lie = A.lie(side=-1.0, look=(-0.5 + 0.9 * ease(span(t, 5.6, 6.2)), 0.1), eyes=blink(t, 6.9, 0.4), pupil=0.6)
        tip = math.sin(t * 5.0) * 0.5 * span(t, 4.8, 5.4)
        A.nub(lie, wag=0.5 * tip)
        pose = blend(pose, lie, flop)
        cat.place(pos, hh)
        cat.apply_pose(pose)
        gpos = V((-1.55, 8.75, 0))
        gh = -PI / 2 + 0.25
        gy, gp = look_at(gpos, gh, cat.root.translation + V((0, 0, 0.45 - 0.2 * flop)), eye_h=0.95)
        seen = ease(span(t, 2.2, 3.0))
        gpose = A.sit(look=(lerp(0.0, gy, seen), lerp(0.05, gp, seen)), tall=1.0, pupil=0.5, tail_wrap=-0.42, tripod=False)
        gpose["eyes"] = blink(t, 5.2, 0.3)
        grey.place(gpos, gh)
        grey.apply_pose(gpose)
        dolly = ease(span(t, 0.0, 4.2))
        aim(cam, (0.9 - 0.3 * dolly, -1.3 + 5.6 * dolly, 0.85), (-0.7, 9.0, 0.7), focus=cat.root.translation + V((0, 0, 0.4)))


# ================================================================ 7 window

class Window:
    id, dur = "window", 6.0

    def build(self):
        wins = S.window_view()
        st = dict(cat=Cat("sunny"), cam=camera(55, 2.0), wins=wins)
        st["bg"] = S.world("#8fb2d8", 1.0)
        st["sky"] = S.area((0, 20, 30), (0, 0, 0), 60000, "#9cc0ff", 30)
        st["fill"] = S.area((3, -4, 3), (-0.8, 0.5, 0.8), 260, "#ffb37a", 4)
        return st

    def frame(self, st, t):
        cat, cam = st["cat"], st["cam"]
        dusk = ease(span(t, 0.3, 5.2))
        st["bg"].inputs[1].default_value = lerp(1.0, 0.28, dusk)
        st["sky"].data.energy = lerp(60000, 9000, dusk)
        st["fill"].data.energy = lerp(120, 330, dusk)
        for m, sd, col in st["wins"]:
            on = ease(span(t, 0.8 + sd * 0.26, 0.8 + sd * 0.26 + 0.25)) if sd % 3 == 0 else 0.0
            b = m.node_tree.nodes.get("Principled BSDF") or [n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"][0]
            b.inputs["Emission Color"].default_value = S.lin(col)
            b.inputs["Emission Strength"].default_value = 1.0 * on
        yaw = 0.45 * ease(span(t, 2.3, 2.8)) - 0.8 * ease(span(t, 4.0, 4.6))
        pose = A.sit(look=(yaw, 0.22), tall=0.8, tail_wrap=0.3)
        tw = max(0.0, math.sin((t - 1.4) * 14)) * (1 if 1.4 < t < 1.85 else 0) + max(0.0, math.sin((t - 3.3) * 14)) * (1 if 3.3 < t < 3.75 else 0)
        pose["ears"] = 0.25 * tw
        fl = max(0.0, math.sin(t * 4.2 - 1.0)) ** 3
        A.nub(pose, wag=0.7 * fl * math.sin(t * 19))
        cat.place((0.3, 0.25, 0.0), PI / 2 + 0.12)
        cat.apply_pose(pose)
        push = ease(span(t, 0.0, 6.0))
        aim(cam, (0.75 - 0.15 * push, -3.9 + 0.5 * push, 1.1), (0.9, 34, 2.6), focus=(0.3, 0.3, 0.9))


# ================================================================ 8 lamp

class Lamp:
    id, dur = "lamp", 5.0

    def build(self):
        S.lamp_room()
        st = dict(cat=Cat("sunny"), cam=camera(45, 1.6))
        S.world("#5a3fd0", 0.55)
        st["glow"] = S.point((1.5, 1.6, 2.5), 900, "#ff3a20", soft=0.3)
        S.area((-7, -5, 6), (0, 1, 1), 1500, "#7b5cff", 6)
        return st

    def frame(self, st, t):
        cat, cam = st["cat"], st["cam"]
        base = V((0.55, 1.12, 0))
        p0 = V((-1.9, 0.8, 0))
        pos, h, dist = along(p0, base, ease_out(span(t, 0.0, 1.3)) * 0.999)
        walk = walk_pose(dist, TROT, look=(0.3, 0.3))
        rise = ease(span(t, 1.2, 1.9)) * (1 - ease(span(t, 3.5, 4.1)))
        knead = math.sin(t * 9.0) * 0.045 * span(t, 1.9, 2.2)
        up = A.stretch_up(reach=0.6 + 0.4 * ease(span(t, 1.9, 2.6)), look=(0.35, 0.1))
        up["feet"]["fl"] = up["feet"]["fl"] + V((0, 0, knead))
        up["feet"]["fr"] = up["feet"]["fr"] + V((0, 0, -knead))
        h_up = PI / 2
        heading = h + ((h_up - h + PI) % (2 * PI) - PI) * ease(span(t, 1.0, 1.7))
        pose = blend(walk, up, rise)
        if t > 3.5:
            p1 = V((3.2, 0.4, 0))
            pos2, h2, d2 = along(base, p1, span(t, 3.9, 5.0) ** 1.6 * 0.999)
            off = walk_pose(d2, TROT, look=(0, 0.05))
            pose = blend(up, off, ease(span(t, 3.5, 4.1)))
            heading = h_up + ((h2 - h_up + PI) % (2 * PI) - PI) * ease(span(t, 3.6, 4.3))
            pos = pos2
        cat.place(pos, heading)
        cat.apply_pose(pose)
        st["glow"].data.energy = 900 * (1 + 0.05 * math.sin(t * 13))
        aim(cam, (-0.4, -3.5, 1.05), (0.8, 1.4, 1.2), focus=(0.6, 1.1, 1.0))


# ================================================================ 9 sunny

class Sunny:
    id, dur = "sunny", 9.5

    def build(self):
        st = _living(True)
        S.world("#1d2748", 0.5)
        st["lamp"] = S.spot((-1.4, -1.2, 7.5), SPOT + V((0, -0.15, 0)), 2600, "#ffc98a", size=0.5, blend=0.5, soft=0.25)
        S.area((6, 2, 6), (0, 0.5, 0), 500, "#5a78d8", 6).data.volume_factor = 0.0
        S.haze((15, 13, 6.8), (0, 0.4, 3.4), 0.02, "#ffe6c4")
        st["sig"] = S.Signature("sunny · claude fable 5.2 · 2026", (-0.81, -0.78, 0.08), scale=0.0175, color="#c44a34", thick=0.013)
        return st

    def frame(self, st, t):
        cat, cam = st["cat"], st["cam"]
        p0 = V((-3.6, 1.9, 0.07))
        r = 0.3
        centre = V((SPOT.x, SPOT.y + 0.05, 0.07))
        h_in = math.atan2(centre.y - p0.y, centre.x + r - p0.x)
        p1 = centre + V((r * math.cos(h_in - PI / 2), r * math.sin(h_in - PI / 2), 0))
        pos, h, dist = along(p0, p1, ease_out(span(t, 0.4, 3.0)) * 0.999)
        h_end = PI + 0.25
        sweep = (h_end - h_in) % (2 * PI)
        cu = ease(span(t, 3.0, 4.7))
        if t > 3.0:
            ang = h_in - PI / 2 + sweep * cu
            pos = centre + V((r * math.cos(ang), r * math.sin(ang), 0))
            h = h_in + sweep * cu
            dist += r * sweep * cu
        walk = move_pose(dist, ease(span(t, 2.5, 3.1)), look=(0.25 * cu, -0.25 * cu), crouch=0.02 * cu)
        down = ease(span(t, 4.6, 5.7))
        br = math.sin((t - 5.7) * 2.0)
        sleep = A.curl(breath=br if t > 5.7 else 0.0, eyes=1.0 - ease(span(t, 5.9, 6.6)))
        settle = centre.lerp(V((SPOT.x + 0.05, SPOT.y + 0.25, 0.07)), down)
        cat.place(pos.lerp(settle, down), h)
        cat.apply_pose(blend(walk, sleep, down))
        c = ease(span(t, 4.4, 7.0))
        aim(cam, LOW_CAM[0].lerp(END_CAM[0], c), LOW_CAM[1].lerp(END_CAM[1], c), focus=SPOT + V((0, 0.2, 0.5 * (1 - c))))
        st["sig"].write(span(t, 6.4, 8.2))


class FeatherLoop(Feather):
    """The share loop: one leap, ending exactly where it began. Not in the film."""
    id, dur = "loop", 4.0

    def frame(self, st, t):
        cat, cam, top = st["cat"], st["cam"], st["top"]
        w = 2 * PI / self.dur
        jerk = math.sin(span(t, 1.3, 2.6) * PI) ** 2
        F = V((1.1 + 0.12 * math.sin(w * t * 2), 0.3, top + 1.75 + 0.07 * math.sin(w * t * 3) + 1.5 * jerk))
        x = -0.35
        yaw, pitch = look_at((x, 0.3, top), 0.0, F)
        wig = math.sin(t * 22) * 0.07 * math.sin(span(t, 0.2, 1.4) * PI)
        tilt, z = None, 0.0
        if 1.4 <= t < 2.4:
            z, pose, tilt = _leap(t, 1.4, 2.4, 1.35, twist=0.8)
        else:
            depth = 0.6 + 0.4 * span(t, 0.0, 1.4) if t < 1.4 else lerp(1.15, 0.6, ease(span(t, 2.4, 3.6)))
            pose = A.crouch(wiggle=wig, look=(yaw, pitch), depth=depth)
        cat.place((x, 0.3, top + z), 0.0, tilt)
        cat.apply_pose(pose)
        st["feather"].matrix_world = Matrix.Translation(F) @ rot("Y", 0.6 * math.sin(w * t * 2))
        tip = V((F.x + 2.2, 0.3, F.z + 1.6 + 0.2 * math.sin(w * t * 2)))
        base = V((7.0, 0.1, top + 3.4))
        d = tip - base
        st["rod"].matrix_world = Matrix.Translation((tip + base) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4() @ Matrix.Diagonal((1, 1, d.length, 1))
        st["string"].set([tip.lerp(F, i / 7) for i in range(8)])
        aim(cam, (0.0, -5.9, top + 1.0), (0.05, 0.3, top + 1.3), focus=(x, 0.3, top + 0.5))


LOOP = FeatherLoop()
SCENES = [Morning(), Hello(), Throw(), Fetch(), Feather(), Hallway(), Window(), Lamp(), Sunny()]
