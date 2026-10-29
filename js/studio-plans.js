// Banks are 1 m wide and .5 m deep; the classroom openings are 1.6 m wide.
// Use room openings, not the animated-door list (internal openings have no leaf).
export function schoolLockerLayout(rooms) {
  const banks = [], pitch = 1.02, width = 1, doorwayHalf = .8, clearance = .35;
  for (const r of rooms) {
    const side = r.door === 'right' ? -1 : 1;
    const wallX = side < 0 ? r.x1 : r.x0;
    const centre = (r.z0 + r.z1) / 2;
    for (const [start, end] of [[r.z0 + .25, centre - doorwayHalf - clearance], [centre + doorwayHalf + clearance, r.z1 - .25]]) {
      const count = Math.max(0, Math.floor((end - start + pitch - width) / pitch));
      const span = count ? (count - 1) * pitch + width : 0;
      for (let i = 0; i < count; i++) banks.push({
        x: wallX - side * .36, z: (start + end - span + width) / 2 + i * pitch,
        rotation: side < 0 ? Math.PI / 2 : -Math.PI / 2, side, width, depth: .5
      });
    }
  }
  return banks;
}

// Room bounds in metres. Unoccupied strips form the circulation, never furniture space.
export function studioPlan(b) {
  const L = -b.w / 2, R = b.w / 2, B = -b.d / 2, F = b.d / 2;
  const room = (name, type, x0, z0, x1, z1, door, paint) => ({ name, type, x0, z0, x1, z1, door, paint });
  if (b.kind === 'house') {
    if (b.project === 32 && b.id.endsWith('-1')) return [
      room('Salon familial lavande', 'living', L, 0, -1, F, 'right', 0xb7acc5),
      room('Cuisine familiale', 'kitchen', L, B, -1, 0, 'right', 0xd7d3ba),
      room('Chambre et bureau de jeu', 'bedroom', 1, -1, R, F, 'left', 0x899dab),
      room('Salle de bains', 'bath', 1, B, R, -1, 'left', 0xb5ccc3)
    ];
    if (b.project === 32) return [
      room('Salon et coin lecture', 'living', L, -0.8, -1, F, 'right', 0xbcaac3),
      room('Chambre familiale', 'bedroom', L, B, -1, -0.8, 'right', 0xc4c4ac),
      room('Cuisine et repas', 'kitchen', 1, -2, R, F, 'left', 0xc9d4c2),
      room('Salle d’eau', 'bath', 1, B, R, -2, 'left', 0xc0cbd1)
    ];
    if (b.id.endsWith('-1')) return [
      room('Séjour ouvert et cuisine intégrée', 'openLiving', L, 0, R, F, null, 0xe1dacc),
      room('Suite aux boiseries claires', 'bedroom', L, B, -1, 0, 'right', 0xd7c8b0),
      room('Salle d’eau contemporaine', 'bath', 1, B, R, -2.5, 'left', 0xc7cecc),
      room('Bureau vitré', 'study', 1, -2.5, R, 0, 'left', 0xd8d4c9)
    ];
    return [
      room('Salon contemporain', 'living', L, -1, -1, F, 'right', 0xded6c6),
      room('Cuisine avec îlot', 'kitchen', 1, -0.5, R, F, 'left', 0xd0cbbd),
      room('Suite et dressing', 'bedroom', 1, B, R, -0.5, 'left', 0xc5b9a5),
      room('Salle de bains', 'bath', L, B, -1, -1, 'right', 0xa5b7b3)
    ];
  }
  const hall = b.kind === 'school' ? 2 : b.kind === 'clinic' ? 1.5 : 1.25;
  const split = b.kind === 'police' ? -1.5 : b.kind === 'reception' ? -2 : 0;
  const types = b.kind === 'school' ? [['Classe A','classroom'],['Classe B','classroom'],['Cantine','canteen'],['Vie scolaire','office']]
    : b.kind === 'clinic' ? [['Consultation','consultation'],['Accueil et attente','waiting'],['Chambre de soins','care'],['Examen','consultation']]
    : b.kind === 'police' ? [['Salle d’interrogatoire','interview'],['Accueil du commissariat','waiting'],['Cellule','cell'],['Bureau des enquêteurs','office']]
    : [['Préparation','kitchen'],['Café','canteen'],['Scène et cérémonie','ceremony'],['Réception','waiting']];
  return [[L,B,-hall,split,'right'],[L,split,-hall,F,'right'],[hall,B,R,split,'left'],[hall,split,R,F,'left']].map((v,i)=>room(...types[i],...v,b.kind === 'school' ? 0xb5c8b8 : b.kind === 'police' ? 0xc9bba3 : 0xd1d5cb));
}
