const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let sites, buildings, blockAt, nearestRoads;
test.before(async () => {
  const layout = await import('../js/studio-layout.js');
  sites = layout.STUDIO_SITES; buildings = layout.createStudioLayout();
  ({ blockAt, nearestRoads } = await import('../js/city-config.js'));
});
function overlaps(a, b) { return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ; }
function bounds(b) { return { minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2 }; }
test('hero floorplans are distinct, bounded and have a clear entrance circulation', async () => {
  const { studioPlan } = await import('../js/studio-plans.js');
  const signatures = new Set();
  for (const b of buildings.filter(b => b.furnished)) {
    const rooms = studioPlan(b);
    for (const r of rooms) {
      assert.ok(r.x0 >= -b.w/2 && r.x1 <= b.w/2 && r.z0 >= -b.d/2 && r.z1 <= b.d/2, `${b.id}: ${r.name} inside walls`);
      assert.ok(r.x1-r.x0 >= 2.4 && r.z1-r.z0 >= 2.4, `${r.name} usable dimensions`);
      for (const other of rooms) if(other !== r) assert.ok(!overlaps({minX:r.x0,maxX:r.x1,minZ:r.z0,maxZ:r.z1},{minX:other.x0,maxX:other.x1,minZ:other.z0,maxZ:other.z1}), `${r.name} overlaps another room`);
      if(r.type!=='openLiving') assert.ok(r.x1<=-1 || r.x0>=1, `${r.name} obstructs entrance corridor`);
    }
    if(b.kind==='house') signatures.add(JSON.stringify(rooms.map(r=>[r.type,r.x0,r.x1,r.z0,r.z1])));
  }
  assert.equal(signatures.size,4);
});
async function loadSurvey(zone) {
  const source = fs.readFileSync(path.join(__dirname, '../js/building-geodata.js'), 'utf8')
    .replace('import.meta.url', "'https://test.local/js/building-geodata.js'")
    .replace('export const REAL_BUILDINGS', 'const REAL_BUILDINGS');
  let requested;
  const result = await new vm.Script(`(async()=>{${source}; return REAL_BUILDINGS})()`).runInNewContext({
    URL, Response, DecompressionStream, location: { href: `https://test.local/?zone=${zone}` },
    fetch: async url => { requested = url.pathname; return new Response(fs.readFileSync(path.join(__dirname, '..', requested))); }
  });
  return { result, requested };
}
test('projects occupy separate parcels and share one school, clinic and police station', () => {
  assert.ok(Math.hypot(sites[0].minX - sites[1].minX, sites[0].minZ - sites[1].minZ) > 4000);
  for (const kind of ['school', 'clinic', 'police']) assert.equal(buildings.filter(b => b.kind === kind).length, 1);
  for (const project of [32, 41]) assert.equal(buildings.filter(b => b.project === project && b.furnished).length, 2);
});
test('all structures fit their real curb island, avoid each other and leave the private road clear', () => {
  for (const b of buildings) {
    const site = sites.find(s => s.id === b.site), r = bounds(b);
    for (const x of [r.minX, r.maxX]) for (const z of [r.minZ, r.maxZ]) assert.equal(blockAt(x, z)?.id, site.blockId, `${b.id} inside parcel`);
    assert.ok(r.maxZ < site.laneZ - 7.5 || r.minZ > site.laneZ + 7.5, `${b.id} clears road and sidewalks`);
    for (const other of buildings) if (other !== b) assert.ok(!overlaps(r, bounds(other)), `${b.id} overlaps ${other.id}`);
  }
  for (const s of sites) for (const x of [s.minX - 4, s.maxX + 4]) {
    assert.ok(nearestRoads(x, s.laneZ, 30).some(r => r.dist < r.road.w / 2 + 3), `${s.id} lane meets a surveyed street`);
  }
});
test('regional survey shards preserve nearby footprints without fetching the whole city', async () => {
  for (const s of sites) {
    const { result, requested } = await loadSurvey(s.id);
    assert.equal(requested, `/js/building-geodata.${s.id}.bin.gz`);
    assert.ok(result.length > 100 && result.length < 2500);
    for (const b of result) {
      assert.ok(overlaps(b, { minX: s.minX - 420, maxX: s.maxX + 420, minZ: s.minZ - 420, maxZ: s.maxZ + 420 }));
      for (const set of buildings.filter(b => b.site === s.id)) assert.ok(!overlaps(b, bounds(set)), `${set.id} collides with a surveyed building`);
    }
  }
});
