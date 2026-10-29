import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Public low-poly modules. Keep each source's licence header intact.
const ids = [
  'wool-rug-ab2bd1',
  'sideboard-dd343b',
  'table-lamp-e25998',
  'shower-enclosure-a50c16',
  'low-media-unit-645e61',
  'office-desk-021eb3',
  'kitchen-island-47f4c8',
  'fridge-freezer-fb9b5a',
  'dining-chair-530532',
  'floor-houseplant-8fad17',
  'flat-screen-television-97b1f3',
  'framed-wall-art-d2c8a2',
  'curtain-panel-ee2ed9',
  'bar-stool-0de3c8',
  'yellow-school-bus-0fd3b6',
  'police-cruiser-a2d25e',
  'ambulance-van-29919a',
  'yard-basketball-post-b71ee3',
  'wall-clock-0c555c',
  'fire-extinguisher-74d502',
  'picnic-table-4ee33a',
  'bike-rack-a1e7c3',
  'exercise-book-stack-266d9d',
  'classroom-globe-16a96e',
  'filing-cabinet-f8a251',

  'sofa-9c0e7e', 'bed-6e10e8', 'office-chair-7c9874', 'desk-monitor-32cfce',
  'dining-table-7af83a', 'coffee-table-acc698', 'wardrobe-f3b2f2',
  'base-cabinet-run-71d050', 'vanity-basin-unit-3becd9', 'toilet-2edbd9',
  'pupil-table-1eebd1', 'stacking-pupil-chair-738aac', 'teaching-board-7ba611',
  'teacher-s-desk-381eeb', 'locker-bank-1784b8', 'folding-dining-table-7b68ce',
  'servery-counter-3afbb9', 'hospital-bed-31132d', 'vital-signs-monitor-632560',
  'examination-couch-1ab5b9', 'reception-desk-3d6913', 'waiting-room-chair-5e20cc',
  'park-bench-dc8b62', 'bedside-table-740c6b', 'alcove-bookcase-83894d'
];
const folder = new URL('../assets/polyfork/', import.meta.url);
await mkdir(folder, { recursive: true });
const manifest = [];
for (const id of ids) {
  const url = `https://polyfork.dev/cdn/${id}.mjs`;
  const file = new URL(`${id}.mjs`, folder);
  let source;
  try { source = await readFile(file, 'utf8'); } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
    source = await response.text();
    if (!source.includes('function createAsset')) throw new Error(`${id}: not an asset module`);
    await writeFile(file, source);
  }
  manifest.push({ id, source: url, page: `https://polyfork.dev/asset/${id}`, sha256: createHash('sha256').update(source).digest('hex') });
}
await writeFile(new URL('manifest.json', folder), JSON.stringify({ licence: 'https://polyfork.dev/licensing', assets: manifest }, null, 2) + '\n');
console.log(`${manifest.length} Polyfork modules ready.`);
