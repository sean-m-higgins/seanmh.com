"""Rooms, props and lights. Everything is card, felt and a few lamps."""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector, noise

from cat import LOOK, lin, material

V = Vector
_mats = {}


def mat(hexstr, rough=0.9, emit=0.0, bump=0.006, scale=90.0, sheen=0.1):
    key = (hexstr, rough, emit, bump, scale)
    if key not in _mats:
        _mats[key] = material("m" + hexstr, lin(hexstr), rough=rough, emit=emit, bump=bump, scale=scale, sheen=sheen)
    return _mats[key]


def wood(hexstr, along="Y", rough=0.36):
    """Floorboards: grain running along the planks, and enough polish to hold a soft reflection."""
    key = ("wood", hexstr, along, rough)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new("wood" + hexstr)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (26, 0.9, 1) if along == "Y" else (0.9, 26, 1)
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 1.6
    nz.inputs["Detail"].default_value = 5.0
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix")
    mx.data_type = "RGBA"
    base = lin(hexstr)
    mx.inputs[6].default_value = tuple(c * 0.8 for c in base[:3]) + (1,)
    mx.inputs[7].default_value = tuple(min(1, c * 1.12) for c in base[:3]) + (1,)
    nt.links.new(nz.outputs["Fac"], mx.inputs[0])
    nt.links.new(mx.outputs[2], bsdf.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = rough - 0.08
    rr.inputs["To Max"].default_value = rough + 0.14
    nt.links.new(nz.outputs["Fac"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], bsdf.inputs["Roughness"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    _mats[key] = m
    return m


def pile(size, loc, m, height=0.07, nub=0.006, cell=0.034, rot=(0, 0, 0), name="rug"):
    """A rug with real loops: a dense grid pushed up into nubs, over a flat base."""
    box((size[0], size[1], height * 0.6), (loc[0], loc[1], loc[2] + height * 0.3), m, bevel=0.02, rot=rot, name=name + "-base")
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    nx, ny = int(size[0] / cell * 2), int(size[1] / cell * 2)
    bmesh.ops.create_grid(bm, x_segments=nx, y_segments=ny, size=0.5)
    for v in bm.verts:
        x, y = v.co.x * (size[0] - 0.03), v.co.y * (size[1] - 0.03)
        u, w = x / cell, y / cell
        iu, iw = math.floor(u), math.floor(w)
        h = ((iu * 7349 + iw * 9151) % 97) / 97.0
        bump = (0.5 - abs(u - iu - 0.5)) * (0.5 - abs(w - iw - 0.5)) * 4
        edge = min(1.0, (0.5 - abs(v.co.x)) * 30, (0.5 - abs(v.co.y)) * 30)
        v.co = V((x, y, (bump ** 0.6) * nub * (0.55 + 0.45 * h) * max(edge, 0)))
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    ob.location = (loc[0], loc[1], loc[2] + height * 0.6)
    ob.rotation_euler = rot
    me.materials.append(m)
    return ob


def haze(size, loc, density=0.02, color="#fff3e0"):
    """Air with a little dust in it, so light through a window or from a lamp shows as a shaft."""
    ob = box(size, loc, mat("#ffffff"), bevel=0, name="haze")
    m = bpy.data.materials.new("haze")
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    vol = nt.nodes.new("ShaderNodeVolumeScatter")
    vol.inputs["Density"].default_value = density
    vol.inputs["Color"].default_value = lin(color)
    vol.inputs["Anisotropy"].default_value = 0.35
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    ob.data.materials.clear()
    ob.data.materials.append(m)
    ob.visible_shadow = False
    return ob


def reset():
    _mats.clear()
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.lights,
                 bpy.data.cameras, bpy.data.armatures):
        for b in list(coll):
            coll.remove(b)


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def box(size, loc, m, bevel=0.03, rot=(0, 0, 0), name="box", smooth=False):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = V((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bm.to_mesh(me)
    bm.free()
    ob = link(bpy.data.objects.new(name, me))
    ob.location, ob.rotation_euler = loc, rot
    me.materials.append(m if not isinstance(m, str) else mat(m))
    if bevel and LOOK["name"] != "paper":
        b = ob.modifiers.new("bevel", "BEVEL")
        b.width, b.segments = min(bevel, min(size) * 0.45), 3
        for p in me.polygons:
            p.use_smooth = True
    return ob


def ball(radius, loc, m, scale=(1, 1, 1), name="ball", rot=(0, 0, 0), seg=24):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=radius)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    ob.location, ob.scale, ob.rotation_euler = loc, scale, rot
    me.materials.append(m if not isinstance(m, str) else mat(m))
    return ob


def cyl(radius, depth, loc, m, rot=(0, 0, 0), name="cyl", seg=24, r2=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, segments=seg, radius1=radius, radius2=radius if r2 is None else r2, depth=depth, cap_ends=True)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = len(p.vertices) == 4
    ob = link(bpy.data.objects.new(name, me))
    ob.location, ob.rotation_euler = loc, rot
    me.materials.append(m if not isinstance(m, str) else mat(m))
    return ob


def soft(size, loc, m, rot=(0, 0, 0), name="soft", wrinkle=0.0, seed=0.0):
    """A cushion: a subdivided cube, optionally wrinkled."""
    ob = box(size, loc, m, bevel=0, rot=rot, name=name)
    sub = ob.modifiers.new("sub", "SUBSURF")
    sub.levels = sub.render_levels = 4 if wrinkle else 3
    for p in ob.data.polygons:
        p.use_smooth = True
    if wrinkle:
        bpy.context.view_layer.objects.active = ob
        for o in bpy.context.selected_objects:
            o.select_set(False)
        ob.select_set(True)
        # keep the cube's corners from collapsing into a sphere
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=3, use_grid_fill=True)
        bm.to_mesh(ob.data)
        bm.free()
        bpy.ops.object.modifier_apply(modifier="sub")
        for v in ob.data.vertices:
            n = noise.noise(V((v.co.x * 1.3 + seed, v.co.y * 1.3, v.co.z * 2.0)))
            n += 0.5 * noise.noise(V((v.co.x * 3.1, v.co.y * 3.1 + seed, v.co.z)))
            v.co += v.normal * n * wrinkle
        for p in ob.data.polygons:
            p.use_smooth = True
    return ob


def sun(direction, energy=4.0, color="#fff1d6", angle=0.03, shaft=1.0):
    li = bpy.data.lights.new("sun", "SUN")
    li.energy, li.color, li.angle = energy, lin(color)[:3], angle
    li.volume_factor = shaft
    ob = link(bpy.data.objects.new("sun", li))
    ob.rotation_euler = V(direction).normalized().to_track_quat("-Z", "Y").to_euler()
    return ob


def area(loc, target, energy, color="#ffffff", size=3.0):
    li = bpy.data.lights.new("area", "AREA")
    li.energy, li.color, li.size = energy, lin(color)[:3], size
    ob = link(bpy.data.objects.new("area", li))
    ob.location = loc
    ob.rotation_euler = (V(target) - V(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


def spot(loc, target, energy, color="#ffd9a0", size=1.0, blend=0.4, soft=0.1):
    li = bpy.data.lights.new("spot", "SPOT")
    li.energy, li.color, li.spot_size, li.spot_blend, li.shadow_soft_size = energy, lin(color)[:3], size, blend, soft
    ob = link(bpy.data.objects.new("spot", li))
    ob.location = loc
    ob.rotation_euler = (V(target) - V(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


def point(loc, energy, color="#ffffff", soft=0.15):
    li = bpy.data.lights.new("point", "POINT")
    li.energy, li.color, li.shadow_soft_size = energy, lin(color)[:3], soft
    ob = link(bpy.data.objects.new("point", li))
    ob.location = loc
    return ob


def world(color, strength):
    w = bpy.context.scene.world or bpy.data.worlds.new("world")
    bpy.context.scene.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = lin(color)
    bg.inputs[1].default_value = strength
    return bg


def gobo(patch, direction, w=1.5, h=1.9, dist=9.0, bars=(2, 2), bar=0.07):
    """An off-camera card with a window cut in it, between the sun and
    `patch`, so the sun lands as a window-shaped patch of light."""
    d = V(direction).normalized()
    c = V(patch) - d * dist
    yaw = math.atan2(d.y, d.x) - math.pi / 2
    R = Matrix.Rotation(yaw, 4, "Z")
    black = mat("#201c1a", bump=0)
    S = 14.0

    def card(sx, sz, ox, oz):
        b = box((sx, 0.02, sz), c + (R @ V((ox, 0, oz))), black, bevel=0, rot=(0, 0, yaw), name="gobo")
        b.visible_camera = False
        return b

    card(S, S, -(S + w) / 2, 0)
    card(S, S, (S + w) / 2, 0)
    card(w, S, 0, (S + h) / 2)
    card(w, S, 0, -(S + h) / 2)
    for i in range(1, bars[0]):
        card(bar, h, -w / 2 + w * i / bars[0], 0)
    for j in range(1, bars[1]):
        card(w, bar, 0, -h / 2 + h * j / bars[1])


# ---------------------------------------------------------------- rooms

def living_room(night=False):
    """The rug room of scenes 1, 2 and 9. The camera looks along +Y."""
    box((16, 14, 0.2), (0, 1, -0.1), wood("#c9ad86"), bevel=0, name="floor")
    for i in range(-8, 9):                                   # plank joints
        box((0.012, 14, 0.004), (i * 0.9 + 0.2, 1, 0.001), mat("#b89f7c", bump=0), bevel=0)
    rug = pile((6.4, 4.6), (0.1, 0.5, 0.0), mat("#f1ebe0", rough=1.0, bump=0.01, scale=160, sheen=0.6))
    box((16, 0.2, 7), (0, 6.0, 3.5), mat("#eee3d3", bump=0.004, scale=30), bevel=0, name="wall")
    box((16, 0.06, 0.28), (0, 5.88, 0.14), mat("#f7f3ec"), bevel=0.01)
    # couch end, left
    soft((2.2, 3.6, 1.15), (-4.6, 1.4, 0.72), mat("#d8cfc2", bump=0.01, scale=60, sheen=0.4))
    soft((2.0, 3.2, 0.5), (-4.5, 1.5, 1.5), mat("#ddd5c9", bump=0.01, scale=60, sheen=0.4))
    ball(0.75, (-3.25, 0.2, 0.72), mat("#2b2a2e", rough=0.7), scale=(0.5, 0.85, 0.98), name="bag")
    # low shelf with books, right
    shelf = mat("#e3d2b4", rough=0.7, bump=0.002)
    box((3.4, 1.0, 0.08), (4.3, 3.4, 1.5), shelf)
    box((3.4, 1.0, 0.08), (4.3, 3.4, 0.12), shelf)
    box((0.08, 1.0, 1.46), (2.62, 3.4, 0.8), shelf)
    for i, (c, hh) in enumerate((("#c9573f", 1.0), ("#3d5a80", 1.15), ("#e0b84e", 0.95), ("#5c8a6a", 1.1), ("#e8dfd0", 1.0), ("#7a5ca8", 1.2))):
        box((0.16, 0.7, hh), (3.0 + i * 0.19, 3.4, 0.16 + hh / 2), mat(c), bevel=0.01, rot=(0, 0.03 * (i % 3 - 1), 0))
    # a stool, back
    pine = mat("#e9c9a8", rough=0.7, bump=0.002)
    box((1.1, 1.1, 0.08), (1.4, 4.6, 1.9), pine)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.09, 0.09, 1.9), (1.4 + sx * 0.45, 4.6 + sy * 0.45, 0.95), pine)
    box((1.0, 0.06, 0.06), (1.4, 4.15, 0.7), pine)
    return rug


def play_floor():
    """Scenes 3 and 4: a pale wood floor, a bed far off, a desk chair leg."""
    box((30, 30, 0.2), (0, 6, -0.1), wood("#c9ad86"), bevel=0, name="floor")
    for i in range(-16, 17):
        box((0.014, 30, 0.004), (i * 0.95, 6, 0.001), mat("#b0946e", bump=0), bevel=0)
    box((30, 0.2, 9), (0, 15, 4.5), mat("#efeae2"), bevel=0)
    # the bed, far end
    box((7, 4.4, 0.5), (-3.5, 12.4, 0.55), mat("#b9a98f"), bevel=0.05)
    soft((6.8, 4.2, 0.9), (-3.5, 12.4, 1.2), mat("#b7bed0", sheen=0.4), wrinkle=0.05)
    # rug, left
    pile((5, 6.5), (-6.6, 4.0, 0.0), mat("#eee7da", rough=1, bump=0.01, scale=160, sheen=0.6), rot=(0, 0, 0.12))
    # desk chair: five-star base and post
    blk = mat("#26262a", rough=0.5)
    cyl(0.09, 1.3, (5.2, 7.5, 0.95), blk)
    for k in range(5):
        a = k * math.tau / 5 + 0.3
        box((1.3, 0.12, 0.1), (5.2 + math.cos(a) * 0.65, 7.5 + math.sin(a) * 0.65, 0.28), blk, rot=(0, 0.12, a))
        ball(0.11, (5.2 + math.cos(a) * 1.25, 7.5 + math.sin(a) * 1.25, 0.11), blk)
    soft((2.2, 2.2, 0.3), (5.2, 7.5, 1.7), blk)


def socks(x=0.0, y=0.0, heading=math.pi / 2, k=0.62, legs=True):
    """Sean, as far as the film shows: two purple socks and trouser cuffs."""
    obs = []
    purple = mat("#6b3fa0", bump=0.012, scale=120, sheen=0.5)
    cuff = mat("#3a3d4a", bump=0.01, scale=80, sheen=0.3)
    R = Matrix.Rotation(heading, 4, "Z")
    for s in (-1, 1):
        base = V((x, y, 0)) + (R @ V((0, s * 0.42 * k, 0)))
        foot = ball(0.3 * k, base + (R @ V((0.25 * k, 0, 0.2 * k))), purple, scale=(1.75, 0.72, 0.62), rot=(0, 0, heading + 0.12 * s), name="sock")
        ankle = cyl(0.17 * k, 1.2 * k, base + (R @ V((-0.12 * k, 0, 0.75 * k))), purple, name="sock")
        obs += [foot, ankle]
        if legs:
            obs.append(cyl(0.27 * k, 5.0 * k, base + (R @ V((-0.14 * k, 0, 3.6 * k))), cuff, r2=0.36 * k, name="sock"))
    return obs


def toy_mouse():
    """A striped toy mouse. Returns its root empty; children ride along."""
    root = link(bpy.data.objects.new("mouse", None))
    b = ball(0.085, (0, 0, 0), mat("#f2efe8", sheen=0.4), scale=(1.5, 1, 0.95), name="mouse-body")
    b.parent = root
    for i, x in enumerate((-0.07, -0.01, 0.05)):
        r = ball(0.087, (x, 0, 0), mat("#222226", sheen=0.4), scale=(0.16, 1.0 - 0.1 * abs(i - 1), 0.95 - 0.1 * abs(i - 1)), name="mouse-stripe")
        r.parent = root
    for s in (-1, 1):
        e = ball(0.035, (0.07, 0.05 * s, 0.06), mat("#e9a0a0"), scale=(0.4, 1, 1), name="mouse-ear")
        e.parent = root
    f = ball(0.05, (-0.16, 0, 0.01), mat("#e8743a", sheen=0.5), scale=(1.4, 0.5, 0.3), name="mouse-feather")
    f.parent = root
    return root


class Ribbon:
    """A flat ribbon through a list of points, rebuilt each frame."""

    def __init__(self, n=40, width=0.07, color="#f6f3ec"):
        cu = bpy.data.curves.new("ribbon", "CURVE")
        cu.dimensions = "3D"
        cu.extrude = width / 2
        cu.bevel_depth = 0.004
        cu.twist_mode = "Z_UP"
        sp = cu.splines.new("NURBS")
        sp.points.add(n - 1)
        sp.use_endpoint_u = True
        sp.order_u = 4
        cu.resolution_u = 4
        self.sp = sp
        self.ob = link(bpy.data.objects.new("ribbon", cu))
        cu.materials.append(mat(color, sheen=0.3, bump=0))
        self.n = n

    def set(self, pts):
        for p, q in zip(self.sp.points, pts):
            p.co = (q[0], q[1], q[2], 1.0)
            p.tilt = math.pi / 2


def bedroom():
    """Scene 5: the bed under the red painting. Camera looks along +Y."""
    box((20, 14, 0.2), (0, 2, -0.1), wood("#cdb692", along="X"), bevel=0)
    box((20, 0.2, 12), (0, 4.2, 6), mat("#f2efe9"), bevel=0, name="wall")
    box((9.4, 6.4, 0.55), (0, 0.6, 0.45), mat("#2c2f3d"), bevel=0.06)             # base
    bed = soft((9.2, 6.2, 1.5), (0, 0.6, 1.45), mat("#e2d9cc", bump=0.008, scale=50, sheen=0.5), wrinkle=0.07, seed=3.0)
    for x in (-2.3, 2.3):
        soft((3.6, 1.4, 1.5), (x, 3.2, 2.5), mat("#e6dfd6", bump=0.008, scale=50, sheen=0.5), rot=(0.35, 0, 0), wrinkle=0.05, seed=x)
    soft((2.2, 1.0, 1.1), (3.6, 2.6, 2.4), mat("#8f93a3", sheen=0.4), rot=(0.4, 0, 0.1))
    # the painting: a red-orange field in horizontal bands, one blue shape
    px, pz, pw, ph = 1.6, 6.6, 7.6, 4.8
    box((pw, 0.22, ph), (px, 4.0, pz), mat("#d6432c"), bevel=0.02)
    bands = (("#e0552d", 0.62, 0.5), ("#ea7a32", 0.45, 0.42), ("#f0933a", 0.36, 0.2), ("#e4642f", 0.24, 0.3), ("#cf3a2c", -0.05, 0.5), ("#c53030", -0.32, 0.36))
    for c, zc, hh in bands:
        box((pw - 0.02, 0.02, ph * hh * 0.5), (px, 3.885, pz + zc * ph * 0.5), mat(c, bump=0.012, scale=30), bevel=0)
    ball(0.42, (px - pw / 2 + 0.75, 3.87, pz + ph / 2 - 0.65), mat("#3f6fd0"), scale=(1.2, 0.1, 0.85), rot=(0, 0.3, 0))
    # bedside shelf
    box((1.6, 1.2, 0.08), (-6.2, 3.4, 2.5), mat("#2a2a2e"))
    box((0.1, 0.1, 0.8), (-5.6, 3.4, 2.95), mat("#2a2a2e"))
    return bed


def hallway():
    """Scene 6: a long corridor. Camera looks along +Y from y = 0."""
    L = 46.0
    box((5.0, L, 0.2), (0, L / 2 - 2, -0.1), mat("#b9a898", rough=1, bump=0.02, scale=50, sheen=0.4), bevel=0, name="carpet")
    for i in range(int(L / 0.36)):
        box((5.0, 0.12, 0.012), (0, -2 + i * 0.36, 0.004), mat("#a89887", rough=1, bump=0.02, scale=50, sheen=0.4), bevel=0)
    wallm = mat("#b3a798")
    for s in (-1, 1):
        box((0.3, L, 9), (s * 2.65, L / 2 - 2, 4.5), wallm, bevel=0)
        box((0.08, L, 0.35), (s * 2.48, L / 2 - 2, 0.175), mat("#5f574f"), bevel=0)
        for k in range(6):
            y = 3.5 + k * 6.5 + (2.2 if s > 0 else 0)
            box((0.1, 2.5, 6.4), (s * 2.5, y, 3.2), mat("#5a3a2a", rough=0.5), bevel=0.02)
            box((0.14, 2.9, 6.7), (s * 2.52, y, 3.35), mat("#3b332e"), bevel=0)
            ball(0.07, (s * 2.4, y + 0.95, 2.9), mat("#c9b27a", rough=0.3), name="knob")
    box((5.6, L, 0.2), (0, L / 2 - 2, 9.1), mat("#d9d2c8"), bevel=0)
    box((5.6, 0.3, 9), (0, L - 2, 4.5), mat("#7b7269"), bevel=0)
    lamps = []
    for k in range(7):
        y = 1.5 + k * 6.0
        cyl(0.22, 0.05, (0, y, 8.98), mat("#fff3da", emit=6.0))
        lamps.append(spot((0, y, 8.9), (0, y, 0), 2600, "#ffd7a1", size=0.95, blend=0.6, soft=0.2))
    box((0.7, 0.06, 0.3), (-1.2, 30, 8.2), mat("#e0362c", emit=5.0), bevel=0)     # an exit light, no lettering
    return lamps


def window_view():
    """Scene 7: a sill, a pane, and the building opposite. Returns the far
    windows as (object, seed) so the scene can switch them on."""
    box((14, 2.2, 0.3), (0, 0.4, -0.15), mat("#e9e3d9"), bevel=0.03, name="sill")
    frame = mat("#3b3e45", rough=0.5)
    box((14, 0.14, 0.2), (0, 1.5, 0.1), frame, bevel=0)
    for x in (-4.2, 4.2):
        box((0.22, 0.14, 12), (x, 1.5, 6), frame, bevel=0)
    wins = []
    Y = 34.0
    box((80, 0.5, 70), (0, Y + 0.6, 20), mat("#39566a", rough=0.6), bevel=0, name="facade")
    cols, rows, cw, rh = 9, 8, 5.4, 6.6
    for i in range(cols):
        for j in range(rows):
            x = (i - (cols - 1) / 2) * cw
            z = -8 + j * rh
            sd = (i * 7 + j * 13) % 17
            tone = ("#5f9db8", "#4f8ca8", "#6aa9c0", "#467f9c")[(i + 2 * j) % 4]
            m = material("win%d_%d" % (i, j), lin(tone), rough=0.25, bump=0)
            w = box((cw - 0.5, 0.1, rh - 0.6), (x, Y, z), m, bevel=0, name="win")
            if (i + j) % 3 != 1:                      # curtains, drawn to different widths
                cwid = (cw - 0.5) * (0.35 + 0.3 * ((i * 5 + j * 3) % 3) / 2)
                cm = material("cur%d_%d" % (i, j), lin("#8cc4d6"), rough=0.9, bump=0)
                c = box((cwid, 0.1, rh - 0.9), (x - (cw - 0.5) / 2 + cwid / 2, Y - 0.06, z - 0.1), cm, bevel=0, name="curtain")
                wins.append((cm, sd + 3, "#ffa64d"))
            wins.append((m, sd, "#ff9a3c"))
            box((0.16, 0.2, rh), (x + cw / 2, Y - 0.1, z), mat("#2c4252"), bevel=0)
        for j in range(rows + 1):
            pass
    for j in range(rows + 1):
        box((cols * cw, 0.24, 0.5), (0, Y - 0.12, -8 - rh / 2 + j * rh), mat("#2c4252"), bevel=0)
    return wins


def lamp_room():
    """Scene 8: a dark room, a glowing lamp on a low cabinet. Camera along +Y."""
    box((20, 14, 0.2), (0, 2, -0.1), wood("#b7a48c", along="X"), bevel=0)
    box((20, 0.2, 12), (0, 3.2, 6), mat("#e9e4dc"), bevel=0)
    box((2.6, 1.6, 1.25), (1.5, 2.3, 0.625), mat("#e3d6c4", rough=0.6), bevel=0.04, name="cabinet")
    cyl(0.34, 0.1, (1.5, 2.2, 1.3), mat("#18181b", rough=0.4))
    glow = material("lampglow", lin("#ff3b1e"), rough=0.5, emit=1.7, bump=0)
    lamp = cyl(0.13, 2.2, (1.5, 2.2, 2.45), glow, name="lamp")
    soft((3.4, 2.4, 1.2), (-4.4, 2.0, 0.7), mat("#cfc6ba", sheen=0.4), wrinkle=0.04)
    return lamp


# ---------------------------------------------------------------- the signature

GLYPH = {
    "s": [[(2.8, 2.5), (2, 3), (1, 3), (0.4, 2.4), (1, 1.6), (2.2, 1.4), (2.8, 0.7), (2, 0), (1, 0), (0.2, 0.5)]],
    "u": [[(0.3, 3), (0.3, 0.9), (0.9, 0.05), (1.7, 0.05), (2.6, 0.8), (2.6, 3), (2.6, 0)]],
    "n": [[(0.3, 3), (0.3, 0)], [(0.3, 2.1), (1, 2.9), (1.9, 3), (2.6, 2.3), (2.6, 0)]],
    "y": [[(0.3, 3), (1.5, 0.2)], [(2.7, 3), (1.5, 0.2), (0.9, -1.4), (0.2, -1.9)]],
    "c": [[(2.7, 2.5), (1.9, 3), (1, 3), (0.3, 2.2), (0.3, 0.9), (1, 0), (1.9, 0), (2.7, 0.5)]],
    "l": [[(0.5, 6), (0.5, 0.6), (1.0, 0)]],
    "a": [[(2.5, 2.3), (1.8, 3), (1, 3), (0.3, 2.2), (0.3, 0.9), (1, 0), (1.8, 0), (2.5, 0.8)], [(2.5, 3), (2.5, 0)]],
    "d": [[(2.5, 2.3), (1.8, 3), (1, 3), (0.3, 2.2), (0.3, 0.9), (1, 0), (1.8, 0), (2.5, 0.8)], [(2.5, 6), (2.5, 0)]],
    "e": [[(0.4, 1.6), (2.6, 1.6), (2.5, 2.4), (1.8, 3), (1, 3), (0.3, 2.2), (0.3, 0.9), (1, 0), (1.9, 0), (2.6, 0.5)]],
    "f": [[(2.4, 5.6), (1.8, 6), (1.2, 5.5), (1.1, 0)], [(0.2, 3), (2.2, 3)]],
    "b": [[(0.4, 6), (0.4, 0)], [(0.4, 2.2), (1.1, 3), (1.9, 3), (2.6, 2.2), (2.6, 0.9), (1.9, 0), (1.1, 0), (0.4, 0.8)]],
    "5": [[(2.5, 5), (0.6, 5), (0.4, 2.9), (1.4, 3.3), (2.3, 2.9), (2.7, 1.8), (2.2, 0.4), (1.3, 0), (0.3, 0.5)]],
    "2": [[(0.4, 4), (1, 4.9), (1.9, 5), (2.6, 4.2), (2.3, 3), (0.3, 0), (2.8, 0)]],
    "0": [[(1.5, 5), (0.6, 4.2), (0.4, 2.5), (0.6, 0.8), (1.5, 0), (2.4, 0.8), (2.6, 2.5), (2.4, 4.2), (1.5, 5)]],
    "6": [[(2.4, 4.7), (1.6, 5), (0.8, 4.3), (0.4, 2.5), (0.5, 1), (1.4, 0), (2.3, 0.5), (2.6, 1.6), (2, 2.8), (1.1, 2.9), (0.5, 2)]],
    ".": [[(0.5, 0.0), (0.7, 0.15)]],
    "·": [[(1.0, 1.5), (1.25, 1.7)]],
}
ADV = {"l": 1.9, ".": 1.5, " ": 1.8, "·": 2.4}


class Signature:
    """Hand lettering as a length of yarn laid on the rug, stroke by stroke."""

    def __init__(self, text, origin, scale=0.02, color="#c9573f", heading=0.0, thick=0.011):
        self.strokes = []
        x = 0.0
        m = mat(color, bump=0.004, scale=300, sheen=0.5)
        R = Matrix.Rotation(heading, 4, "Z")
        k = 0
        for ch in text:
            for st in GLYPH.get(ch, []):
                cu = bpy.data.curves.new("sig", "CURVE")
                cu.dimensions = "3D"
                cu.bevel_depth = thick
                cu.bevel_resolution = 3
                cu.resolution_u = 8
                cu.use_fill_caps = True
                sp = cu.splines.new("NURBS")
                sp.points.add(len(st) - 1)
                sp.use_endpoint_u = True
                sp.order_u = min(4, len(st))
                for p, (gx, gy) in zip(sp.points, st):
                    k += 1
                    jx = (((k * 7919) % 13) / 13 - 0.5) * 0.22
                    jy = (((k * 104729) % 11) / 11 - 0.5) * 0.22
                    w = V(origin) + (R @ V(((x + gx + jx) * scale, (gy + jy) * scale, 0)))
                    p.co = (w.x, w.y, w.z, 1.0)
                cu.materials.append(m)
                ob = link(bpy.data.objects.new("sig", cu))
                self.strokes.append(ob)
            x += ADV.get(ch, 3.5)
        self.width = x * scale

    def write(self, f):
        """f: 0 nothing written .. 1 all written."""
        n = len(self.strokes)
        for i, ob in enumerate(self.strokes):
            a = max(0.0, min(1.0, f * n - i))
            ob.hide_render = a <= 0.001
            ob.data.bevel_factor_end = a
