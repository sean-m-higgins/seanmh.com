"""Poses and gaits. Every function is pure: time in, pose out."""
import math

from mathutils import Matrix, Vector

from cat import CHEST, HEAD, HIPS, HP, PAW_Z, SH, TAIL0, TAIL_N, TAIL_SEG, body_frame

V = Vector


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in(t):
    t = clamp(t)
    return t ** 3


def span(t, a, b):
    return clamp((t - a) / (b - a))


def lerp(a, b, t):
    return a + (b - a) * t


def rot(axis, ang):
    return Matrix.Rotation(ang, 4, axis)


def tail_curve(base, back, up, side, pitches, yaws=None):
    """Chain of TAIL_N segments from `base`, starting along `back`."""
    pts = [V(base)]
    d = V(back).normalized()
    u = V(up).normalized()
    s = V(side).normalized()
    for i in range(TAIL_N):
        d = Matrix.Rotation(pitches[i] if i < len(pitches) else pitches[-1], 3, s) @ d
        if yaws:
            d = Matrix.Rotation(yaws[i] if i < len(yaws) else yaws[-1], 3, u) @ d
        pts.append(pts[-1] + d * TAIL_SEG)
    return pts


def tail_for(hips, lift=0.5, curl=0.12, sway=0.0, wrap=0.0):
    """A tail from the hips frame. lift: first-joint pitch up. curl: per joint.
    sway/wrap: per-joint yaw."""
    T = hips @ body_frame(HIPS).inverted()
    R = T.to_3x3()
    base = T @ TAIL0
    pitches = [-lift] + [-curl] * (TAIL_N - 1)   # negative about +Y lifts a -X vector
    yaws = [sway + wrap] * TAIL_N
    return tail_curve(base, R @ V((-1, 0, 0)), R @ V((0, 0, 1)), R @ V((0, 1, 0)), pitches, yaws)


def head_from(chest, yaw=0.0, pitch=0.0, roll=0.0, offset=(0, 0, 0)):
    """Head frame riding on the chest, turned by yaw (left +), pitch (up +)."""
    T = chest @ body_frame(CHEST).inverted()
    m = T @ Matrix.Translation(HEAD + V(offset)) @ rot("Z", yaw) @ rot("Y", -pitch) @ rot("X", roll)
    return m


def level(m):
    """Keep a frame's position and heading but stand it upright."""
    f = m.to_3x3() @ V((1, 0, 0))
    f.z = 0
    if f.length < 1e-5:
        f = V((1, 0, 0))
    return body_frame(m.translation, f, (0, 0, 1))


def foot_rest(leg):
    r = SH[leg[1]] if leg[0] == "f" else HP[leg[1]]
    return V((r.x + (0.02 if leg[0] == "f" else -0.02), r.y, PAW_Z))


# ---------------------------------------------------------------- poses

def stand(look=(0, 0), tail=None, bob=0.0, eyes=1.0, pupil=0.6):
    hips = body_frame(HIPS + V((0, 0, bob)))
    chest = body_frame(CHEST + V((0, 0, bob)))
    return dict(hips=hips, chest=chest, head=head_from(chest, look[0], look[1]),
                feet={k: foot_rest(k) for k in ("fl", "fr", "hl", "hr")},
                tail=tail or tail_for(hips, 0.9, 0.1), eyes=eyes, pupil=pupil)


def sit(look=(0, 0), tall=1.0, eyes=1.0, pupil=0.6, tail_wrap=0.42, lean=0.0):
    """The upright sit from the footage: haunches down, front paws planted, chest high."""
    hips = body_frame(V((-0.2, 0, 0.2)), (math.cos(0.75), 0, math.sin(0.75)), (-math.sin(0.75), 0, math.cos(0.75)))
    a = 1.12 + 0.1 * tall
    cpos = V((0.03 + lean, 0, 0.47 + 0.03 * tall))
    chest = body_frame(cpos, (math.cos(a), 0, math.sin(a)), (-math.sin(a), 0, math.cos(a)))
    T = chest @ body_frame(CHEST).inverted()
    head = Matrix.Translation(T @ (HEAD + V((0.03, 0, -0.07)))) @ rot("Z", look[0]) @ rot("Y", -look[1])
    feet = {"fl": V((0.2, 0.07, PAW_Z)), "fr": V((0.2, -0.07, PAW_Z)),
            "hl": V((0.02, 0.15, PAW_Z)), "hr": V((0.02, -0.15, PAW_Z))}
    knee = {"hl": V((0.5, 0.5, 1.0)), "hr": V((0.5, -0.5, 1.0)), "fl": V((-1, 0, 0.3)), "fr": V((-1, 0, 0.3))}
    # tail lies on the floor and wraps round to one side
    base = (hips @ body_frame(HIPS).inverted()) @ TAIL0
    base.z = max(base.z, 0.06)
    pts = [base]
    d = V((-1, 0, 0))
    for i in range(TAIL_N):
        d = Matrix.Rotation(tail_wrap, 3, "Z") @ d
        p = pts[-1] + d * TAIL_SEG
        p.z = lerp(pts[-1].z, 0.045, 0.6)
        pts.append(p)
    return dict(hips=hips, chest=chest, head=head, feet=feet, knee=knee, tail=pts, eyes=eyes, pupil=pupil)


