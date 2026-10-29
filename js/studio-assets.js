// Templates are constructed once; clones share their geometry and materials.
const ASSETS = {
  rug: 'wool-rug-ab2bd1',
  sideboard: 'sideboard-dd343b',
  lamp: 'table-lamp-e25998',
  shower: 'shower-enclosure-a50c16',
  media: 'low-media-unit-645e61',
  officeDesk: 'office-desk-021eb3',
  island: 'kitchen-island-47f4c8',
  fridge: 'fridge-freezer-fb9b5a',
  diningChair: 'dining-chair-530532',
  plant: 'floor-houseplant-8fad17',
  tv: 'flat-screen-television-97b1f3',
  art: 'framed-wall-art-d2c8a2',
  curtain: 'curtain-panel-ee2ed9',
  stool: 'bar-stool-0de3c8',
  bus: 'yellow-school-bus-0fd3b6',
  cruiser: 'police-cruiser-a2d25e',
  ambulance: 'ambulance-van-29919a',
  hoop: 'yard-basketball-post-b71ee3',
  clock: 'wall-clock-0c555c',
  extinguisher: 'fire-extinguisher-74d502',
  picnic: 'picnic-table-4ee33a',
  bikeRack: 'bike-rack-a1e7c3',
  books: 'exercise-book-stack-266d9d',
  globe: 'classroom-globe-16a96e',
  filing: 'filing-cabinet-f8a251',

  sofa: 'sofa-9c0e7e', bed: 'bed-6e10e8', chair: 'office-chair-7c9874',
  monitor: 'desk-monitor-32cfce', table: 'dining-table-7af83a', coffee: 'coffee-table-acc698',
  wardrobe: 'wardrobe-f3b2f2', kitchen: 'base-cabinet-run-71d050',
  basin: 'vanity-basin-unit-3becd9', toilet: 'toilet-2edbd9',
  pupilTable: 'pupil-table-1eebd1', pupilChair: 'stacking-pupil-chair-738aac',
  board: 'teaching-board-7ba611', desk: 'teacher-s-desk-381eeb', locker: 'locker-bank-1784b8',
  dining: 'folding-dining-table-7b68ce', servery: 'servery-counter-3afbb9',
  hospitalBed: 'hospital-bed-31132d', vital: 'vital-signs-monitor-632560',
  examination: 'examination-couch-1ab5b9', reception: 'reception-desk-3d6913',
  waiting: 'waiting-room-chair-5e20cc', bench: 'park-bench-dc8b62',
  bedside: 'bedside-table-740c6b', bookcase: 'alcove-bookcase-83894d'
};

export async function loadStudioAssets() {
  const templates = new Map(), factories = new Map();
  await Promise.all(Object.entries(ASSETS).map(async ([key, id]) => {
    const module = await import(`../assets/polyfork/${id}.mjs`);
    factories.set(key, module.createAsset);
    const object = module.createAsset();
    object.userData.assetId = id;
    object.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    templates.set(key, object);
  }));
  return (key, options = null) => {
    if (options) {
      const variant = key + JSON.stringify(options);
      if (!templates.has(variant)) templates.set(variant, factories.get(key)(options));
      return templates.get(variant).clone(true);
    }
    if (!templates.has(key)) throw new Error(`Unknown studio asset: ${key}`);
    return templates.get(key).clone(true);
  };
}
