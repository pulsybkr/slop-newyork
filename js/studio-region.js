import * as THREE from 'three/webgpu';
import { BLOCKS, MANHATTAN_COASTLINE } from './city-config.js';
import { STUDIO_SITES } from './studio-layout.js';
import { createRoadSurfaceMaterial, createSidewalkMaterial } from './tsl-materials.js';
import { createTreeField } from './trees.js';

export function getStudioRegion(id) {
  const site = STUDIO_SITES.find(s => s.id === id);
  return site ? { ...site, minX: site.minX - 420, maxX: site.maxX + 420, minZ: site.minZ - 420, maxZ: site.maxZ + 420 } : null;
}

export function buildStudioRegion(scene, region) {
  const group = new THREE.Group(); group.name = 'ManhattanCityGrid'; scene.add(group);
  const sidewalks = [], footprints = [], sites = [];
  function polygon(poly, y, material) {
    const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p.x, -p.z)));
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.receiveShadow = true; group.add(mesh);
  }
  // A single cheap land silhouette preserves the shoreline, but only this zone has detailed blocks.
  polygon(MANHATTAN_COASTLINE, 0, createRoadSurfaceMaterial());
  const water = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ color: 0x587e88, roughness: 0.35 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.1; group.add(water);
  const paving = createSidewalkMaterial();
  const grass = new THREE.MeshStandardMaterial({ color: 0x778265, roughness: 1 });
  for (const b of BLOCKS) {
    if (b.maxX < region.minX || b.minX > region.maxX || b.maxZ < region.minZ || b.minZ > region.maxZ) continue;
    sidewalks.push({ minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ });
    if (STUDIO_SITES.some(s => s.blockId === b.id)) continue;
    polygon(b.poly, 0.22, b.park > 0.6 ? grass : paving);
    // A few real-scale street trees per block, outside the property line.
    for (let x = b.minX + 10; x < b.maxX - 8; x += 32) {
      if (b.rect) for (const z of [b.minZ + 2, b.maxZ - 2]) sites.push({ x, z, y: 0.22, scale: 0.8, species: 0 });
    }
  }
  return { group, sidewalks, footprints, highwayLanes: [], colliders: [], treeSites: sites };
}

export function buildStudioStreetDetails(scene, grid, colliders) {
  const field = createTreeField(scene, grid.treeSites, colliders);
  const group = field.group; group.name = 'ManhattanStreetDetails'; scene.add(group);
  return { group, footprints: [], signalClock: { value: 0 }, signalIntersections: [], audioSignals: [],
    update: camera => field.update(camera.position) };
}
