// Fictional filming locations over selected park parcels, in the city's metre frame.
// The surrounding surveyed streets and buildings are retained.
export const STUDIO_SITES = [
  { id: 'rennrat', project: 32, name: 'Rennrat · Clinton Gardens', blockId: 1131,
    minX: -1873, maxX: -1693, minZ: -955, maxZ: -805, laneZ: -901,
    palette: [0xc9baa0, 0xb9c5bd, 0xc3b1a6], style: 'gable' },
  { id: 'herytstory', project: 41, name: 'Herytstory · East Village Gardens', blockId: 1874,
    minX: 1289, maxX: 1501, minZ: 2623, maxZ: 2767, laneZ: 2686,
    palette: [0xd9d1bd, 0xbcc9ca, 0xc7b39c], style: 'terrace' }
];

export function insideStudioSite(x, z, padding = 0) {
  return STUDIO_SITES.find(s => x >= s.minX - padding && x <= s.maxX + padding && z >= s.minZ - padding && z <= s.maxZ + padding);
}

export function createStudioLayout() {
  const buildings = [];
  for (const site of STUDIO_SITES) {
    const count = site.project === 32 ? 8 : 9;
    for (let i = 0; i < count; i++) {
      buildings.push({ id: `${site.id}-house-${i + 1}`, site: site.id, project: site.project,
        name: `${site.project === 32 ? 'Rennrat' : 'Herytstory'} · Maison ${i + 1}`,
        kind: 'house', x: site.minX + 16 + i * 22, z: site.laneZ - 17,
        w: i === 1 ? 12 : 11, d: i === 1 ? 12 : 11, rotation: 0, furnished: i < 2, color: site.palette[i % 3], style: site.style });
    }
    if (site.project === 41) for (let i = 0; i < 5; i++) {
      buildings.push({ id: `herytstory-neighbour-${i + 1}`, site: site.id, project: 41,
        name: `East Village · Voisin ${i + 1}`, kind: 'house', x: site.minX + 35 + i * 34,
        z: site.laneZ + 17, w: 12, d: 12, rotation: Math.PI, furnished: false,
        color: site.palette[(i + 1) % 3], style: 'terrace' });
    }
  }
  // No matching school/hospital/police facade is identified in the park parcels.
  // Purpose-built shared sets avoid mislabelling an arbitrary surveyed building.
  buildings.push(
    { id: 'shared-school', site: 'rennrat', name: 'École commune', kind: 'school', x: -1731, z: -864, w: 25, d: 22, rotation: Math.PI, furnished: true, color: 0xc7b394 },
    { id: 'shared-clinic', site: 'rennrat', name: 'Centre médical commun', kind: 'clinic', x: -1844, z: -864, w: 20, d: 18, rotation: Math.PI, furnished: true, color: 0xb7c7c5 },
    { id: 'shared-police', site: 'rennrat', name: 'Commissariat commun', kind: 'police', x: -1783, z: -864, w: 18, d: 17, rotation: Math.PI, furnished: true, color: 0xb9b8af },
    { id: 'shared-reception', site: 'herytstory', name: 'Réception et café', kind: 'reception', x: 1474, z: 2720, w: 22, d: 20, rotation: Math.PI, furnished: true, color: 0xc9b599 }
  );
  // Reserve the reception's plot instead of placing a house through it.
  return buildings.filter(b => b.id !== 'herytstory-neighbour-5');
}

export function localToWorld(b, x, z) {
  const c = Math.cos(b.rotation), s = Math.sin(b.rotation);
  return { x: b.x + x * c + z * s, z: b.z - x * s + z * c };
}
