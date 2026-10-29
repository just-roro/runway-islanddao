"""Author RUNWAY's shared skinned pilot. Blender 4.5+, no external assets.

Three axes are used by every helper: Y up, +Z is the front of the suit.
The external LED head is deliberately not part of this asset.
Run: Blender --background --python scripts/create-pilot.py
"""
import bpy, math, os, json
from mathutils import Vector, Quaternion

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0
parts = []

def v(p):
    return Vector((p[0], -p[2], p[1]))

def linear(c):
    values = [int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in values) + (1,)

# The orange mask remains the existing NFT accent recolouring contract.
FABRIC, INK, TRIM, LIGHT, GLOW = '#ff653c', '#132735', '#b7c7cf', '#e5e8dd', '#55dfd1'
materials = []
for name, roughness, metallic in [('Woven flight suit', .76, .02), ('Satin hardware', .34, .55), ('Rubber and harness', .86, .04)]:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    color = nodes.new('ShaderNodeVertexColor')
    color.layer_name = 'Color'
    principled = nodes['Principled BSDF']
    mat.node_tree.links.new(color.outputs['Color'], principled.inputs['Base Color'])
    principled.inputs['Roughness'].default_value = roughness
    principled.inputs['Metallic'].default_value = metallic
    materials.append(mat)

def finish(o, color, bone, material=0, weights=None):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(materials[material])
    attr = o.data.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    for item in attr.data:
        item.color = linear(color)
    if weights is None:
        o.vertex_groups.new(name=bone).add(list(range(len(o.data.vertices))), 1, 'REPLACE')
    else:
        groups = {}
        for i, contributions in enumerate(weights):
            for name, weight in contributions.items():
                if name not in groups:
                    groups[name] = o.vertex_groups.new(name=name)
                if weight > 0:
                    groups[name].add([i], weight, 'REPLACE')
    parts.append(o)
    return o

def box(p, size, color, bone, material=0, bevel=.025, rotate=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=v(p))
    o = bpy.context.object
    o.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('Tailored bevel', 'BEVEL')
        mod.width = min(bevel, min(size) * .28)
        mod.segments = 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    # Rotation in the suit's front plane, for straps and tailored panels.
    o.rotation_euler.y = -rotate
    return finish(o, color, bone, material)

def ellipsoid(p, radius, color, bone, material=0, segments=12, rings=6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=v(p))
    o = bpy.context.object
    o.scale = (radius[0], radius[2], radius[1])
    for poly in o.data.polygons:
        poly.use_smooth = True
    return finish(o, color, bone, material)

def loft(name, rings, color, bone, material=0, weight_fn=None, segments=12):
    """Continuous skinned cloth, including blended vertices around knees/elbows."""
    verts, weights, faces = [], [], []
    for x, y, z, rx, rz in rings:
        for i in range(segments):
            angle = math.tau * i / segments
            verts.append(v((x + math.cos(angle) * rx, y, z + math.sin(angle) * rz)))
            weights.append(weight_fn(y) if weight_fn else {bone: 1})
    for row in range(len(rings) - 1):
        for i in range(segments):
            a = row * segments + i
            b = row * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(rings) - 1) * segments + i for i in range(segments)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    for poly in mesh.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    return finish(o, color, bone, material, weights)

def blend_joint(y, upper, lower, joint, width=.07):
    lower_weight = max(0, min(1, (joint + width - y) / (2 * width)))
    return {upper: 1 - lower_weight, lower: lower_weight}

# Restrained shoulder taper and a segmented waist, rather than boxy armour.
loft('Tailored torso', [(0, .01, 0, .22, .18), (0, -.08, 0, .35, .22),
    (0, -.26, 0, .33, .235), (0, -.45, 0, .29, .21), (0, -.62, 0, .28, .19),
    (0, -.73, 0, .30, .195)], FABRIC, 'chest', weight_fn=lambda y: blend_joint(y, 'chest', 'pelvis', -.48, .2))
ellipsoid((0, -.75, 0), (.31, .16, .21), INK, 'pelvis', 2)
box((0, -.65, .01), (.65, .11, .43), INK, 'pelvis', 2)
box((0, -.645, .235), (.115, .09, .03), TRIM, 'pelvis', 1, .012)
# Small, raised collar is graphite — no yellow neck ring.
loft('Neck seal', [(0, .015, 0, .19, .17), (0, -.04, 0, .20, .18)], INK, 'chest', 2)
for side in [-1, 1]:
    box((side * .25, -.27, .208), (.065, .57, .035), INK, 'chest', 2, .01, -side * .16)
    box((side * .245, -.08, .237), (.087, .105, .025), TRIM, 'chest', 1, .012)
    box((side * .25, -.08, .255), (.047, .06, .012), INK, 'chest', 2, .004)
    box((side * .225, -.53, .205), (.13, .07, .035), TRIM, 'pelvis', 1, .012, side * .25)
    box((side * .29, -.4, -.04), (.035, .17, .3), INK, 'chest', 2, .01)
    box((side * .31, -.23, .01), (.045, .21, .12), FABRIC, 'chest', 0, .015)
