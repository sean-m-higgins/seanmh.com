"""Sunny: the model, the coat and the puppet rig.

Sunny is a tripod: his right hind leg and his tail were amputated before Sean
adopted him. He has two front legs, one hind leg (the left) that he carries
under the middle of his body, and a bob of a tail. The grey cat is built from
the same code with four legs and a full tail (`tripod=False`).

The cat faces +X, up is +Z, and is about one unit long. The body is one mesh
grown from a skeleton (Skin modifier, subdivided) and bound to an armature
whose bones have no parents: a pose is a full set of bone matrices computed in
Python (see `apply_pose`), so there are no keyframes and no solver state.
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

V = Vector


# ---------------------------------------------------------------- colour

def lin(hexstr, a=1.0):
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, a)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def sstep(a, b, x):
    if a == b:
        return 0.0 if x < a else 1.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def h2(i, j, k=0):
    n = (i * 374761393 + j * 668265263 + k * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 0xFFFF


SAND = lin("#bf9b6b")
SAND_HI = lin("#d8ba8a")
CREAM = lin("#efe2c8")
DARK = lin("#3a2a1e")
GREY = lin("#7d7f86")
GREY_D = lin("#5b5d66")
GREY_L = lin("#a9abb0")

LOOK = {"name": "felt", "fur": True}


def material(name, color=None, rough=0.92, sheen=0.35, vcol=False, emit=0.0, bump=0.012, scale=220.0):
    """A matte, slightly fuzzy material. `vcol` reads the mesh's `coat` colours."""
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = rough
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = sheen if LOOK["name"] == "felt" else 0.0
        bsdf.inputs["Sheen Roughness"].default_value = 0.6
    col_out = None
    if vcol:
        a = nt.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "coat"
        col_out = a.outputs["Color"]
    else:
        bsdf.inputs["Base Color"].default_value = color
    if LOOK["name"] == "felt" and bump:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value = scale
        nz.inputs["Detail"].default_value = 3.0
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = 0.35
        bp.inputs["Distance"].default_value = bump
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], bsdf.inputs["Normal"])
        if col_out is not None:
            # a little fibre mottling in the colour too
            mx = nt.nodes.new("ShaderNodeMix")
            mx.data_type = "RGBA"
            mx.blend_type = "MULTIPLY"
            ramp = nt.nodes.new("ShaderNodeMapRange")
            ramp.inputs["To Min"].default_value = 0.82
            ramp.inputs["To Max"].default_value = 1.12
            nt.links.new(nz.outputs["Fac"], ramp.inputs["Value"])
            mx.inputs["Factor"].default_value = 1.0
            nt.links.new(col_out, mx.inputs["A"])
            nt.links.new(ramp.outputs["Result"], mx.inputs["B"])
            col_out = mx.outputs["Result"]
    if col_out is not None:
        nt.links.new(col_out, bsdf.inputs["Base Color"])
    if emit:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emit
    if LOOK["name"] == "toon":
        s2 = nt.nodes.new("ShaderNodeShaderToRGB")
        cr = nt.nodes.new("ShaderNodeValToRGB")
        cr.color_ramp.interpolation = "CONSTANT"
        cr.color_ramp.elements[0].color = (0.45, 0.42, 0.5, 1)
        cr.color_ramp.elements[1].position = 0.32
        cr.color_ramp.elements[1].color = (1, 1, 1, 1)
        diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
        diff.inputs["Color"].default_value = (0.8, 0.8, 0.8, 1)
        nt.links.new(diff.outputs["BSDF"], s2.inputs["Shader"])
        nt.links.new(s2.outputs["Color"], cr.inputs["Fac"])
        mm = nt.nodes.new("ShaderNodeMix")
        mm.data_type = "RGBA"
        mm.blend_type = "MULTIPLY"
        mm.inputs["Factor"].default_value = 1.0
        if col_out is not None:
            nt.links.new(col_out, mm.inputs["A"])
        else:
            mm.inputs["A"].default_value = color
        nt.links.new(cr.outputs["Color"], mm.inputs["B"])
        em = nt.nodes.new("ShaderNodeEmission")
        nt.links.new(mm.outputs["Result"], em.inputs["Color"])
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    else:
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


# ---------------------------------------------------------------- skeleton

