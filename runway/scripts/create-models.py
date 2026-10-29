import bpy, math, json, os, sys
from mathutils import Vector
OUT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../public/assets/models'))
layout=json.load(open(os.path.join(os.path.dirname(__file__),'world-layout.json')))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
palette={};parts=[]
def mat(c):
 if c not in palette:
  m=bpy.data.materials.new(c);m.diffuse_color=tuple(((int(c[i:i+2],16)/255+.055)/1.055)**2.4 if int(c[i:i+2],16)/255>.04045 else int(c[i:i+2],16)/255/12.92 for i in (1,3,5))+(1,);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=m.diffuse_color;m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.65;palette[c]=m
 return palette[c]
# Author in Three axes (Y up), convert to Blender Z up. Export restores Y up.
def box(p,s,c,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Machined edges','BEVEL');mod.width=min(bevel,min(s)*.2);mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
 o.data.materials.append(mat(c));parts.append(o);return o
def sphere(p,s,c):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);o.data.materials.append(mat(c));parts.append(o);return o
def tube(p,r,depth,c,axis='y'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=depth,location=(p[0],-p[2],p[1]));o=bpy.context.object
 if axis=='z':o.rotation_euler.x=math.pi/2
 if axis=='x':o.rotation_euler.y=math.pi/2
 o.data.materials.append(mat(c));parts.append(o);return o
def export(name):
 # Bake palette to vertex colour and join: one material / one draw per asset.
 for o in parts:
  bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  color=o.data.materials[0].diffuse_color;attr=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
  for d in attr.data:d.color=color
  o.data.materials.clear()
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 m=bpy.data.materials.new(name+' paint');m.use_nodes=True;n=m.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='Color';m.node_tree.links.new(n.outputs['Color'],m.node_tree.nodes['Principled BSDF'].inputs['Base Color']);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.65;o.data.materials.append(m)
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'../../../assets-source',name+'.blend'))
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_yup=True)
 bpy.ops.object.delete();parts.clear()
cream='#e6e8d8';ink='#123c50';metal='#648590';amber='#ffc654';coral='#fb7456';mint='#62dac3';violet='#9585df'
# Aircraft uses Three axes. Rear aperture: x ±3, y 0…4.12, frame z -.09….55.
# Hatch pivot and outer doorway dimensions are shared with the camera/exit contract.
# Side/ceiling dressing stays behind z=.55 and outside the clear central aisle.
def aircraft_export(name):
 # Three static surfaces, shared vertex colours: no texture requests or extra meshes.
 # Keep the ordinary export() untouched for the city and pilot generators below.
 metals={metal,'#a7bac2','#ad7953','#81969d'}
 rubber={ink,'#071b28','#263b47','#3d4f59'}
 materials=[]
 for label,rough,metalness in [('Painted alloy',.52,.14),('Brushed metal',.3,.68),('Rubber and fabric',.86,0)]:
  m=bpy.data.materials.new(name+' '+label);m.use_nodes=True
  n=m.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='Color'
  bsdf=m.node_tree.nodes['Principled BSDF'];m.node_tree.links.new(n.outputs['Color'],bsdf.inputs['Base Color'])
  bsdf.inputs['Roughness'].default_value=rough;bsdf.inputs['Metallic'].default_value=metalness;materials.append(m)
 for o in parts:
  bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  source=o.data.materials[0];color=source.diffuse_color
  attr=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
  for d in attr.data:d.color=color
  category=1 if source.name in metals else 2 if source.name in rubber else 0
  o.data.materials.clear();o.data.materials.append(materials[category])
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
 o.data.calc_loop_triangles();triangles=len(o.data.loop_triangles)
 assert triangles <= (5200 if name=='runway-aircraft' else 800), 'Aircraft detail exceeded its geometry budget'
 assert len(o.data.materials)<=3, 'Aircraft exceeded three surfaces'
 # No backup writes to unrelated source assets; the .blend is the reproducible master.
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'../../../assets-source',name+'.blend'))
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_yup=True)
 o.data.calc_loop_triangles();print(name,'triangles',len(o.data.loop_triangles),'materials',len(o.data.materials))
 bpy.ops.object.delete();parts.clear()

def rib_segment(a,b,z,width=.11):
 # Rectangular low-poly strut rather than bevelled tubes: the silhouette does the work.
 dx,dy=b[0]-a[0],b[1]-a[1]
 o=box(((a[0]+b[0])/2,(a[1]+b[1])/2,z),(math.hypot(dx,dy),width,.14),'#a7bac2')
 o.rotation_euler.y=-math.atan2(dy,dx)