box((0, -.22, .247), (.33, .24, .05), INK, 'chest', 2, .035)
box((0, -.22, .28), (.27, .18, .025), LIGHT, 'chest', 1, .025)
for y, color in [(-.17, GLOW), (-.22, '#8a78d5'), (-.27, GLOW)]:
    box((0, y, .3), (.15, .022, .012), color, 'chest', 1, .004)
# Sculpted backpack: edge recess, raised central shell, vents and shoulder webbing.
box((0, -.25, -.28), (.57, .67, .21), INK, 'chest', 2, .06)
box((0, -.24, -.40), (.49, .56, .13), TRIM, 'chest', 1, .055)
box((0, -.24, -.475), (.37, .43, .025), '#7a929e', 'chest', 1, .04)
for side in [-1, 1]:
    box((side * .255, -.25, -.38), (.065, .39, .09), INK, 'chest', 2, .016)
    for y in [-.12, -.22, -.32]:
        box((side * .29, y, -.39), (.014, .06, .045), GLOW, 'chest', 1, .004)
for y, color in [(-.14, GLOW), (-.31, '#9f79e2')]:
    box((0, y, -.493), (.22, .035, .014), color, 'chest', 1, .005)

for side, suffix in [(-1, 'L'), (1, 'R')]:
    arm, forearm, hand = 'arm' + suffix, 'forearm' + suffix, 'hand' + suffix
    x = side * .435
    # A continuous underarm gusset bridges the chest to the existing humerus pivot.
    # The inner ring follows the chest; the outer ring follows the arm. No new bone.
    verts, weights, faces = [], [], []
    for row, (along, radius, arm_weight) in enumerate([(.265,.135,0),(.32,.15,.2),(.38,.14,.65),(.435,.12,1)]):
        for j in range(12):
            a = math.tau*j/12
            verts.append(v((side*along,-.075+math.cos(a)*radius,math.sin(a)*radius)))
            weights.append({'chest':1-arm_weight,arm:arm_weight})
            if row:
                n=row*12+j; prev=row*12+(j+1)%12
                faces.append((n,prev,prev-12,n-12) if side>0 else (n-12,prev-12,prev,n))
    mesh=bpy.data.meshes.new('Shoulder gusset '+suffix);mesh.from_pydata(verts,[],faces);mesh.update()
    socket=bpy.data.objects.new('Shoulder gusset '+suffix,mesh);bpy.context.collection.objects.link(socket)
    for face in mesh.polygons: face.use_smooth=True
    finish(socket,INK,arm,2,weights)
    # Rounded sleeve cap surrounds the pivot and meets the gusset in every pose.
    ellipsoid((x,-.055,0),(.14,.115,.15),FABRIC,arm,0)
    loft('Sleeve ' + suffix, [(x, -.04, 0, .135, .155), (x, -.14, 0, .15, .16),
        (x, -.27, 0, .13, .145), (x, -.33, 0, .11, .12),
        (x, -.39, 0, .105, .12), (x, -.49, .015, .105, .125),
        (x, -.60, .025, .09, .105)], FABRIC, arm,
        weight_fn=lambda y, a=arm, f=forearm: blend_joint(y, a, f, -.34, .055))
    ellipsoid((x, -.335, -.025), (.115, .087, .125), INK, forearm, 2)
    box((x, -.14, .145), (.18, .13, .035), FABRIC, arm, 0, .025)
    box((x, -.125, .17), (.115, .035, .015), GLOW, arm, 1, .004)
    box((x, -.51, .025), (.225, .115, .265), INK, forearm, 2, .025)
    box((x, -.535, .16), (.15, .085, .045), LIGHT, forearm, 1, .014)
    box((x, -.535, .188), (.1, .04, .012), '#52cfdb', forearm, 1, .004)
    ellipsoid((x, -.665, .04), (.10, .13, .10), INK, hand, 2, 10, 6)
    box((x, -.645, .122), (.17, .115, .035), LIGHT, hand, 1, .025)
    ellipsoid((x - side * .095, -.66, .07), (.045, .077, .05), INK, hand, 2, 8, 4)
    for offset in [-.05, 0, .05]:
        box((x + offset, -.738, .07), (.025, .02, .075), '#3c5260', hand, 2, .004)

    thigh, shin, foot = 'thigh' + suffix, 'shin' + suffix, 'foot' + suffix
    x = side * .18
    loft('Trouser ' + suffix, [(x, -.71, 0, .145, .17), (x, -.83, 0, .16, .175),
        (x, -.99, .015, .135, .15), (x, -1.055, .015, .115, .13),
        (x, -1.12, 0, .11, .125), (x, -1.23, 0, .105, .12),
        (x, -1.33, 0, .10, .11)], FABRIC, thigh,
        weight_fn=lambda y, a=thigh, f=shin: blend_joint(y, a, f, -1.06, .065))
    box((x + side * .1, -.87, .075), (.09, .19, .16), FABRIC, thigh, 0, .025)
    box((x + side * .11, -.87, .16), (.075, .12, .018), '#d3492e', thigh, 0, .01)
    ellipsoid((x, -1.055, .015), (.13, .105, .14), INK, shin, 2)
    box((x, -1.075, .158), (.205, .15, .075), INK, shin, 2, .035)
    box((x, -1.06, .2), (.14, .08, .02), '#3b5261', shin, 2, .016)
    box((x, -1.275, .005), (.23, .125, .27), INK, shin, 2, .025)
    box((x, -1.41, .10), (.29, .23, .40), INK, foot, 2, .045)
    box((x, -1.40, .27), (.285, .14, .13), LIGHT, foot, 1, .028)
    box((x, -1.50, .10), (.31, .07, .42), '#8c9fa8', foot, 2, .014)
    box((x, -1.54, .10), (.31, .035, .42), INK, foot, 2, .007)
    for z in [-.04, .055, .15, .245]:
        box((x, -1.565, z), (.29, .025, .04), '#334853', foot, 2, .004)
    for y in [-1.33, -1.38]:
        box((x, y, .235), (.17, .024, .02), '#627a87', foot, 2, .004)
    box((x + side * .15, -1.38, .06), (.015, .04, .09), GLOW, foot, 1, .004)