def gait(phase, stride=0.3, lift=0.07, bob=0.012, duty=0.62, trot=False, look=(0, 0), tail=None,
         head_up=0.0, crouch=0.0, sway=0.0):
    """A walk (lateral sequence) or trot (diagonal pairs). One cycle per unit
    of phase; the cat's root should advance `stride / duty` per cycle so the
    planted feet do not slide."""
    offs = {"hl": 0.0, "fl": 0.25, "hr": 0.5, "fr": 0.75}
    if trot:
        offs = {"hl": 0.0, "fr": 0.05, "hr": 0.5, "fl": 0.55}
    feet = {}
    for leg, o in offs.items():
        p = (phase + o) % 1.0
        base = foot_rest(leg)
        if p < duty:
            x = lerp(stride / 2, -stride / 2, p / duty)
            z = 0.0
        else:
            q = (p - duty) / (1 - duty)
            x = lerp(-stride / 2, stride / 2, ease(q))
            z = math.sin(q * math.pi) * lift
        feet[leg] = base + V((x, 0, z))
    b = math.sin(phase * 4 * math.pi) * bob - crouch
    roll = math.sin(phase * 2 * math.pi) * 0.04
    yaw = math.sin(phase * 2 * math.pi + 0.6) * 0.05
    hips = body_frame(HIPS + V((0, 0, b))) @ rot("Z", -yaw) @ rot("X", roll)
    chest = body_frame(CHEST + V((0, 0, -b * 0.5))) @ rot("Z", yaw) @ rot("X", -roll * 0.6)
    head = head_from(level(chest), look[0], look[1], offset=(0, 0, head_up + math.sin(phase * 4 * math.pi + 1) * 0.008))
    t = tail or tail_for(hips, 1.0, 0.09, sway=math.sin(phase * 2 * math.pi) * 0.05 + sway)
    return dict(hips=hips, chest=chest, head=head, feet=feet, tail=t, eyes=1.0, pupil=0.6)


def gallop(phase, look=(0, 0), reach=0.3, pupil=0.9):
    """A bounding run: hind pair then front pair, the spine flexing between."""
    s = math.sin(phase * 2 * math.pi)
    c = math.cos(phase * 2 * math.pi)
    ext = s                                   # +1 stretched out, -1 gathered
    hips = body_frame(HIPS + V((0.05 - 0.05 * ext, 0, 0.03 + 0.04 * c))) @ rot("Y", 0.22 * ext)
    chest = body_frame(CHEST + V((-0.05 + 0.05 * ext, 0, 0.03 - 0.03 * c))) @ rot("Y", -0.2 * ext)
    feet = {}
    for leg in ("fl", "fr", "hl", "hr"):
        front = leg[0] == "f"
        base = foot_rest(leg)
        p = (phase + (0.0 if front else 0.45) + (0.06 if leg[1] == "l" else 0)) % 1.0
        if p < 0.35:
            x = lerp(reach, -reach, p / 0.35)
            z = 0.0
        else:
            q = (p - 0.35) / 0.65
            x = lerp(-reach, reach, ease(q))
            z = math.sin(q * math.pi) * 0.16
        feet[leg] = base + V((x + (0.04 if front else -0.02), 0, z + 0.02))
    head = head_from(level(chest), look[0], look[1] + 0.1, offset=(0.03, 0, 0.0))
    tail = tail_for(hips, 0.35 + 0.2 * c, 0.03)
    return dict(hips=hips, chest=chest, head=head, feet=feet, tail=tail, eyes=1.0, pupil=pupil, ears=0.25)


def crouch(wiggle=0.0, look=(0, 0), depth=1.0, pupil=1.0):
    """Loaded to pounce: chest low, haunches up, eyes round."""
    d = depth
    hips = body_frame(HIPS + V((0.06 * d, 0, -0.1 * d))) @ rot("Z", wiggle) @ rot("Y", -0.1 * d)
    chest = body_frame(CHEST + V((-0.03 * d, 0, -0.2 * d))) @ rot("Y", 0.12 * d)
    feet = {k: foot_rest(k) for k in ("fl", "fr", "hl", "hr")}
    feet["fl"] += V((0.07 * d, 0.02, 0))
    feet["fr"] += V((0.07 * d, -0.02, 0))
    feet["hl"] += V((0.02, 0.03 * d + wiggle * 0.1, 0))
    feet["hr"] += V((0.02, -0.03 * d + wiggle * 0.1, 0))
    head = head_from(level(chest), look[0], look[1], offset=(0.02, 0, -0.02 * d))
    tail = tail_for(hips, 0.05, 0.02, sway=wiggle * 2.0)
    knee = {"hl": V((0.6, 0.6, 1.0)), "hr": V((0.6, -0.6, 1.0))}
    return dict(hips=hips, chest=chest, head=head, feet=feet, knee=knee, tail=tail, eyes=1.0, pupil=pupil, ears=0.1)