HIPS = V((-0.24, 0, 0.47))
MID = V((0.0, 0, 0.49))
CHEST = V((0.24, 0, 0.47))
NECK = V((0.35, 0, 0.56))
HEAD = V((0.47, 0, 0.71))
SH = {"l": V((0.25, 0.085, 0.38)), "r": V((0.25, -0.085, 0.38))}
HP = {"l": V((-0.25, 0.095, 0.38)), "r": V((-0.25, -0.095, 0.38))}
L1 = 0.17   # upper leg
L2 = 0.18   # lower leg, down to the paw centre
PAW_Z = 0.05
TAIL0 = V((-0.37, 0, 0.53))
TAIL_N = 7
TAIL_SEG = 0.095
HIP_T = V((-0.25, 0.072, 0.38))    # Sunny's one hind leg, set a little nearer the midline
BOB_N, BOB_SEG = 2, 0.04          # what is left of his tail


def _rest_leg(root, front):
    knee = root + V((-0.035 if front else 0.05, 0, -L1 * 0.98))
    d = (V((root.x + (0.02 if front else -0.02), root.y, PAW_Z)) - knee).normalized()
    paw = knee + d * L2
    return knee, paw


def frame(pos, fwd, up):
    """4x4 with Y along `fwd` (the bone axis), Z near `up`."""
    y = V(fwd).normalized()
    x = y.cross(V(up))
    if x.length < 1e-6:
        x = y.cross(V((0, 1, 0)))
    x.normalize()
    z = x.cross(y)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = V(pos)
    return m


def body_frame(pos, fwd=(1, 0, 0), up=(0, 0, 1)):
    """A part's rigid frame: X forward, Z up."""
    x = V(fwd).normalized()
    y = V(up).cross(x)
    if y.length < 1e-6:
        y = V((0, 1, 0))
    y.normalize()
    z = x.cross(y)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = V(pos)
    return m


REST = {"hips": body_frame(HIPS), "mid": body_frame(MID), "chest": body_frame(CHEST), "head": body_frame(HEAD)}


def _skeleton_mesh(name, tripod=False):
    """The stick figure the Skin modifier inflates. Returns the mesh object."""
    pts, radii, edges = [], [], []

    def chain(points, rads, start=None, cuts=3):
        prev = start
        for i, (p, r) in enumerate(zip(points, rads)):
            if prev is not None:
                a, ra = V(pts[prev]), radii[prev]
                for c in range(1, cuts):
                    f = c / cuts
                    pts.append(tuple(a.lerp(V(p), f)))
                    radii.append(ra + (r - ra) * f)
                    edges.append((prev, len(pts) - 1))
                    prev = len(pts) - 1
            pts.append(tuple(p))
            radii.append(r)
            if prev is not None:
                edges.append((prev, len(pts) - 1))
            prev = len(pts) - 1
        return prev

    chain([HIPS], [0.175])
    i_h = 0
    i_m = chain([MID], [0.17], i_h, cuts=3)
    i_c = chain([CHEST], [0.165], i_m, cuts=3)
    chain([NECK, HEAD - V((0.03, 0, 0.05))], [0.12, 0.11], i_c, cuts=2)
    for s in "lr":
        k, p = _rest_leg(SH[s], True)
        chain([SH[s], k, p, p + V((0.055, 0, -0.012))], [0.075, 0.058, 0.058, 0.05], i_c, cuts=3)
        if tripod and s == "r":
            continue                               # no right hind leg: the hip stays a smooth round
        root = HIP_T if tripod else HP[s]
        k, p = _rest_leg(root, False)
        thigh = (0.112, 0.07, 0.062, 0.053) if tripod else (0.095, 0.062, 0.058, 0.05)   # the one leg does the work of two
        chain([root, k, p, p + V((0.06, 0, -0.012))], thigh, i_h, cuts=3)
    if tripod:
        tp = [TAIL0 + V((-BOB_SEG * i, 0, 0.012 * i)) for i in range(BOB_N + 1)]
        tr = [0.052, 0.045, 0.036]
    else:
        tp = [TAIL0 + V((-TAIL_SEG * i, 0, 0.012 * i)) for i in range(TAIL_N + 1)]
        tr = [0.06] + [0.05 - 0.012 * i / TAIL_N for i in range(1, TAIL_N + 1)]
    chain(tp, tr, i_h, cuts=2)

    me = bpy.data.meshes.new(name)
    me.from_pydata(pts, edges, [])
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    sk = ob.modifiers.new("skin", "SKIN")
    sk.use_smooth_shade = True
    sk.branch_smoothing = 0.6
    for v, r in zip(me.skin_vertices[0].data, radii):
        v.radius = (r, r)
    me.skin_vertices[0].data[0].use_root = True
    sub = ob.modifiers.new("sub", "SUBSURF")
    sub.levels = 3
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier="skin")
    bpy.ops.object.modifier_apply(modifier="sub")
    for p in me.polygons:
        p.use_smooth = True
    return ob


