import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createStudioLayout, STUDIO_SITES, localToWorld, insideStudioSite } from './studio-layout.js';
import { loadStudioAssets } from './studio-assets.js';
import { studioPlan, schoolLockerLayout } from './studio-plans.js';
import { studioMaterials } from './studio-materials.js';
import { furnishStudioRoom, dressStudioExterior } from './studio-dressing.js';
import { createTreeField } from './trees.js';
import { cityUniforms } from './tsl-materials.js';

const FLOOR = 0.24;
export async function buildStudioSets(scene, selectedSite = null) {
  const asset = await loadStudioAssets();
  const root = new THREE.Group(); root.name = 'StudioSets'; scene.add(root);
  const colliders = [], sets = [], seats = [], shots = [], lights = [];
  const surfaces = studioMaterials();
  const streetLights = [], treeSites = [];
  const materials = new Map();
  const mat = color => {
    if (color?.isMaterial) return color;
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.86 }));
    return materials.get(color);
  };
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  function box(parent, x, y, z, w, h, d, color) {
    const geometry = unitBox.clone();
    const uv = geometry.attributes.uv;
    for (let i=0;i<uv.count;i++) { const face=Math.floor(i/4); uv.setXY(i,uv.getX(i)*(face<2?d:w)/2,uv.getY(i)*(face===2||face===3?d:h)/2); }
    const mesh = new THREE.Mesh(geometry, mat(color)); mesh.userData.studioBox=true;
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sign(parent, text, x, y, z, width, color = '#223c3d') {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
    const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 1024, 128);
    ctx.fillStyle = '#fff8e9'; ctx.font = '600 48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 64, 960);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 8), new THREE.MeshBasicMaterial({ map: texture }));
    m.position.set(x, y, z); parent.add(m); return m;
  }
  function mergeBoxes(parent) {
    const buckets = new Map();
    for (const mesh of [...parent.children]) {
      if (!mesh.userData.studioBox) continue;
      mesh.updateMatrix();
      if (!buckets.has(mesh.material)) buckets.set(mesh.material, []);
      buckets.get(mesh.material).push(mesh.geometry.clone().applyMatrix4(mesh.matrix));
      mesh.geometry.dispose();
      parent.remove(mesh);
    }
    for (const [material, parts] of buckets) {
      const mesh = new THREE.Mesh(mergeGeometries(parts), material);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
      for (const geometry of parts) geometry.dispose();
    }
  }
  function collider(b, x, y, z, w, h, d, extra = {}) {
    const p = localToWorld(b, x, z);
    const c = { minX: p.x - w / 2, maxX: p.x + w / 2, minZ: p.z - d / 2, maxZ: p.z + d / 2,
      minY: FLOOR + y - h / 2, maxY: FLOOR + y + h / 2, studio: b.id, ...extra };
    colliders.push(c); return c;
  }
  const definitions = createStudioLayout().filter(b => !selectedSite || b.site === selectedSite);
  for (const site of STUDIO_SITES.filter(s => !selectedSite || s.id === selectedSite)) {
    const w = site.maxX - site.minX, d = site.maxZ - site.minZ;
    const cx = (site.minX + site.maxX) / 2, cz = (site.minZ + site.maxZ) / 2;
    box(root, cx, 0.10, cz, w, 0.20, d, surfaces.lawn);
    // Perimeter walks meet the original curbs. The private lane joins both existing avenues.
    box(root, cx, 0.215, site.minZ + 2.5, w, 0.03, 5, surfaces.walk);
    box(root, cx, 0.215, site.maxZ - 2.5, w, 0.03, 5, surfaces.walk);
    for (const x of [site.minX + 2.5, site.maxX - 2.5]) box(root, x, 0.215, cz, 5, 0.03, d, surfaces.walk);
    box(root, cx, 0.215, site.laneZ, w, 0.03, 6, surfaces.road);
    for (const z of [site.laneZ - 4.2, site.laneZ + 4.2]) box(root, cx, 0.225, z, w, 0.03, 2.4, surfaces.walk);
    for (const z of [site.laneZ-3.1,site.laneZ+3.1]) box(root,cx,.24,z,w,.16,.18,surfaces.curb);
    for(let x=site.minX+9;x<site.maxX-5;x+=22) {
      for(const side of [-1,1]) {
        const z=site.laneZ+side*5.7;
        box(root,x,2.4,z,.12,4.5,.12,0x303c3b);
        box(root,x,4.6,z-side*.45,.12,.12,1,0x303c3b);
        box(root,x,4.5,z-side*.9,.5,.12,.3,0xe7d7ad);
        const light=new THREE.PointLight(0xffd6a0,0,14,2);light.position.set(x,4.35,z-side*.9);root.add(light);streetLights.push(light);
      }
      treeSites.push({x,z:site.minZ+12,y:FLOOR},{x,z:site.maxZ-12,y:FLOOR});
    }
    // No dashed centre line: a quiet shared residential street, with crossings at the mouths.
    for (const x of [site.minX + 5, site.maxX - 5]) for (let z = -3.6; z <= 3.6; z += 1.2) box(root, x, 0.237, site.laneZ + z, 3, 0.01, 0.65, 0xe9e2ce);
  }

  for (const b of definitions) {
    const group = new THREE.Group(); group.name = b.id; group.position.set(b.x, FLOOR, b.z); group.rotation.y = b.rotation; root.add(group);
    const shell = new THREE.Group(), roof = new THREE.Group(), interior = new THREE.Group();
    group.add(shell, roof, interior);
    const set = { ...b, group, shell, roof, interior, furnished: false, populate: null, doors: [], rooms: [], anchors: [], lights: [] };
    sets.push(set);
    const H = b.kind === 'house' ? 3.1 : 3.6, W = b.w, D = b.d;
    const facade = b.project === 41 || b.kind === 'clinic' ? surfaces.paleBrick : surfaces.brick;
    function solid(parent, x, y, z, w, h, d, color, collision = true) {
      const o = box(parent, x, y, z, w, h, d, color);
      if (collision) collider(b, x, y, z, w, h, d);
      if(parent===shell && color===facade) {
        if(Math.abs(z)===D/2) box(shell,x,y,z-Math.sign(z)*.12,w,h,.025,surfaces.plaster);
        else if(Math.abs(x)===W/2) box(shell,x-Math.sign(x)*.12,y,z,.025,h,d,surfaces.plaster);
      }
      return o;
    }
    const wall = (x, z, length, alongX = true, color = facade) => solid(shell, x, H / 2, z, alongX ? length : 0.2, H, alongX ? 0.2 : length, color);
    function doorway(x, z, length, alongX = true, interactive = true, color = facade) {
      const opening = 1.6, side = (length - opening) / 2;
      for (const dir of [-1, 1]) wall(x + (alongX ? dir * (opening + side) / 2 : 0), z + (alongX ? 0 : dir * (opening + side) / 2), side, alongX, color);
      solid(shell, x, (H + 2.5) / 2, z, alongX ? opening : 0.2, H - 2.5, alongX ? 0.2 : opening, color);
      if (!interactive) return;
      const pivot = new THREE.Group();
      pivot.position.set(x - (alongX ? opening / 2 : 0), 0, z + (alongX ? 0 : opening / 2));
      pivot.rotation.y = alongX ? 0 : Math.PI / 2; group.add(pivot);
      box(pivot, opening / 2, 1.22, 0, opening - 0.08, 2.44, 0.07, 0x526c68);
      box(pivot, opening - 0.22, 1.05, 0.07, 0.06, 0.12, 0.08, 0xc7b88a);
      // Static closed-door obstacle is disabled only once the opening is clear.
      const c = collider(b, x, 1.22, z, alongX ? opening : 0.12, 2.44, alongX ? 0.12 : opening);
      const p = localToWorld(b, x, z);
      set.doors.push({ pivot, base: pivot.rotation.y, x: p.x, z: p.z, collider: c, angle: 0 });
    }
    function windowWall(x, z, length, alongX) {
      const opening = Math.min(2.8, length - 0.8), side = (length - opening) / 2;
      for (const dir of [-1, 1]) wall(x + (alongX ? dir * (opening + side) / 2 : 0), z + (alongX ? 0 : dir * (opening + side) / 2), side, alongX);
      for (const [y, h] of [[0.5, 1], [(H + 2.5) / 2, H - 2.5]]) solid(shell, x, y, z, alongX ? opening : 0.2, h, alongX ? 0.2 : opening, facade);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(alongX ? opening : 0.04, 1.5, alongX ? 0.04 : opening),
        new THREE.MeshPhysicalMaterial({ color: 0xc8e0df, transparent: true, opacity: 0.20, roughness: 0.2, depthWrite: false }));
      glass.position.set(x, 1.75, z); shell.add(glass);
      collider(b, x, 1.75, z, alongX ? opening : 0.08, 1.5, alongX ? 0.08 : opening);
      for (const y of [1, 2.5]) box(shell, x, y, z, alongX ? opening + 0.12 : 0.3, 0.1, alongX ? 0.3 : opening + 0.12, 0xe5dfcd);
      box(shell, x, 1.75, z, alongX ? 0.08 : 0.25, 1.5, alongX ? 0.25 : 0.08, 0xe5dfcd);
    }
    solid(shell, 0, -0.05, 0, W, 0.1, D, b.project === 41 ? surfaces.lightWood : surfaces.wood, false);
    // Front and rear have actual door holes; side windows face the gardens.
    doorway(0, D / 2, 4, true, b.furnished);
    for (const side of [-1, 1]) windowWall(side * (W / 4 + 1), D / 2, W / 2 - 2, true);
    if (b.furnished) doorway(0, -D / 2, W, true); else wall(0, -D / 2, W);
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) windowWall(side * W / 2, -D / 2 + (i + 0.5) * D / 4, D / 4, false);
    if (!b.furnished) {
      solid(shell, 0, 1.22, D / 2, 1.6, 2.44, 0.1, 0x526c68);
      collider(b, 0, H / 2, 0, W, H, D);
    }
    box(roof, 0, H + 0.12, 0, W + 0.7, 0.24, D + 0.7, surfaces.slate);
    if (b.style === 'gable') {
      const angle = 0.32, span = W / 2 + 0.5;
      for (const side of [-1,1]) {
        const shape=new THREE.Shape();shape.moveTo(-W/2,0);shape.lineTo(W/2,0);shape.lineTo(0,Math.tan(angle)*W/2);shape.closePath();
        const cap=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(b.color));cap.material.side=THREE.DoubleSide;cap.position.set(0,H+3.14,side*(D/2));roof.add(cap);
      }
      for (const side of [-1, 1]) {
        const panel = box(roof, side * W / 4, H + 0.24 + Math.sin(angle) * span / 2, 0, span / Math.cos(angle), 0.14, D + 0.9, surfaces.slate);
        panel.rotation.z = -side * angle;
      }
    }
    if(b.kind === 'house') sign(shell,b.id.split('-').at(-1),1.1,1.8,D/2+.16,.32);
    else sign(shell,b.name,2.3,1.65,D/2+.16,1.8);
    // Upper floor facade is removable together with the roof for shot preparation.
    const roofPanels=[...roof.children];
    if (b.kind === 'house' || b.kind === 'school') {
      for(const side of [-1,1]) {
        box(roof,0,H+1.45,side*D/2,W,2.9,.22,facade);
        box(roof,side*W/2,H+1.45,0,.22,2.9,D,facade);
        for(let x=-W/2+1.6;x<W/2-1;x+=2.7) {
          box(roof,x,H+1.5,side*(D/2+.14),1.45,1.7,.12,0xd6d0be);
          box(roof,x,H+1.5,side*(D/2+.22),1.22,1.48,.06,0x536269);
          box(roof,x,H+1.5,side*(D/2+.27),.06,1.48,.05,0xd6d0be);
          box(roof,x,H+.6,side*(D/2+.28),1.6,.12,.32,surfaces.curb);
        }
      }
      for(const child of roofPanels) if(child.userData.studioBox && child.position.y < H+2 && child.position.y > H) child.position.y+=2.9;
      box(roof,0,H+.04,0,W,.08,D,surfaces.plaster);
      box(roof,0,H+2.95,0,W+.5,.18,D+.5,surfaces.slate);
    }
    // Plinth, cornice and a shallow porch give the new facades a readable domestic scale.
    for (const y of [0.16, H - 0.06]) for (const side of [-1, 1]) {
      box(shell, side * W / 2, y, 0, 0.28, 0.14, D + 0.2, 0xded7c6);
      for (const sx of [-1, 1]) box(shell, sx * (W / 4 + 0.45), y, side * D / 2, W / 2 - 0.9, 0.14, 0.28, 0xded7c6);
    }
    box(roof, 0, 2.65, D / 2 + 1, 3.4, 0.15, 2.2, 0xe3dccb);
    // A clear path from each front door to its street; institutional paths are pedestrian-only.
    const site = STUDIO_SITES.find(s => s.id === b.site);
    const front = localToWorld(b, 0, D / 2 + 0.3);
    const endZ = site.laneZ + (front.z < site.laneZ ? -5.3 : 5.3);
    box(root, front.x, 0.225, (front.z + endZ) / 2, b.kind === 'house' ? 2 : 3, 0.03, Math.abs(endZ - front.z), surfaces.walk);
    if (b.kind === 'house') {
      // Garden boundaries stop before the entrance walk and private lane.
      for (const sx of [-(W/2+2), W/2+2]) solid(shell, sx, 0.45, 0, 0.15, 0.9, D + 7, surfaces.brick);
      box(shell, -4, 0.23, D / 2 + 3, 3.5, 0.45, 1.2, 0x5d7755);
    }
    function room(name, x, z, w, d, color) {
      const r = { id: `${b.id}-${name}`, name, x, z, w, d, color }; set.rooms.push(r);
      box(shell, x, 0.006, z, w - 0.12, 0.012, d - 0.12, color);
      const wp = localToWorld(b, x, z);
      const cp = localToWorld(b, x + Math.min(2, w * 0.3), z + Math.min(2.5, d * 0.3));
      shots.push({ id: r.id, name: `${b.name} · ${name}`, set: b.id,
        position: [cp.x, FLOOR + 1.65, cp.z], target: [wp.x, FLOOR + 1.25, wp.z], fov: 58 });
      return r;
    }
    if (b.furnished) {
      const edges = new Set();
      for(const plan of studioPlan(b)) {
        const rw=plan.x1-plan.x0, rd=plan.z1-plan.z0;
        const r=room(plan.name,(plan.x0+plan.x1)/2,(plan.z0+plan.z1)/2,rw,rd,/bath|care/.test(plan.type)?surfaces.tile:b.project===41?surfaces.lightWood:surfaces.wood);
        Object.assign(r,plan);
        const walls=[['left',plan.x0,r.z,rd,false],['right',plan.x1,r.z,rd,false],['back',r.x,plan.z0,rw,true],['front',r.x,plan.z1,rw,true]];
        for(const [side,x,z,length,alongX] of walls) {
          if(Math.abs(x)===W/2&&!alongX || Math.abs(z)===D/2&&alongX) continue;
          const key=[x,z,length,alongX].join(':'); if(edges.has(key))continue;edges.add(key);
          if(side===plan.door || plan.type==='openLiving' && side==='back') doorway(x,z,length,alongX,false,plan.paint); else wall(x,z,length,alongX,plan.paint);
        }
        // Painted interior lining below windows and a continuous skirting board.
        for(const side of [-1,1]) if(Math.abs(r.x+side*rw/2)===W/2) {
          box(shell,r.x+side*(rw/2-.13),.45,r.z,.035,.88,rd-.15,plan.paint);
          box(shell,r.x+side*(rw/2-.16),.06,r.z,.05,.12,rd-.15,0xe3dccd);
        }
      }
    }
    function place(key, x, z, rotation = 0, y = 0, action = null, options = null) {
      const o = asset(key, options); o.position.set(x, y, z); o.rotation.y = rotation; interior.add(o);
      o.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(o);
      const c = { minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z,
        minY: bounds.min.y, maxY: bounds.max.y, studio: b.id, interior: true };
      if (bounds.max.y > FLOOR + 0.25) colliders.push(c);
      if (action) {
        const p = localToWorld(b, x, z);
        const a = { id: `${b.id}-${key}-${set.anchors.length}`, action, position: [p.x, FLOOR + y + (action === 'sleep' ? 0.55 : 0.45), p.z], heading: b.rotation + rotation };
        a.set = b.id; set.anchors.push(a); seats.push(a);
      }
      return o;
    }
    set.populate = () => {
      if (set.furnished || !b.furnished) return;
      set.furnished = true;
      for (const r of set.rooms) {
        const x = r.x, z = r.z;
        furnishStudioRoom({b,r,place,box:(...args)=>box(interior,...args),surfaces,H});
        const positions = r.w > 10 ? [[-r.w / 4, -r.d / 4], [r.w / 4, -r.d / 4], [-r.w / 4, r.d / 4], [r.w / 4, r.d / 4]] : [[0, 0]];
        for (const [dx, dz] of positions) {
          const light = new THREE.PointLight(b.kind === 'house' ? 0xffe5bd : 0xe6f0ff, 18, Math.max(r.w, r.d) * 1.8, 2);
          light.position.set(x + dx, H - 0.35, z + dz); interior.add(light); lights.push(light); set.lights.push(light);
          const fixture = box(interior, x + dx, H - 0.15, z + dz, 0.9, 0.08, 0.5, 0xf1eddb);
          fixture.material.emissive.setHex(0xffedce); fixture.material.emissiveIntensity = 0.7;
        }
      }
      if(b.kind==='school') for(const bank of schoolLockerLayout(set.rooms)) {
        const locker = place('locker',bank.x,bank.z,bank.rotation,0,null,
          { rows: 1, columns: 3, doors: 'shut', colorway: 'powder-blue' });
        locker.userData.studioLocker = true;
      }
      if(b.kind!=='house') {place('extinguisher',-.65,D/2-1,0,.55);place('clock',0,D/2-.15,Math.PI,2.5);}
      root.updateMatrixWorld(true);
    };
    set.unload = () => {
      if (!set.furnished) return;
      // Clone geometries/materials belong to the shared asset cache; keep them there.
      interior.traverse(o=>{if(o.userData.studioBox)o.geometry.dispose();});
      interior.clear();
      for (let i = colliders.length - 1; i >= 0; i--) if (colliders[i].studio === b.id && colliders[i].interior) colliders.splice(i, 1);
      for (let i = seats.length - 1; i >= 0; i--) if (seats[i].set === b.id) seats.splice(i, 1);
      for (const light of set.lights) { const i = lights.indexOf(light); if (i >= 0) lights.splice(i, 1); }
      set.lights.length = 0; set.anchors.length = 0; set.furnished = false;
    };
    if(b.furnished && b.kind!=='house') {
      const from=localToWorld(b,0,D/2-2),to=localToWorld(b,0,-D/2+2);
      shots.push({id:b.id+'-hall',name:b.name+' ? Couloir',set:b.id,position:[from.x,FLOOR+1.65,from.z],target:[to.x,FLOOR+1.65,to.z],fov:62});
    }
    const exterior = localToWorld(b, W * 0.9, D * 1.5);
    shots.push({ id: `${b.id}-exterior`, name: `${b.name} · Extérieur`, set: b.id,
      position: [exterior.x, 5.5, exterior.z], target: [b.x, 1.8, b.z], fov: 52 });
    dressStudioExterior({b,shell,roof,box,asset,surfaces,treeSites,localToWorld,FLOOR,colliders});
    mergeBoxes(shell); mergeBoxes(roof);
  }
  const trees = createTreeField(root, treeSites.map((t,i)=>({...t,scale:.65,species:i%3})), colliders);
  root.add(trees.group);
  mergeBoxes(root);
  root.updateMatrixWorld(true);
  return { root, colliders, sets, seats, shots, floor: FLOOR, inside: insideStudioSite,
    update(position, cutaway = false, dt = 0.016, lightGain = 1) {
      let changed = false;
      trees.update(position);
      const nearestLamps=new Set([...streetLights].sort((a,b)=>a.position.distanceToSquared(position)-b.position.distanceToSquared(position)).slice(0,8));
      for(const light of streetLights) {light.visible=nearestLamps.has(light)&&Math.hypot(position.x-light.position.x,position.z-light.position.z)<90;light.intensity=Math.max(0,cityUniforms.uInteriorGlow.value-.6)*65;}

      for (const set of sets) {
        const distance = Math.hypot(position.x - set.x, position.z - set.z);
        set.group.visible = distance < 900;
        if (distance < 100 && !set.furnished) { const before = colliders.length; set.populate(); changed ||= colliders.length !== before; }
        if (distance > 160 && set.furnished) { set.unload(); changed = true; }
        set.interior.visible = distance < 120;
        for (const light of set.lights) {
          light.visible = distance < 35;
          light.intensity = (set.kind === 'house' ? 9 : 16) * lightGain * (1 + Math.max(0, cityUniforms.uInteriorGlow.value - 0.6));
        }
        set.roof.visible = !cutaway;
        for (const door of set.doors) {
          const target = Math.hypot(position.x - door.x, position.z - door.z) < 3.2 ? Math.PI / 2 : 0;
          door.angle += (target - door.angle) * Math.min(1, dt * 7);
          door.pivot.rotation.y = door.base + door.angle;
          door.collider.minY = door.angle > 1.1 ? 10000 : FLOOR;
          door.collider.maxY = door.angle > 1.1 ? 10001 : FLOOR + 2.44;
          door.pivot.updateMatrixWorld(true);
        }
      }
      return changed;
    }
  };
}
