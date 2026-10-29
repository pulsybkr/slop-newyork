import { localToWorld } from './studio-layout.js';

export function attachStudioPanel(studio, controllers, cameras, syncColliders, region) {
  const panel = document.createElement('details'); panel.className = 'studio-panel hud'; panel.open = true;
  panel.innerHTML = `<summary>Décors de tournage</summary><div class="studio-controls">
    <label>Zone chargée<select data-zone><option value="rennrat">Projet 32 · Clinton Gardens</option><option value="herytstory">Projet 41 · East Village Gardens</option><option value="city">Ville complète</option></select></label>
    <p class="studio-budget">${region ? 'Environs : 420 m · 32 voitures · 48 piétons' : 'Ville complète · Deux quartiers et lieux partagés'}</p>
    <label>Décor<select data-set></select></label>
    <button type="button" data-visit>Visiter à pied</button>
    <label>Cadrage<select data-shot><option value="">Caméra libre / personnage</option></select></label>
    <label class="studio-check"><input type="checkbox" data-cutaway> Retirer les toits pour préparer un plan</label>
    <label>Lumière intérieure<input data-light type="range" min="0" max="3" step="0.1" value="1" aria-label="Intensité de la lumière intérieure"></label>
    <button type="button" data-pov>Vue à hauteur des yeux</button>
    <p data-status role="status" aria-live="polite">Portes automatiques à proximité. Les maisons 1 et 2 de chaque projet sont meublées.</p>
    <a href="./">Changer de zone au démarrage</a>
  </div>`;
  document.body.append(panel);
  const select = panel.querySelector('[data-set]'), shots = panel.querySelector('[data-shot]');
  const status = panel.querySelector('[data-status]');
  for (const set of studio.sets.filter(s => s.rooms.length)) select.add(new Option(set.name, set.id));
  let fixed = null;
  const zone = panel.querySelector('[data-zone]'); zone.value = region?.id || 'city';
  zone.addEventListener('change', () => { location.href = `?zone=${encodeURIComponent(zone.value)}`; });
  function refreshShots() {
    shots.replaceChildren(new Option('Caméra libre / personnage', ''));
    for (const shot of studio.shots.filter(s => s.set === select.value)) shots.add(new Option(shot.name.split(' · ').slice(-1)[0], shot.id));
    fixed = null;
  }
  select.addEventListener('change', refreshShots); refreshShots();
  function populate(set) { set.populate(); syncColliders(); studio.root.updateMatrixWorld(true); }
  function visit(id) {
    const set = studio.sets.find(s => s.id === id);
    if (!set) return;
    populate(set); select.value = id; refreshShots();
    controllers.setMode('person');
    state.onVisit?.();
    const entry = localToWorld(set, 0, set.d / 2 + 2.5);
    controllers.teleportActiveTo(entry.x, entry.z, set.rotation + Math.PI);
    cameras.resetForTeleport(); cameras.setCameraPreset('pov', true);
    cameras.camera.near = 0.08; cameras.camera.updateProjectionMatrix();
    status.textContent = `${set.name} · Entrez par la porte ; les pièces donnent sur le couloir central.`;
  }
  panel.querySelector('[data-visit]').addEventListener('click', () => visit(select.value));
  shots.addEventListener('change', () => {
    fixed = studio.shots.find(s => s.id === shots.value) || null;
    if (fixed) {
      const set = studio.sets.find(s => s.id === fixed.set); populate(set);
      // Keep the actor and simulation in the selected set, but frame independently.
      controllers.setMode('person'); controllers.teleportActiveTo(set.x, set.z, set.rotation);
      status.textContent = fixed.name;
    } else cameras.setCameraPreset('pov', true);
  });
  panel.querySelector('[data-pov]').addEventListener('click', () => {
    fixed = null; shots.value = ''; cameras.setCameraPreset('pov', true);
  });
  // Existing camera controls always release a studio framing.
  document.querySelectorAll('[data-camera]').forEach(button => button.addEventListener('click', () => { fixed = null; shots.value = ''; }));
  const state = { status, visit, releaseCamera() { fixed = null; shots.value = ''; },
    get cutaway() { return panel.querySelector('[data-cutaway]').checked; },
    get lightGain() { return Number(panel.querySelector('[data-light]').value); },
    update() {
      if (fixed) {
        const camera = cameras.camera;
        camera.position.set(...fixed.position); camera.lookAt(...fixed.target);
        camera.fov = fixed.fov; camera.near = 0.08; camera.updateProjectionMatrix();
        cameras.currentPos.copy(camera.position); cameras.currentLookAt.set(...fixed.target);
      }
      if (region) {
        const p = controllers.getActiveEntity();
        const x = Math.max(region.minX + 40, Math.min(region.maxX - 40, p.position.x));
        const z = Math.max(region.minZ + 40, Math.min(region.maxZ - 40, p.position.z));
        if (x !== p.position.x || z !== p.position.z) {
          p.position.x = x; p.position.z = z; p.speed = 0;
          status.textContent = 'Limite de la zone chargée. Changez de zone pour poursuivre.';
        }
      }
    }
  };
  // A small authoring API for future actor placement and shot timelines; no separate character models.
  window.studio = { sets: studio.sets, shots: studio.shots, anchors: studio.seats, visit, region,
    getPlayerState: () => { const p = controllers.getActiveEntity(); return { x: p.position.x, y: p.position.y, z: p.position.z, heading: p.heading, mode: controllers.activeMode }; },
    getStats: () => ({ sets: studio.sets.length, furnished: studio.sets.filter(s => s.furnished).length,
      colliders: studio.colliders.length, zone: region?.id || 'city' }) };
  return state;
}