# One mesh, three material primitives and a shared 15-bone skin.
bpy.ops.object.select_all(action='DESELECT')
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.object
body.name = 'PilotSuit'
bpy.context.scene.cursor.location = (0, 0, 0)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

armature = bpy.data.armatures.new('PilotSkeleton')
rig = bpy.data.objects.new('PilotRig', armature)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
body.select_set(False)
bpy.ops.object.mode_set(mode='EDIT')
bones = [
    ('pelvis', (0, -.75, 0), (0, -.48, 0), None),
    ('spine', (0, -.48, 0), (0, -.28, 0), 'pelvis'),
    ('chest', (0, -.28, 0), (0, -.02, 0), 'spine'),
]
for side, suffix in [(-1, 'L'), (1, 'R')]:
    bones.extend([
        ('arm' + suffix, (side * .435, -.055, 0), (side * .435, -.34, 0), 'chest'),
        ('forearm' + suffix, (side * .435, -.34, 0), (side * .435, -.595, .025), 'arm' + suffix),
        ('hand' + suffix, (side * .435, -.595, .025), (side * .435, -.735, .055), 'forearm' + suffix),
        ('thigh' + suffix, (side * .18, -.75, 0), (side * .18, -1.06, .015), 'pelvis'),
        ('shin' + suffix, (side * .18, -1.06, .015), (side * .18, -1.32, 0), 'thigh' + suffix),
        ('foot' + suffix, (side * .18, -1.32, 0), (side * .18, -1.47, .18), 'shin' + suffix),
    ])
for name, head, tail, parent in bones:
    bone = armature.edit_bones.new(name)
    bone.head, bone.tail = v(head), v(tail)
    if parent:
        bone.parent = armature.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
modifier = body.modifiers.new('Skeletal deformation', 'ARMATURE')
modifier.object = rig
body.parent = rig
body.matrix_parent_inverse = rig.matrix_world.inverted()

def set_pose(rotations, translation=(0, 0, 0)):
    for name, _, _, _ in bones:
        bone = rig.pose.bones[name]
        rotation = Quaternion((1, 0, 0, 0))
        for axis, angle in zip([(1, 0, 0), (0, 0, 1), (0, -1, 0)], rotations.get(name, (0, 0, 0))):
            rotation = rotation @ Quaternion(Vector(axis), angle)
        rest = bone.bone.matrix_local.to_quaternion()
        bone.rotation_mode = 'QUATERNION'
        bone.rotation_quaternion = rest.inverted() @ rotation @ rest
        bone.location = rest.inverted() @ v(translation) if name == 'pelvis' else (0, 0, 0)