# ---------------------------------------------------------------- the coat

def _spot(u, v, cell_u, cell_v, r, seed=0):
    """Jittered-grid spots. Returns 0..1 coverage."""
    gu, gv = u / cell_u, v / cell_v
    iu, iv = math.floor(gu), math.floor(gv)
    best = 0.0
    for a in (-1, 0, 1):
        for b in (-1, 0, 1):
            cu = iu + a + 0.5 + (h2(iu + a, iv + b, seed) - 0.5) * 0.7
            cv = iv + b + 0.5 + (h2(iu + a, iv + b, seed + 7) - 0.5) * 0.7
            rr = r * (0.7 + 0.6 * h2(iu + a, iv + b, seed + 3))
            d = math.hypot((gu - cu) * cell_u * 0.8, (gv - cv) * cell_v)
            best = max(best, 1 - sstep(rr * 0.55, rr, d))
    return best


def coat_body(p, pal, tripod=False):
    base, hi, cream, dark = pal
    x, y, z = p
    col = base
    on_tail = x < -0.42 and z > 0.44 and abs(y) < 0.075
    on_leg = z < 0.31 and not on_tail
    if on_tail:
        s = -x - 0.42
        ring = sstep(0.15, 0.6, math.sin(s * 2 * math.pi / 0.105 - 0.8))
        col = mix(base, dark, ring * 0.92)
        col = mix(col, dark, sstep(0.52, 0.6, s))
        if tripod:
            col = mix(base, dark, sstep(0.0, 0.05, s) * 0.85)   # the bob: a dark tip
    elif on_leg:
        band = sstep(0.1, 0.65, math.sin(z * 2 * math.pi / 0.085 + (1.0 if x > 0 else 2.2)))
        inner = 1 - sstep(0.0, 0.05, abs(y) - 0.06)          # inside of the leg stays plain
        col = mix(base, dark, band * (1 - 0.75 * inner) * sstep(0.075, 0.12, z) * 0.9)
        col = mix(col, hi, (1 - sstep(0.04, 0.1, z)) * 0.8)   # pale paws
    else:
        ang = math.atan2(abs(y), z - 0.47)                    # 0 on the spine, pi under the belly
        u = x + 0.5
        sp = _spot(u, ang * 0.17, 0.085, 0.075, 0.03)
        sp *= sstep(0.25, 0.5, ang) * (1 - sstep(1.9, 2.3, ang))
        col = mix(base, hi, sstep(1.0, 2.0, ang) * 0.6)
        col = mix(col, dark, sp * 0.9)
        dorsal = (1 - sstep(0.1, 0.22, ang)) * (0.55 + 0.45 * math.sin(u * 2 * math.pi / 0.11))
        col = mix(col, dark, dorsal * 0.8)
        col = mix(col, cream, sstep(2.2, 2.9, ang) * 0.9)     # belly
        col = mix(col, cream, sstep(0.3, 0.42, x) * sstep(1.3, 2.0, ang) * 0.8)  # chest and throat
        # necklace stripes on the upper chest
        neck = sstep(0.26, 0.3, x) * (1 - sstep(0.36, 0.4, x)) * sstep(0.5, 0.75, math.sin(x * 2 * math.pi / 0.06))
        col = mix(col, dark, neck * 0.5 * sstep(0.3, 0.8, ang))
    return col