def airborne(pitch=0.0, stretch=0.0, twist=0.0, tuck=0.0, look=(0, 0), reach=0.0):
    """Off the ground. pitch: nose up. stretch: long body. twist: chest rolls
    against the hips. reach: front paws thrown up and forward."""
    hips = body_frame(HIPS + V((-0.03 * stretch, 0, 0))) @ rot("X", -twist * 0.5)
    chest = body_frame(CHEST + V((0.05 * stretch, 0, 0.0))) @ rot("X", twist * 0.5) @ rot("Y", -0.2 * reach)
    Tc = chest @ body_frame(CHEST).inverted()
    Th = hips @ body_frame(HIPS).inverted()
    feet = {}
    for s, y in (("l", 1), ("r", -1)):
        f = SH[s] + V((lerp(0.06, 0.26, reach) - 0.1 * tuck, 0.01 * y, lerp(-0.3, 0.06, reach) + 0.12 * tuck))
        feet["f" + s] = Tc @ f
        h = HP[s] + V((lerp(-0.2, 0.0, tuck) - 0.12 * stretch, 0.0, lerp(-0.3, -0.2, tuck) + 0.04 * stretch))
        feet["h" + s] = Th @ h
    head = head_from(chest, look[0], look[1] + 0.25 * reach, offset=(0.02 * stretch, 0, 0))
    tail = tail_for(hips, -0.2 + 0.5 * tuck, 0.05 - 0.1 * stretch, sway=twist * 0.3)
    pose = dict(hips=hips, chest=chest, head=head, feet=feet, tail=tail, eyes=1.0, pupil=1.0, ears=0.15)
    return pose, rot("Y", -pitch)


def lie(side=1.0, look=(0, 0), eyes=1.0, pupil=0.5, head_down=0.0):
    """Flopped on one side, head up: the hallway flop. Use with a root tilt."""
    hips = body_frame(V((-0.24, 0, 0.17))) @ rot("X", 1.15 * side)
    chest = body_frame(V((0.22, 0, 0.19))) @ rot("X", 0.6 * side)
    Tc = chest @ body_frame(CHEST).inverted()
    Th = hips @ body_frame(HIPS).inverted()
    feet = {"fl": Tc @ (SH["l"] + V((0.2, 0, -0.22))), "fr": Tc @ (SH["r"] + V((0.24, 0, -0.2))),
            "hl": Th @ (HP["l"] + V((0.16, 0, -0.27))), "hr": Th @ (HP["r"] + V((0.2, 0, -0.25)))}
    for k in feet:
        feet[k].z = max(feet[k].z, PAW_Z)
    head = Matrix.Translation(V((0.44, -0.02 * side, 0.42 - 0.2 * head_down))) @ rot("Z", look[0]) @ rot("Y", -look[1]) @ rot("X", 0.25 * side * (1 - head_down))
    base = Th @ TAIL0
    base.z = max(base.z, 0.06)
    pts = [base]
    d = V((-1, 0, 0))
    for i in range(TAIL_N):
        d = Matrix.Rotation(0.16 * side, 3, "Z") @ d
        p = pts[-1] + d * TAIL_SEG
        p.z = lerp(pts[-1].z, 0.045, 0.6)
        pts.append(p)
    return dict(hips=hips, chest=chest, head=head, feet=feet, tail=pts, eyes=eyes, pupil=pupil)