def ease(a, b, t):
    u = max(0, min(1, (t-a)/(b-a)))
    return u*u*(3-2*u)

def planted_legs(pose, translation, targets):
    # Offline two-bone IK: support feet retain their contact height despite pelvis motion.
    # Solve in each leg's sagittal plane, then bake rotations; no runtime solver or new bones.
    for side, suffix in [(-1, 'L'), (1, 'R')]:
        y, z = targets[suffix]
        dy, dz = y - (-.75 + translation[1]), z - translation[2]
        upper, lower = math.hypot(.31,.015), math.hypot(.26,.015)
        d = min(upper+lower-.001, max(.15, math.hypot(dy,dz)))
        line = math.atan2(-dz,-dy)
        hip = line - math.acos(max(-1,min(1,(upper*upper+d*d-lower*lower)/(2*upper*d))))
        knee = math.pi-math.acos(max(-1,min(1,(upper*upper+lower*lower-d*d)/(2*upper*lower))))
        hip += math.atan2(.015,.31)
        knee -= math.atan2(.015,.31)+math.atan2(.015,.26)
        pose['thigh'+suffix]=(hip,0,-translation[0]*1.1)
        pose['shin'+suffix]=(knee,0,0)
        pose['foot'+suffix]=(-hip-knee,0,0)

def frame_pose(kind, t):
    pose = {}
    wave = math.sin(t * math.tau)
    shift = .027*math.sin(t*math.tau)
    translation = (0,0,0)
    if kind == 'idle':
        translation = (shift,-.035-.008*math.sin(t*math.tau*2),.009*math.sin(t*math.tau))
        pose['spine']=(.014*wave,.024*wave,-shift*.65)
        pose['chest']=(.025*math.sin(t*math.tau*2),-.018*wave,-shift*.4)
    elif kind == 'prepare':
        anticipation=ease(0,.65,t)*(1-ease(.65,1,t))
        translation=(.018*anticipation,-.07*anticipation,.025*anticipation)
        pose['chest']=(.12*anticipation,0,-.025*anticipation)
    elif kind == 'run':
        translation=(.012*wave,-.085+.025*math.cos(t*math.tau*2),0)
        pose['spine']=(.06,-.055*wave,.035*wave)
        pose['chest']=(.07,.035*wave,-.02*wave)
    elif kind == 'land':
        # 180 ms weight absorption, planted recovery by 650 ms.
        crouch=ease(0,.277,t)*(1-ease(.277,1,t))
        translation=(.018*crouch,-.19*crouch,.025*crouch)
        pose['chest']=(.18*crouch,0,-.035*crouch)
    elif kind == 'celebrate':
        cheer=ease(.02,.32,t)*(1-ease(.6,1,t))
        translation=(.022*cheer,-.03*cheer,0)
        pose['spine']=(-.035*cheer,.08*cheer,0)
        pose['chest']=(-.04*cheer,-.045*cheer,-.06*cheer)
    elif kind == 'exit':
        translation=(0,.045*math.sin(t*math.pi)*(1-ease(.5,1,t)),0)
        pose['spine']=(.10*math.sin(t*math.pi),.06*math.sin(t*math.pi),0)
    elif kind == 'freefall':
        pose['spine']=(.028*wave,.02*wave,.022*math.sin(t*math.tau+.6))
        pose['chest']=(-.015*wave,-.018*wave,0)
    elif kind == 'glide':
        pose['spine']=(.018*wave,.025*wave,.018*wave)
        pose['chest']=(-.014*wave,-.018*wave,-.012*wave)
    targets={}
    for side, suffix in [(-1, 'L'), (1, 'R')]:
        leg,knee,arm,elbow='thigh'+suffix,'shin'+suffix,'arm'+suffix,'forearm'+suffix
        phase=math.sin(t*math.tau+(0 if side<0 else math.pi))
        if kind in ['idle','prepare']:
            pose[arm]=(.035*phase, .025*wave, side*(.09+.035*phase))
            pose[elbow]=(-.12-.05*(phase+1),0,0)
            pose['hand'+suffix]=(.025*wave,0,side*.025*wave)
            targets[suffix]=(-1.32,0)
        elif kind=='run':
            cycle=(t+(0 if side<0 else .5))%1
            if cycle<.28:
                targets[suffix]=(-1.32,.42-cycle*3)
            else:
                f=(cycle-.28)/.72
                targets[suffix]=(-1.32+.24*math.sin(math.pi*f),-.42+.84*ease(0,1,f))
            pose[arm]=(-.62*phase,0,side*.16)
            pose[elbow]=(-.55-.20*max(0,phase),0,0)
        elif kind=='exit':
            spread=ease(.1,1,t)
            pose[leg]=(-.4*math.sin(t*math.pi)+.12*spread+side*.08*math.sin(t*math.pi),0,side*(.04+.22*spread))
            pose[knee]=(.9*math.sin(t*math.pi)+.72*spread,0,0)
            pose[arm]=(.32*spread,0,side*(.22+.86*spread))
            pose[elbow]=(-.45+.25*spread,0,0)
        elif kind=='freefall':
            pose[leg]=(.12+.07*phase,0,side*(.26+.025*wave))
            pose[knee]=(.72+.12*phase,0,0)
            pose['foot'+suffix]=(-.18-.035*phase,0,0)
            pose[arm]=(.32+.065*phase,0,side*(1.08+.045*phase))
            pose[elbow]=(-.2-.07*phase,0,0)
        elif kind in ['deploy','glide']:
            f=ease(0,1,t) if kind=='deploy' else 1
            pose[leg]=(.12*(1-f)+(-.28+.055*phase)*f,0,side*(.26-.14*f))
            pose[knee]=(.72*(1-f)+(.48+.07*phase)*f,0,0)
            pose[arm]=(.32*(1-f)+.025*phase*f,0,side*(1.08+1.57*f+.018*phase*f))
            pose[elbow]=(-.2*(1-f)-(.18+.035*phase)*f,0,-side*.1*f)
            pose['hand'+suffix]=(0,0,side*.15*f)
        elif kind=='land':
            pose[arm]=(-.25*crouch,0,side*(.85*(1-ease(0,.3,t))+.12))
            pose[elbow]=(-.30*crouch,0,0)
            targets[suffix]=(-1.32,0)
        elif kind=='celebrate':
            # One raised fist, opposite hand at the hip; return to a calm final pose.
            pose[arm]=(-.12*cheer,0,side*(.12+(2.15 if side<0 else .45)*cheer))
            pose[elbow]=(-.18-(.45 if side<0 else .55)*cheer,0,side*.08*cheer)
            targets[suffix]=(-1.32,0)
    if targets: planted_legs(pose,translation,targets)
    return pose,translation