def coat_head(d, pal):
    """`d` is the unit direction from the head centre (x forward, z up)."""
    base, hi, cream, dark = pal
    x, y, z = d
    col = mix(base, hi, sstep(-0.2, 0.6, x) * 0.5)
    # forehead M and crown stripes
    if z > 0.1:
        k = sstep(0.25, 0.7, math.cos(abs(y) * 13.0 + (0.6 if x < 0.2 else 0.0)))
        fade = sstep(0.12, 0.4, z) * (1 - sstep(0.75, 1.0, abs(y)))
        col = mix(col, dark, k * fade * 0.85 * (1 - sstep(0.55, 0.9, x)))
    # cheek swipes running back from the eyes
    if abs(y) > 0.45 and x > -0.5:
        for zc in (-0.02, -0.26):
            line = 1 - sstep(0.035, 0.085, abs(z - zc - 0.18 * (0.6 - x)))
            col = mix(col, dark, line * sstep(0.45, 0.6, abs(y)) * 0.8)
    # pale spectacles and a dark eyeliner are laid in around each eye
    for s in (1, -1):
        e = V((0.72, 0.5 * s, 0.1)).normalized()
        dist = (V(d) - e).length
        col = mix(col, cream, (1 - sstep(0.33, 0.48, dist)) * 0.75)
        col = mix(col, dark, (1 - sstep(0.285, 0.33, dist)) * 0.9)
    # muzzle and chin
    m = (V(d) - V((0.9, 0, -0.42)).normalized()).length
    col = mix(col, cream, 1 - sstep(0.3, 0.6, m))
    col = mix(col, cream, sstep(-0.5, -0.8, z) * sstep(-0.2, 0.3, x))
    return col


def head_radius(d):
    x, y, z = d
    r = 1.0 / math.sqrt((x / 0.215) ** 2 + (y / 0.245) ** 2 + (z / 0.2) ** 2)
    mz = (V(d) - V((0.93, 0, -0.36)).normalized()).length
    r += 0.042 * math.exp(-(mz / 0.42) ** 2)                 # muzzle
    for s in (1, -1):
        ck = (V(d) - V((0.35, 0.8 * s, -0.45)).normalized()).length
        r += 0.03 * math.exp(-(ck / 0.5) ** 2)               # cheeks
    return r


def _paint(me, fn):
    # stored per face corner as byte colour: the one form fur strands can read from the skin under them
    cols = [fn(v.co) for v in me.vertices]
    ca = me.color_attributes.new("coat", "BYTE_COLOR", "CORNER")
    for lp in me.loops:
        ca.data[lp.index].color = cols[lp.vertex_index]
    me.color_attributes.active_color = ca
    me.color_attributes.render_color_index = me.color_attributes.find("coat")
    return ca


