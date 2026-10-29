import fs from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { STUDIO_SITES } from '../js/studio-layout.js';

const nativeFetch = globalThis.fetch;
globalThis.fetch = async url => url.protocol === 'file:' ? new Response(await fs.readFile(url)) : nativeFetch(url);
const { REAL_BUILDINGS } = await import('../js/building-geodata.js');
const { REAL_TREES } = await import('../js/tree-geodata.js');
globalThis.fetch = nativeFetch;
function uint(out, value) { do { const b = value & 127; value >>>= 7; out.push(b | (value ? 128 : 0)); } while (value); }
for (const site of STUDIO_SITES) {
  const buildings = REAL_BUILDINGS.filter(b => b.maxX > site.minX - 420 && b.minX < site.maxX + 420 && b.maxZ > site.minZ - 420 && b.minZ < site.maxZ + 420);
  const metadata = [], xs = [], zs = []; let x = 0, z = 0;
  uint(metadata, buildings.length);
  for (const b of buildings) {
    uint(metadata, b.height); uint(metadata, b.year ? b.year / 10 - 159 : 0); uint(metadata, b.polygons.length);
    for (const p of b.polygons) {
      const rings = [p.outer, ...p.holes]; uint(metadata, rings.length);
      for (const ring of rings) {
        uint(metadata, ring.length);
        for (const pt of ring) {
          const nx = Math.round(pt.x * 2), nz = Math.round(pt.z * 2), dx = nx - x, dz = nz - z;
          uint(xs, ((dx << 1) ^ (dx >> 31)) >>> 0); uint(zs, ((dz << 1) ^ (dz >> 31)) >>> 0); x = nx; z = nz;
        }
      }
    }
  }
  const header = Buffer.alloc(12); header.writeUInt32LE(0x3142594e, 0); header.writeUInt32LE(metadata.length, 4); header.writeUInt32LE(xs.length, 8);
  const compressed = gzipSync(Buffer.concat([header, Buffer.from(metadata), Buffer.from(xs), Buffer.from(zs)]));
  await fs.writeFile(new URL(`../js/building-geodata.${site.id}.bin.gz`, import.meta.url), compressed);
  console.log(`${site.id}: ${buildings.length} buildings, ${compressed.length} bytes`);
  const txs = [], tzs = []; let tx = 0, tz = 0, count = 0;
  for (let i = 0; i < REAL_TREES.length; i += 2) {
    const px = REAL_TREES[i], pz = REAL_TREES[i + 1];
    if (px < site.minX - 420 || px > site.maxX + 420 || pz < site.minZ - 420 || pz > site.maxZ + 420) continue;
    const nx = Math.round(px * 2), nz = Math.round(pz * 2), dx = nx - tx, dz = nz - tz;
    uint(txs, ((dx << 1) ^ (dx >> 31)) >>> 0); uint(tzs, ((dz << 1) ^ (dz >> 31)) >>> 0); tx = nx; tz = nz; count++;
  }
  const th = Buffer.alloc(12); th.writeUInt32LE(0x3154594e, 0); th.writeUInt32LE(count, 4); th.writeUInt32LE(txs.length, 8);
  const trees = gzipSync(Buffer.concat([th, Buffer.from(txs), Buffer.from(tzs)]));
  await fs.writeFile(new URL(`../js/tree-geodata.${site.id}.bin.gz`, import.meta.url), trees);
  console.log(`${site.id}: ${count} trees, ${trees.length} bytes`);
}
