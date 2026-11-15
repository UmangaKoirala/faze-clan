export const BUDGET = 50;
export const TEAM_SIZE = 5;

// Points from real growth between the first and latest snapshot (0 to 50).
export function growthPoints(creatorId, snapshots) {
  if (snapshots.length < 2) return 0;
  const first = snapshots[0].stats[creatorId];
  const last = snapshots[snapshots.length - 1].stats[creatorId];
  if (!first || !last || !first.views) return 0;
  const viewGrowthPct = ((last.views - first.views) / first.views) * 100;
  const subGrowthPct = first.subs ? ((last.subs - first.subs) / first.subs) * 100 : 0;
  const points = viewGrowthPct * 20 + subGrowthPct * 40;
  return Math.max(0, Math.min(50, Math.round(points)));
}

export function creatorPoints(creator, snapshots) {
  return creator.momentum + growthPoints(creator.id, snapshots);
}

export function teamPoints(team, creatorsById, snapshots) {
  return team.picks.reduce((sum, id) => {
    const c = creatorsById[id];
    return c ? sum + creatorPoints(c, snapshots) : sum;
  }, 0);
}
