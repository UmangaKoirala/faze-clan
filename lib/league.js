import { creatorPoints, teamPoints } from "./score";
import {
  WEEKLY_BUDGET,
  CHANGE_FEE,
  bonusPoints,
  prizeMoney,
} from "./rules";
import { weekRange } from "./weeks";

// Snapshots taken inside [start, end). Keeps their original order.
export function snapshotsBetween(snapshots, start, end) {
  const from = Date.parse(start);
  const to = Date.parse(end);

  return snapshots.filter((snapshot) => {
    const time = Date.parse(snapshot.takenAt);
    return time >= from && time < to;
  });
}

export function samePicks(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

// Rank every squad drafted for one week.
// Points come from creator momentum plus growth measured during that week.
export function rankWeek(drafts, creatorsById, snapshots, week, now = new Date()) {
  const range = weekRange(week);
  const windowSnapshots = snapshotsBetween(
    snapshots,
    range.start,
    range.end
  );
  const finished = Date.parse(range.end) <= now.getTime();

  return drafts
    .filter((draft) => draft.week === week)
    .map((draft) => ({
      userId: draft.user_id,
      scout: draft.profiles?.display_name || "Scout",
      picks: draft.picks,
      changes: draft.changes || 0,
      points: teamPoints(draft, creatorsById, windowSnapshots),
    }))
    .sort(
      (a, b) => b.points - a.points || a.userId.localeCompare(b.userId)
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      finished,
      bonusPoints: bonusPoints(index + 1),
      prizeMoney: prizeMoney(index + 1),
    }));
}

// This week's money: the base budget, plus prize money for a top 3 finish
// last week, minus the fees for changes already made this week.
export function walletFor(userId, lastWeekRows, changes = 0) {
  const last = lastWeekRows.find((row) => row.userId === userId);
  const prize = last?.prizeMoney || 0;
  const total = WEEKLY_BUDGET + prize;
  const fees = changes * CHANGE_FEE;

  return {
    base: WEEKLY_BUDGET,
    prize,
    lastWeekRank: last?.rank || null,
    total,
    changes,
    fees,
    changeFee: CHANGE_FEE,
  };
}

// Streamers ranked by points over a window of snapshots.
export function rankCreators(creators, snapshots) {
  return creators
    .map((creator) => ({
      creator,
      points: creatorPoints(creator, snapshots),
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.creator.momentum - a.creator.momentum ||
        a.creator.id.localeCompare(b.creator.id)
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