def _sphere(name, radius=1.0, u=32, v=16, scale=(1, 1, 1)):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=radius)
    for vert in bm.verts:
        vert.co = V((vert.co.x * scale[0], vert.co.y * scale[1], vert.co.z * scale[2]))
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _eye_material(name, iris):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.12
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    # pupil: an ellipse in the eye's own YZ plane. Width is a Value node.
    w = nt.nodes.new("ShaderNodeValue")
    w.name = "pupil"
    w.outputs[0].default_value = 0.5

    def math_node(op, a, b=None):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = op
        for i, val in enumerate((a, b)):
            if val is None:
                continue
            if isinstance(val, (int, float)):
                n.inputs[i].default_value = val
            else:
                nt.links.new(val, n.inputs[i])
        return n.outputs[0]

    yy = math_node("DIVIDE", sep.outputs["Y"], w.outputs[0])
    zz = math_node("DIVIDE", sep.outputs["Z"], 0.62)
    r2 = math_node("ADD", math_node("MULTIPLY", yy, yy), math_node("MULTIPLY", zz, zz))
    pupil = math_node("LESS_THAN", r2, 1.0)
    rim2 = math_node("ADD", math_node("MULTIPLY", sep.outputs["Y"], sep.outputs["Y"]),
                     math_node("MULTIPLY", sep.outputs["Z"], sep.outputs["Z"]))
    rim = math_node("GREATER_THAN", rim2, 0.80)
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.0
    ramp.inputs["From Max"].default_value = 0.8
    nt.links.new(rim2, ramp.inputs["Value"])
    c1 = nt.nodes.new("ShaderNodeMix")
    c1.data_type = "RGBA"
    c1.inputs["A"].default_value = lin("#cfcf6a")
    c1.inputs["B"].default_value = iris
    nt.links.new(ramp.outputs["Result"], c1.inputs["Factor"])
    c2 = nt.nodes.new("ShaderNodeMix")
    c2.data_type = "RGBA"
    c2.inputs["B"].default_value = (0.004, 0.004, 0.006, 1)
    nt.links.new(c1.outputs["Result"], c2.inputs["A"])
    nt.links.new(math_node("MAXIMUM", pupil, rim), c2.inputs["Factor"])
    nt.links.new(c2.outputs["Result"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


class Cat:
    """Build with `Cat(name)`, then call `apply_pose(pose)` each frame."""

    def __init__(self, name="sunny", grey=False, scale=1.0, tripod=None):
        self.name = name
        self.tripod = (not grey) if tripod is None else tripod
        self.tail_n, self.tail_seg = (BOB_N, BOB_SEG) if self.tripod else (TAIL_N, TAIL_SEG)
        pal = (GREY, GREY_L, lin("#c9cacd"), GREY_D) if grey else (SAND, SAND_HI, CREAM, DARK)
        self.pal = pal
        self.scale = scale
        fur = material(name + "-fur", vcol=True)

        # body
        body = _skeleton_mesh(name + "-body", self.tripod)
        me = body.data
        if grey:
            _paint(me, lambda p: mix(pal[0], pal[2], sstep(2.0, 2.9, math.atan2(abs(p.y), p.z - 0.47)) * 0.5))
        else:
            _paint(me, lambda p: coat_body(p, pal, self.tripod))
        me.materials.append(fur)
        self.body = body

        # armature
        arm = bpy.data.armatures.new(name + "-rig")
        rig = bpy.data.objects.new(name + "-rig", arm)
        bpy.context.scene.collection.objects.link(rig)
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode="EDIT")
        self.rest_local = {}
        self.part = {}

        def bone(nm, a, b, up, part):
            eb = arm.edit_bones.new(nm)
            eb.head, eb.tail = a, b
            m = frame(a, V(b) - V(a), up)
            eb.matrix = m
            eb.length = (V(b) - V(a)).length
            self.part[nm] = part

        bone("hips", HIPS + V((-0.1, 0, 0)), HIPS + V((0.1, 0, 0)), (0, 0, 1), "hips")
        bone("mid", MID + V((-0.1, 0, 0)), MID + V((0.1, 0, 0)), (0, 0, 1), "mid")
        bone("chest", CHEST + V((-0.1, 0, 0)), CHEST + V((0.1, 0, 0)), (0, 0, 1), "chest")
        bone("neck", NECK, HEAD - V((0.03, 0, 0.05)), (0, 0, 1), None)
        self.leg_rest = {}
        for s in "lr":
            k, p = _rest_leg(SH[s], True)
            bone("f%s_u" % s, SH[s], k, (1, 0, 0), None)
            bone("f%s_l" % s, k, p, (1, 0, 0), None)
            self.leg_rest["f" + s] = (SH[s], (k - SH[s]).length, (p - k).length)
            if self.tripod and s == "r":
                continue
            root = HIP_T if self.tripod else HP[s]
            k, p = _rest_leg(root, False)
            bone("h%s_u" % s, root, k, (1, 0, 0), None)
            bone("h%s_l" % s, k, p, (1, 0, 0), None)
            self.leg_rest["h" + s] = (root, (k - root).length, (p - k).length)
        for i in range(self.tail_n):
            a = TAIL0 + V((-self.tail_seg * i, 0, 0.012 * i))
            b = TAIL0 + V((-self.tail_seg * (i + 1), 0, 0.012 * (i + 1)))
            bone("t%d" % i, a, b, (0, 0, 1), None)
        bpy.ops.object.mode_set(mode="OBJECT")
        for b in arm.bones:
            self.rest_local[b.name] = b.matrix_local.copy()
        for o in bpy.context.selected_objects:
            o.select_set(False)
        body.select_set(True)
        rig.select_set(True)
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
        self.rig = rig
        rig.scale = (scale,) * 3

        # head
        head = _sphere(name + "-head", 1.0, 64, 40)
        for v in head.data.vertices:
            d = v.co.normalized()
            v.co = d * head_radius(d)
        if grey:
            _paint(head.data, lambda p: mix(pal[0], pal[2], 1 - sstep(0.3, 0.6, (p.normalized() - V((0.9, 0, -0.42)).normalized()).length)))
        else:
            _paint(head.data, lambda p: coat_head(p.normalized(), pal))
        head.data.materials.append(fur)
        self.head = head
        self.head_rel = Matrix.Identity(4)

        def child(ob, loc, rot=(0, 0, 0), sc=(1, 1, 1)):
            ob.parent = head
            ob.location, ob.rotation_euler, ob.scale = loc, rot, sc
            return ob

        ear_out = material(name + "-ear", mix(pal[0], pal[3], 0.35))
        ear_in = material(name + "-earin", lin("#e2b1a0") if not grey else lin("#c8a8a8"))
        self.ears = []
        for s in (1, -1):
            def ear_mesh(r, depth):
                me_e = bpy.data.meshes.new(name + "-ear")
                bm = bmesh.new()
                bmesh.ops.create_cone(bm, segments=28, radius1=r, radius2=0.014, depth=depth, cap_ends=True)
                for v in bm.verts:
                    v.co.x *= 0.5
                bm.to_mesh(me_e)
                bm.free()
                for p in me_e.polygons:
                    p.use_smooth = True
                return me_e
            me_e = ear_mesh(0.135, 0.23)
            e = bpy.data.objects.new(name + "-ear", me_e)
            bpy.context.scene.collection.objects.link(e)
            me_e.materials.append(ear_out)
            child(e, (-0.02, 0.16 * s, 0.235), (-0.55 * s, -0.1, 0.3 * s))
            me_i = ear_mesh(0.095, 0.175)
            inner = bpy.data.objects.new(name + "-earin", me_i)
            bpy.context.scene.collection.objects.link(inner)
            me_i.materials.append(ear_in)
            inner.parent = e
            inner.location = (0.026, 0, -0.022)
            self.ears.append(e)
        self.ear_rest = [tuple(e.rotation_euler) for e in self.ears]

        iris = lin("#93a02c") if not grey else lin("#d6b23a")
        self.eye_mat = _eye_material(name + "-eye", iris)
        lid_mat = material(name + "-lid", pal[3], rough=0.8, bump=0)
        self.eyes, self.lids = [], []
        cover_mat = material(name + "-lidcover", mix(pal[1], pal[2], 0.35))
        for s in (1, -1):
            d = V((0.72, 0.5 * s, 0.1)).normalized()
            r = head_radius(d)
            e = _sphere(name + "-eye", 1.0, 32, 16)
            e.data.materials.append(self.eye_mat)
            child(e, d * (r - 0.03), (0, -math.asin(d.z) * 0.6, math.atan2(d.y, d.x) * 0.72), (0.045, 0.066, 0.066))
            self.eyes.append(e)
            lid = _sphere(name + "-lidline", 1.0, 16, 8)
            lid.data.materials.append(lid_mat)
            child(lid, d * (r + 0.002), (0, -math.asin(d.z) * 0.6, math.atan2(d.y, d.x) * 0.72), (0.012, 0.062, 0.009))
            self.lids.append(lid)
            cover = _sphere(name + "-lidcover", 1.0, 24, 12)       # the closed eyelid, in coat colour
            cover.data.materials.append(cover_mat)
            child(cover, d * (r - 0.03), (0, -math.asin(d.z) * 0.6, math.atan2(d.y, d.x) * 0.72), (0.043, 0.082, 0.082))
            self.lids.append(cover)
        self.eye_scale = (0.045, 0.066, 0.066)

        nose = _sphere(name + "-nose", 1.0, 16, 8)
        nose.data.materials.append(material(name + "-nose", lin("#b5544a") if not grey else lin("#3b3b40"), rough=0.5, bump=0))
        dn = V((0.96, 0, -0.2)).normalized()
        child(nose, dn * (head_radius(dn) - 0.004), (0, 0, 0), (0.016, 0.026, 0.017))
        # the mouth: a short line down from the nose, turning out to each side
        mm = material(name + "-mouth", mix(pal[3], lin("#1a120c"), 0.5), rough=0.8, bump=0)
        for sgn in (1, -1):
            cu = bpy.data.curves.new(name + "-mouth", "CURVE")
            cu.dimensions = "3D"
            cu.bevel_depth = 0.0042
            cu.bevel_resolution = 2
            cu.use_fill_caps = True
            sp = cu.splines.new("NURBS")
            dirs = [(0.96, 0.0, -0.27), (0.94, 0.0, -0.36), (0.93, 0.035 * sgn, -0.43), (0.9, 0.1 * sgn, -0.45), (0.87, 0.17 * sgn, -0.41)]
            sp.points.add(len(dirs) - 1)
            sp.use_endpoint_u = True
            sp.order_u = 3
            for pt, dd in zip(sp.points, dirs):
                dv = V(dd).normalized()
                q = dv * (head_radius(dv) + 0.006)
                pt.co = (q.x, q.y, q.z, 1.0)
            cu.materials.append(mm)
            mo = bpy.data.objects.new(name + "-mouth", cu)
            bpy.context.scene.collection.objects.link(mo)
            mo.parent = head
        wm = material(name + "-whisker", lin("#f4efe4"), rough=0.6, bump=0)
        for s in (1, -1):
            for j, (ay, az) in enumerate(((0.9, 0.1), (1.05, -0.08), (1.2, -0.3))):
                me_w = bpy.data.meshes.new(name + "-wh")
                bm = bmesh.new()
                bmesh.ops.create_cone(bm, segments=5, radius1=0.0035, radius2=0.0008, depth=0.2, cap_ends=True)
                bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, 0.1))
                bm.to_mesh(me_w)
                bm.free()
                w = bpy.data.objects.new(name + "-wh", me_w)
                bpy.context.scene.collection.objects.link(w)
                me_w.materials.append(wm)
                dw = V((0.88, 0.3 * s, -0.4)).normalized()
                direction = V((0.25, s * 1.0, az * 0.5)).normalized()
                child(w, dw * (head_radius(dw) - 0.01))
                w.rotation_mode = "QUATERNION"
                w.rotation_quaternion = direction.to_track_quat("Z", "Y")

        self.objects = [body, rig, head]
        self.root = Matrix.Identity(4)
        if LOOK["name"] == "felt" and LOOK.get("fur"):
            self._fur(body, 9000, 0.02)
            vg = head.vertex_groups.new(name="fur")
            keep = [V((0.72, 0.5, 0.1)).normalized(), V((0.72, -0.5, 0.1)).normalized(), V((0.96, 0, -0.2)).normalized(),
                    V((0.92, 0, -0.42)).normalized()]
            for v in head.data.vertices:
                d = v.co.normalized()
                w = min(sstep(0.3, 0.44, (d - k).length) for k in keep[:2])
                w = min(w, sstep(0.1, 0.2, (d - keep[2]).length), 0.35 + 0.65 * sstep(0.1, 0.24, (d - keep[3]).length))
                vg.add([v.index], w, "REPLACE")
            self._fur(head, 6000, 0.014, "fur")

    def _fur(self, ob, count, length, group=""):
        """A short coat of real strands over the painted one. Each strand takes
        the coat colour of the skin under its root, so the markings carry."""
        mod = ob.modifiers.new("fur", "PARTICLE_SYSTEM")
        ps = mod.particle_system
        st = ps.settings
        st.type = "HAIR"
        st.count = count
        st.hair_length = length
        st.hair_step = 2
        st.emit_from = "FACE"
        st.use_emit_random = True
        st.use_even_distribution = True
        st.child_type = "INTERPOLATED"
        st.child_percent = 30
        st.rendered_child_count = 30
        st.child_length = 1.0
        st.child_radius = 0.02
        st.roughness_2 = 0.012
        st.roughness_endpoint = 0.004
        st.root_radius = 0.9
        st.tip_radius = 0.15
        st.radius_scale = 0.0028
        st.render_step = 2
        st.display_step = 2
        st.use_hair_bspline = False
        ps.seed = 7
        if group:
            ps.vertex_group_density = group
            ps.vertex_group_length = group
        st.material = 1
        mod.show_viewport = True
        return ps

    # ------------------------------------------------------------ posing

    def place(self, pos, heading=0.0, tilt=None):
        """Where the cat stands in the world; heading is a rotation about Z."""
        m = Matrix.Translation(V(pos)) @ Matrix.Rotation(heading, 4, "Z")
        if tilt is not None:
            m = m @ tilt
        self.root = m @ Matrix.Scale(self.scale, 4)
        self.rig.matrix_world = self.root

    def apply_pose(self, pose):
        """`pose` keys (all in cat space, rest pose = standing):
        hips, chest: 4x4 body frames (X forward, Z up) · mid: optional 4x4
        head: 4x4 body frame of the head · feet: {fl, fr, hl, hr: Vector}
        knee: {leg: pole Vector} optional · tail: list of TAIL_N+1 points
        eyes: 0 closed .. 1 open · pupil: 0 slit .. 1 round · ears: radians back
        """
        pb = self.rig.pose.bones
        T = {}
        for k in ("hips", "chest"):
            T[k] = pose[k] @ REST[k].inverted()
        if pose.get("mid") is not None:
            T["mid"] = pose["mid"] @ REST["mid"].inverted()
        else:
            ph, pc = pose["hips"], pose["chest"]
            q = ph.to_quaternion().slerp(pc.to_quaternion(), 0.5)
            a = ph @ V((0.24, 0, 0.02))
            b = pc @ V((-0.24, 0, 0.02))
            m = q.to_matrix().to_4x4()
            m.translation = (a + b) / 2
            T["mid"] = m @ REST["mid"].inverted()

        def set_bone(nm, world):
            b = pb[nm]
            b.matrix_basis = self.rest_local[nm].inverted() @ world

        for k in ("hips", "mid", "chest"):
            set_bone(k, T[k] @ self.rest_local[k])

        head = pose["head"]
        nb = T["chest"] @ NECK
        ne = head @ V((-0.03, 0, -0.05))
        d = ne - nb
        rest_len = (HEAD - V((0.03, 0, 0.05)) - NECK).length
        m = frame(nb, d, T["chest"].to_3x3() @ V((0, 0, 1)))
        set_bone("neck", m @ Matrix.Diagonal((1, max(0.3, d.length / rest_len), 1, 1)))

        for leg, foot in pose["feet"].items():
            if leg not in self.leg_rest:
                continue                           # a pose may name a leg this cat does not have
            root_rest, l1, l2 = self.leg_rest[leg]
            Tp = T["chest"] if leg[0] == "f" else T["hips"]
            root = Tp @ root_rest
            pole = pose.get("knee", {}).get(leg)
            if pole is None:
                pole = Tp.to_3x3() @ V((-1 if leg[0] == "f" else 1, 0, 0.15))
            to = V(foot) - root
            dist = max(to.length, 1e-4)
            s = 1.0
            if dist > (l1 + l2) * 0.999:
                s = dist / ((l1 + l2) * 0.999)
            a1, a2 = l1 * s, l2 * s
            dn = to / dist
            along = (a1 * a1 - a2 * a2 + dist * dist) / (2 * dist)
            hgt = math.sqrt(max(a1 * a1 - along * along, 0.0))
            pv = V(pole) - dn * V(pole).dot(dn)
            if pv.length < 1e-5:
                pv = V((0, 0, 1)) - dn * dn.z
            pv.normalize()
            knee = root + dn * along + pv * hgt
            side = Tp.to_3x3() @ V((0, 1, 0))
            up = side.cross(knee - root)          # matches the rest roll hint (forward-ish)
            up_rest_hint = Tp.to_3x3() @ V((1, 0, 0))
            set_bone(leg + "_u", frame(root, knee - root, up_rest_hint) @ Matrix.Diagonal((1, s, 1, 1)))
            set_bone(leg + "_l", frame(knee, V(foot) - knee, up_rest_hint) @ Matrix.Diagonal((1, s, 1, 1)))

        tail = pose["tail"]
        upv = T["hips"].to_3x3() @ V((0, 0, 1))
        a = V(tail[0])
        for i in range(self.tail_n):
            # follow the direction of the posed tail, at this cat's own tail length
            d = (V(tail[i + 1]) - V(tail[i])).normalized()
            set_bone("t%d" % i, frame(a, d, upv))
            a = a + d * self.tail_seg

        self.head.matrix_world = self.root @ head @ REST["head"].inverted() @ Matrix.Translation(HEAD)
        op = pose.get("eyes", 1.0)
        for e in self.eyes:
            e.scale = (self.eye_scale[0], self.eye_scale[1], self.eye_scale[2] * max(op, 0.02))
            e.hide_render = op < 0.12
        for lid in self.lids:
            lid.hide_render = op >= 0.12
        self.eye_mat.node_tree.nodes["pupil"].outputs[0].default_value = 0.16 + 0.5 * pose.get("pupil", 0.6)
        back = pose.get("ears", 0.0)
        for e, r in zip(self.ears, self.ear_rest):
            e.rotation_euler = (r[0], r[1] - back, r[2])

    def tail_base(self, pose):
        return (pose["hips"] @ REST["hips"].inverted()) @ TAIL0
