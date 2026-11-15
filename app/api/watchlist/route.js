import { connection } from 'next/server';
import { readJson, readSnapshots } from '@/lib/data';
import { growthPoints } from '@/lib/score';

export async function GET() {
  await connection(); // read the JSON files on every request, not at build time
  const creators = readJson('creators.json', []);
  const teams = readJson('teams.json', []);
  const snapshots = readSnapshots();

  const rows = creators
    .map((c) => ({
      ...c,
      growth: growthPoints(c.id, snapshots),
      draftCount: teams.filter((t) => t.picks.includes(c.id)).length,
    }))
    .filter((c) => c.draftCount > 0)
    .sort((a, b) => b.draftCount - a.draftCount || b.momentum - a.momentum)
    .slice(0, 10);

  return Response.json({ totalScouts: teams.length, creators: rows });
}
