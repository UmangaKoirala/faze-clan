import { readJson, writeJson } from '@/lib/data';
import { BUDGET, TEAM_SIZE } from '@/lib/score';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const scout = String(body?.scout || '').trim().slice(0, 24);
  const picks = Array.isArray(body?.picks) ? [...new Set(body.picks)] : [];

  if (!scout) {
    return Response.json({ error: 'Enter a scout name.' }, { status: 400 });
  }
  if (picks.length !== TEAM_SIZE) {
    return Response.json({ error: `Pick exactly ${TEAM_SIZE} creators.` }, { status: 400 });
  }

  const creators = readJson('creators.json', []);
  const byId = Object.fromEntries(creators.map((c) => [c.id, c]));
  if (picks.some((id) => !byId[id])) {
    return Response.json({ error: 'Your team has a creator we do not know.' }, { status: 400 });
  }

  const cost = picks.reduce((sum, id) => sum + byId[id].salary, 0);
  if (cost > BUDGET) {
    return Response.json({ error: `Your team costs $${cost}. The budget is $${BUDGET}.` }, { status: 400 });
  }

  const teams = readJson('teams.json', []).filter(
    (t) => t.scout.toLowerCase() !== scout.toLowerCase()
  );
  teams.push({ scout, picks, createdAt: new Date().toISOString() });
  writeJson('teams.json', teams);
  return Response.json({ ok: true });
}
