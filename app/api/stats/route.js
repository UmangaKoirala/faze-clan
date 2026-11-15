import { connection } from 'next/server';
import { readJson, readSnapshots } from '@/lib/data';

export async function GET() {
  await connection(); // read the JSON files on every request, not at build time
  const creators = readJson('creators.json', []);
  const teams = readJson('teams.json', []);
  const snapshots = readSnapshots();
  return Response.json({
    creators: creators.length,
    scouts: teams.length,
    updatedAt: snapshots.at(-1)?.takenAt || null,
  });
}
