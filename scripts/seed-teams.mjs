// Run: node scripts/seed-teams.mjs
import fs from 'fs';
import path from 'path';

const DATA = path.join(process.cwd(), 'data');
const creators = JSON.parse(fs.readFileSync(path.join(DATA, 'creators.json'), 'utf8'));
const teamsFile = path.join(DATA, 'teams.json');

const names = [
  'TrickshotTom', 'NoScopeNina', 'ClutchCarter', 'QuickscopeQuinn', 'SnipeSzn',
  '360Sam', 'MontageMaya', 'HitmarkerHank', 'DropShotDev', 'KillcamKai',
  'ScopeLordSol', 'OGFaZeFan', 'NukeSquadNate', 'FeedTheFaZe', 'ReloadRiley',
];

// Scouts lean toward high-momentum creators, so the Watchlist has a clear top 3
function weightedShuffle(list) {
  return list
    .map((c) => [Math.random() * (0.5 + c.momentum / 100), c])
    .sort((a, b) => b[0] - a[0])
    .map((x) => x[1]);
}

const teams = [];
for (const scout of names) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const picks = weightedShuffle(creators).slice(0, 5);
    const cost = picks.reduce((sum, c) => sum + c.salary, 0);
    if (picks.length === 5 && cost <= 50) {
      teams.push({ scout, picks: picks.map((c) => c.id), createdAt: new Date().toISOString() });
      break;
    }
  }
}

const existing = fs.existsSync(teamsFile) ? JSON.parse(fs.readFileSync(teamsFile, 'utf8')) : [];
const realTeams = existing.filter((t) => !names.includes(t.scout));
fs.writeFileSync(teamsFile, JSON.stringify([...realTeams, ...teams], null, 2));
console.log(`Seeded ${teams.length} sample scouts.`);