rig.animation_data_create()
clip_lengths = {'idle': 6, 'prepare': 1.15, 'run': .72, 'exit': 1.1, 'freefall': 1.8, 'deploy': 1, 'glide': 2.4, 'land': .65, 'celebrate': 2.0}
scene = bpy.context.scene
scene.render.fps = 30
for name, seconds in clip_lengths.items():
    action = bpy.data.actions.new(name)
    rig.animation_data.action = action
    last = round(seconds * 30)
    for frame in range(0, last + 1, 2):
        scene.frame_set(frame)
        set_pose(*frame_pose(name, frame / last))
        for bone in rig.pose.bones:
            bone.keyframe_insert(data_path='location', frame=frame, group=bone.name)
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame, group=bone.name)
    if last % 2:
        scene.frame_set(last)
        set_pose(*frame_pose(name, 1))
        for bone in rig.pose.bones:
            bone.keyframe_insert(data_path='location', frame=last, group=bone.name)
            bone.keyframe_insert(data_path='rotation_quaternion', frame=last, group=bone.name)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    track.mute = True
rig.animation_data.action = None
set_pose({})
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = rig
scene.render.fps = 30
scene['runway_asset_contract'] = '15 bones; 3 materials; external LED head; orange Color mask is NFT accent'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'assets-source/runway-pilot.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, 'public/assets/models/runway-pilot.glb'), export_format='GLB',
    use_selection=True, export_yup=True, export_animations=True, export_animation_mode='ACTIONS',
    export_force_sampling=True, export_anim_single_armature=True, export_def_bones=True,
    export_nla_strips=True, export_materials='EXPORT')
triangles = sum(len(p.vertices) - 2 for p in body.data.polygons)
assert len(armature.bones) <= 16
assert len(materials) <= 4
assert triangles < 6500, triangles  # LED sphere adds ~1,500 triangles in the client.
assert sum(len(vertex.groups) > 1 for vertex in body.data.vertices) >= 100, 'Joint cloth must have blended skin weights'
assert all(name in bpy.data.actions for name in clip_lengths), 'Every gameplay pose must be authored'
print('RUNWAY_PILOT_AUDIT', json.dumps({'bones': len(armature.bones), 'triangles': triangles,
    'materials': len(materials), 'clips': list(clip_lengths), 'bodyBounds': [list(v.co) for v in body.data.vertices[:1]]}))