box((0,-.25,16),(7,.5,34),cream,.18)
for side in [-1,1]:
 box((side*3.5,2.2,17),(.28,4.5,33),cream,.08)
 box((side*3.67,2,17),(.12,.6,30),coral)
 # Dark, shallow inset wall panels reveal the metal ribs through contrast.
 for z in range(3,31,3):
  box((side*3.335,2.35,z),(.035,3.48,2.72),'#3d4f59')
  box((side*3.27,.72,z),(.08,1.04,2.69),'#c4d0ca')
  box((side*2.78,.65,z),(.78,.22,1.95),ink)
  box((side*3.68,2.9,z),(.06,.8,1.2),ink)
 # Continuous rails and two service conduits, held off the wall by the ribs.
 box((side*3.2,1.33,15),(.15,.1,28),'#a7bac2')
 tube((side*3.02,3.25,15),.045,27,'#ad7953','z')
 tube((side*2.69,3.91,15),.055,27,'#a7bac2','z')
 # Equipment lockers and latches near the camera, safely outside the aisle.
 for z in [2.2,5.2,8.2]:
  box((side*3.18,1.88,z),(.19,.62,.74),'#81969d',.025)
  box((side*3.07,1.88,z),(.035,.35,.51),'#263b47')
  box((side*3.04,1.88,z+.18),(.025,.21,.04),'#a7bac2')
 # Wing with taper segments, nacelle + intake + exhaust.
 box((side*9,.4,20),(12,.45,5.5),cream,.12)
 box((side*17,.7,21),(6,.3,3.4),cream,.1)
 box((side*21,1.5,22),(.3,2,2.5),coral,.08)
 for x in [8,14]:
  tube((side*x,-1,20),1.25,4.5,ink,'z');tube((side*x,-1,17.7),1.28,.3,metal,'z');tube((side*x,-1,17.5),.85,.12,'#071b28','z')
box((0,4.4,16),(7,.28,32),cream,.1);sphere((0,2,34),(3.5,2.6,5),cream)
box((0,3,33),(5,.8,2),ink,.2);box((0,5,29),(.35,5,4),coral,.1);box((0,4.3,29),(12,.3,3),cream,.1)
# Faceted, arch-shaped structural frames make the box cabin read as a cargo fuselage.
arch=[(-3.21,.1),(-3.21,3.15),(-2.7,3.87),(-1.9,4.14),(1.9,4.14),(2.7,3.87),(3.21,3.15),(3.21,.1)]
for z in [2,5,8,11,14,17,20,23,26,29]:
 for a,b in zip(arch,arch[1:]):rib_segment(a,b,z)
# Recessed cargo flooring: muted metal seams and inset tie-down plates, never yellow.
box((0,.02,6),(5.6,.05,12),'#263b47');box((0,-.28,-1),(6,.25,2),metal,.1)
for z in [1,3,5,7,9,11]:
 for x in [-1.05,1.05]:
  box((x,.052,z),(2.04,.012,1.92),'#3d4f59')
 for x in [-2.25,2.25]:
  box((x,.062,z),(.38,.018,.49),'#a7bac2')
  box((x,.073,z),(.2,.008,.27),'#263b47')
for x in [-2.55,2.55]:box((x,.058,6),(.07,.014,12),'#81969d')
# Shared rear aperture remains unchanged. Solid jamb/header close all hatch seams.
for side in [-1,1]:
 box((side*3.32,2.25,.23),(.64,4.5,.64),cream,.04)
 box((side*3.03,2.06,.04),(.06,4.12,.18),metal,.012)
box((0,4.33,.23),(6.64,.42,.64),cream,.04)
box((0,4.15,.04),(6.06,.06,.18),metal,.012)
box((0,-.07,.02),(6.64,.14,.7),metal,.02)
for z in [2,5,8,11]:
 box((0,4.045,z),(1.9,.13,.45),ink,.04)
 box((0,3.97,z),(1.55,.035,.27),'#fff1cf',.012)
# Service panels at the ceiling centre provide definition without hanging into the camera path.
for z in [3.5,6.5,9.5]:
 box((0,4.235,z),(1.55,.03,1.4),'#c4d0ca')
 for side in [-1,1]:box((side*.65,4.209,z),(.03,.01,1.1),'#81969d')
aircraft_export('runway-aircraft')
# Separately articulated hatch with the original exact hinge, closed bounds and sweep.
box((0,2.09,-.22),(6.2,4.22,.22),cream,.025)
for x in [-2.75,2.75]:box((x,2.07,-.365),(.14,3.78,.07),metal,.015)
box((0,2.07,-.365),(5.4,.12,.07),metal,.015)
for y in [.5,1.2,2.8,3.5]:box((0,y,-.35),(5.4,.07,.04),metal,.008)
box((0,2.07,-.104),(5.68,3.7,.025),'#c4d0ca',.015)
# Inset reinforcement and shallow handles face into the cabin; no protruding latch at the exit.
for x in [-2.3,2.3]:
 box((x,2.09,-.093),(.12,3.32,.012),'#81969d')
 box((x,1.8,-.091),(.27,.15,.01),'#263b47')
for y in [.6,1.34,2.08,2.82,3.56]:box((0,y,-.091),(4.4,.045,.01),'#a7bac2')
for x in [-2.6,-1.3,0,1.3,2.6]:tube((x,.02,-.16),.075,.5,metal,'x')
aircraft_export('runway-hatch')
print('RUNWAY aircraft and hatch exported. Rebuild city with create-city.py and rigged pilot with create-pilot.py.')
