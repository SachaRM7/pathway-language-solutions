const assert = require('node:assert/strict');

const rounds = [
  { drawCRS: '401', drawDate: '2026-08-12', drawName: 'French-language proficiency', drawNumber: '432', drawSize: '5,000' },
  { drawCRS: '510', drawDate: '2026-08-11', drawName: 'Canadian Experience Class', drawNumber: '431', drawSize: '1,000' },
  { drawCRS: '399', drawDate: '2026-07-22', drawName: 'French-language proficiency', drawNumber: '429', drawSize: '5,000' },
  { drawCRS: '390', drawDate: '2025-12-10', drawName: 'French-language proficiency', drawNumber: '400', drawSize: '3,000' }
];

global.localStorage = {
  getItem() { return null; },
  setItem() {}
};
global.fetch = async () => ({
  ok: true,
  async json() { return { rounds }; }
});

require('../ircc-data.js');

(async () => {
  const data = await global.PathwayIRCC.load();
  assert.deepEqual(data.cec, {
    score: 510,
    date: '2026-08-11',
    name: 'Canadian Experience Class',
    draw: '431'
  });
  assert.deepEqual(data.french, {
    score: 401,
    date: '2026-08-12',
    name: 'French-language proficiency',
    draw: '432'
  });
  assert.deepEqual(data.metrics, {
    frenchYear: 2026,
    frenchInvitations: 10000,
    frenchRoundCount: 2
  });
  console.log('IRCC data: automatic draw metrics tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
