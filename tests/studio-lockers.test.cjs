const test = require('node:test');
const assert = require('node:assert/strict');
test('school lockers form inward-facing wall banks with clear classroom entrances', async () => {
  const { studioPlan, schoolLockerLayout } = await import('../js/studio-plans.js');
  const { createStudioLayout } = await import('../js/studio-layout.js');
  const school = createStudioLayout().find(b => b.kind === 'school');
  const rooms = studioPlan(school), banks = schoolLockerLayout(rooms);
  assert.ok(banks.length > 0);
  for(const bank of banks) {
    assert.ok(Math.sin(bank.rotation)*bank.side < 0, 'front faces the corridor');
    assert.ok(Math.abs(bank.x)+bank.depth/2 <= 1.9, 'back stays clear of wall');
    assert.ok(Math.abs(bank.x)-bank.depth/2 >= 1.35, 'at least 2.7 m central passage');
    for(const room of rooms.filter(r => (r.door==='right'?-1:1)===bank.side)) {
      const doorway=(room.z0+room.z1)/2;
      assert.ok(Math.abs(bank.z-doorway) >= .8+.35+bank.width/2-1e-8, 'door and approach stay clear');
    }
    for(const other of banks) if(other!==bank && other.side===bank.side) assert.ok(Math.abs(other.z-bank.z)>=bank.width, 'banks do not overlap');
  }
  const left=banks.filter(b=>b.side===-1).map(b=>b.z);
  const right=banks.filter(b=>b.side===1).map(b=>b.z);
  assert.deepEqual(left,right, 'opposite rows align');
});

