import { connection } from 'next/server';
import { readJson, readSnapshots } from '@/lib/data';
import { teamPoints } from '@/lib/score';

export async function GET() {
  await connection(); // read the JSON files on every request, not at build time
  const creators = readJson('creators.json', []);
  const byId = Object.fromEntries(creators.map((c) => [c.id, c]));
  const snapshots = readSnapshots();
  const teams = readJson('teams.json', []);

  const rows = teams
    .map((t) => ({
      scout: t.scout,
      points: teamPoints(t, byId, snapshots),
      picks: t.picks.map((id) => byId[id]?.name || 'Unknown'),
      kingmaker: t.picks.some((id) => byId[id]?.signedByFaZe),
    }))
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ rank: i + 1, ...row }));

  return Response.json(rows);
}
