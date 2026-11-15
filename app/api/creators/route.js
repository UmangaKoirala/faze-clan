import { connection } from 'next/server';
import { readJson, readSnapshots } from '@/lib/data';
import { growthPoints } from '@/lib/score';

export async function GET() {
  await connection(); // read the JSON files on every request, not at build time
  const creators = readJson('creators.json', []);
  const snapshots = readSnapshots();
  const teams = readJson('teams.json', []);
  const result = creators.map((c) => {
    const growth = growthPoints(c.id, snapshots);
    return {
      ...c,
      growth,
      points: c.momentum + growth,
      draftCount: teams.filter((t) => t.picks.includes(c.id)).length,
    };
  });
  return Response.json(result);
}
