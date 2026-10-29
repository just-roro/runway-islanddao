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

# Each rendered building stays inside its authoritative collider, including rooftop kit.
for b in layout['buildings']:
 x,z,w,d,h=b['x'],b['z'],b['w'],b['d'],b['h'];wall=max(2,h-2);accent=[mint,violet,coral][b['style']]
 box((x,wall*.5,z),(w,wall,d),cream,.3)
 for y in range(2,int(wall),3):
  for side in [-1,1]:
   box((x,y,z+side*(d*.5-.04)),(w*.78,.8,.06),ink)
   box((x+side*(w*.5-.04),y,z),(.06,.8,d*.7),ink)
 box((x,wall+.2,z),(w,.4,d),accent,.1)
 box((x,wall+1,z),(w*.48,1.2,d*.45),ink,.15)
 tube((x,wall+1.65,z),.1,.7,amber)
export('runway-city')
# Provisional event sector: local metres relative to Jurerê (0, 2, -100).
# Its collider envelopes remain in the unchanged shared world definition.
for original in layout['blockers']:
 b={**original,'z':original['z']+100}

 box((b['x'],b['h']/2,b['z']),(b['w'],b['h'],b['d']),coral,.3)
 box((b['x'],b['h']-.3,b['z']),(b['w'],.4,b['d']),amber,.1)
# Translate the authored geometry down to the destination's local ground origin.
for o in parts:o.location.z-=2
export('runway-jurere-provisional')
