import { connection } from "next/server";

import { readJson, readSnapshots } from "@/lib/data";
import {
  rankCreators,
  rankWeek,
  snapshotsBetween,
} from "@/lib/league";
import { monthlyReward } from "@/lib/rules";
import { monthRange, weeksInMonth } from "@/lib/weeks";
import {
  userContext,
  weeklyDrafts,
  apiError,
  json,
} from "@/lib/shared-server";

const TOP_STREAMERS = 10;

// Monthly standings: streamers ranked by this month's points, the rewards
// their backers win, and scouts ranked by weekly points plus top 3 bonuses.
export async function GET(request) {
  await connection();

  try {
    const { db, user } = await userContext(request);

    const month = monthRange();
    const weeks = weeksInMonth(month);

    const drafts = weeks.length ? await weeklyDrafts(db, weeks) : [];
    const creators = readJson("creators.json", []);
    const snapshots = readSnapshots();

    const byId = Object.fromEntries(
      creators.map((creator) => [creator.id, creator])
    );

    // Who backed each creator at any point this month.
    const backersByCreator = new Map();

    for (const draft of drafts) {
      for (const id of draft.picks) {
        if (!backersByCreator.has(id)) backersByCreator.set(id, new Map());
        backersByCreator.get(id).set(draft.user_id, {
          scout: draft.profiles?.display_name || "Scout",
          mine: draft.user_id === user.id,
        });
      }
    }

    const streamers = rankCreators(
      creators,
      snapshotsBetween(snapshots, month.start, month.end)
    )
      .slice(0, TOP_STREAMERS)
      .map(({ creator, points, rank }) => {
        const backers = [
          ...(backersByCreator.get(creator.id)?.values() || []),
        ];

        return {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          game: creator.game,
          rank,
          points,
          reward: monthlyReward(rank),
          backers,
          backedByMe: backers.some((backer) => backer.mine),
        };
      });

    // Scouts: weekly points plus top 3 bonuses from weeks that have finished.
    const scouts = new Map();

    for (const week of weeks) {
      for (const row of rankWeek(drafts, byId, snapshots, week)) {
        const entry = scouts.get(row.userId) || {
          id: row.userId,
          scout: row.scout,
          mine: row.userId === user.id,
          points: 0,
          bonusPoints: 0,
          weeksPlayed: 0,
          weeklyWins: 0,
        };

        entry.points += row.points;
        entry.weeksPlayed += 1;

        if (row.finished && row.bonusPoints) {
          entry.bonusPoints += row.bonusPoints;
          if (row.rank === 1) entry.weeklyWins += 1;
        }

        scouts.set(row.userId, entry);
      }
    }

    const scoutRows = [...scouts.values()]
      .map((entry) => ({
        ...entry,
        total: entry.points + entry.bonusPoints,
      }))
      .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return json({
      month,
      weeks,
      streamers,
      scouts: scoutRows,
      myRewards: streamers
        .filter((streamer) => streamer.backedByMe && streamer.reward)
        .map((streamer) => ({
          streamer: streamer.name,
          rank: streamer.rank,
          reward: streamer.reward,
        })),
    });
  } catch (error) {
    return apiError(error);
  }
}