def curl(breath=0.0, eyes=0.0):
    """Asleep: a croissant, nose to tail."""
    b = 1 + 0.035 * breath
    hips = body_frame(V((-0.16, 0.1, 0.165 * b)), (0.72, -0.7, 0), (0, 0, 1)) @ rot("X", 0.5)
    chest = body_frame(V((0.14, 0.1, 0.17 * b)), (0.6, 0.8, 0), (0, 0, 1)) @ rot("X", -0.25)
    mid = body_frame(V((0.0, -0.06, 0.18 * b)), (1, 0.05, 0), (0, 0, 1)) @ rot("X", 0.15)
    feet = {"fl": V((0.17, 0.36, PAW_Z)), "fr": V((0.09, 0.3, PAW_Z + 0.03)),
            "hl": V((-0.12, 0.34, PAW_Z)), "hr": V((-0.2, 0.3, PAW_Z + 0.02))}
    knee = {"fl": V((1, 0.3, 0.4)), "fr": V((1, 0.3, 0.4)), "hl": V((-1, 0.2, 0.5)), "hr": V((-1, 0.2, 0.5))}
    head = Matrix.Translation(V((0.13, 0.37, 0.185 + 0.004 * breath))) @ rot("Z", 2.05) @ rot("X", -0.5) @ rot("Y", 0.12)
    Th = hips @ body_frame(HIPS).inverted()
    base = Th @ TAIL0
    base.z = 0.07
    pts = [base]
    d = (Th.to_3x3() @ V((-1, 0, 0)))
    d.z = 0
    d.normalize()
    for i in range(TAIL_N):
        d = Matrix.Rotation(0.5, 3, "Z") @ d
        p = pts[-1] + d * TAIL_SEG
        p.z = 0.05
        pts.append(p)
    return dict(hips=hips, chest=chest, mid=mid, head=head, feet=feet, knee=knee, tail=pts, eyes=eyes, pupil=0.4, ears=0.1)


def stretch_up(reach=1.0, look=(0, 0)):
    """Standing on the hind legs, front paws up a post in front (+X)."""
    a = 1.25
    hips = body_frame(V((-0.02, 0, 0.36)), (math.cos(a), 0, math.sin(a)), (-math.sin(a), 0, math.cos(a)))
    a2 = 1.4
    chest = body_frame(V((0.1, 0, 0.8 + 0.04 * reach)), (math.cos(a2), 0, math.sin(a2)), (-math.sin(a2), 0, math.cos(a2)))
    feet = {"fl": V((0.3, 0.06, 1.12 + 0.1 * reach)), "fr": V((0.3, -0.06, 1.05 + 0.1 * reach)),
            "hl": V((-0.08, 0.1, PAW_Z)), "hr": V((-0.08, -0.1, PAW_Z))}
    knee = {"fl": V((0.3, 0.3, -1)), "fr": V((0.3, -0.3, -1))}
    T = chest @ body_frame(CHEST).inverted()
    head = Matrix.Translation(T @ (HEAD + V((-0.05, 0, -0.04)))) @ rot("Z", look[0]) @ rot("Y", -(0.5 + look[1]))
    tail = tail_for(hips, -1.2, -0.12)
    for p in tail:
        p.z = max(p.z, 0.05)
    return dict(hips=hips, chest=chest, head=head, feet=feet, knee=knee, tail=tail, eyes=1.0, pupil=0.8)


# ---------------------------------------------------------------- blending

def blend(a, b, t):
    """Blend two poses. Frames are blended by position and quaternion."""
    t = clamp(t)
    if t <= 0:
        return a
    if t >= 1:
        return b

    def mm(ma, mb):
        q = ma.to_quaternion().slerp(mb.to_quaternion(), t)
        m = q.to_matrix().to_4x4()
        m.translation = ma.translation.lerp(mb.translation, t)
        return m

    out = dict(hips=mm(a["hips"], b["hips"]), chest=mm(a["chest"], b["chest"]), head=mm(a["head"], b["head"]))
    if a.get("mid") is not None or b.get("mid") is not None:
        def midof(p):
            if p.get("mid") is not None:
                return p["mid"]
            q = p["hips"].to_quaternion().slerp(p["chest"].to_quaternion(), 0.5)
            m = q.to_matrix().to_4x4()
            m.translation = (p["hips"] @ V((0.24, 0, 0.02)) + p["chest"] @ V((-0.24, 0, 0.02))) / 2
            return m
        out["mid"] = mm(midof(a), midof(b))
    out["feet"] = {k: V(a["feet"][k]).lerp(V(b["feet"][k]), t) for k in a["feet"]}
    ka, kb = a.get("knee", {}), b.get("knee", {})
    if ka or kb:
        out["knee"] = {}
        for k in set(ka) | set(kb):
            da = ka.get(k, V((-1 if k[0] == "f" else 1, 0, 0.15)))
            db = kb.get(k, V((-1 if k[0] == "f" else 1, 0, 0.15)))
            out["knee"][k] = V(da).normalized().lerp(V(db).normalized(), t)
    out["tail"] = [V(p).lerp(V(q), t) for p, q in zip(a["tail"], b["tail"])]
    for k, dflt in (("eyes", 1.0), ("pupil", 0.6), ("ears", 0.0)):
        out[k] = lerp(a.get(k, dflt), b.get(k, dflt), t)
    return out


def blink(t, at, dur=0.22):
    """Eye openness multiplier for a blink starting at `at` seconds."""
    x = (t - at) / dur
    if x < 0 or x > 1:
        return 1.0
    return abs(2 * x - 1) ** 0.5
