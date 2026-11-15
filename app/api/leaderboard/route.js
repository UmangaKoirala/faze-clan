import { connection } from "next/server";

import { readJson, readSnapshots } from "@/lib/data";
import { rankWeek } from "@/lib/league";
import { addWeeks, weekKey, weekRange } from "@/lib/weeks";
import {
  userContext,
  weeklyDrafts,
  apiError,
  json,
} from "@/lib/shared-server";

// This week's live standings and last week's final results.
export async function GET(request) {
  await connection();

  try {
    const { db, user } = await userContext(request);

    const week = weekKey();
    const lastWeek = addWeeks(week, -1);

    const drafts = await weeklyDrafts(db, [week, lastWeek]);
    const creators = readJson("creators.json", []);
    const snapshots = readSnapshots();

    const byId = Object.fromEntries(
      creators.map((creator) => [creator.id, creator])
    );

    function board(key) {
      return {
        ...weekRange(key),
        rows: rankWeek(drafts, byId, snapshots, key).map((row) => ({
          id: row.userId,
          scout: row.scout,
          mine: row.userId === user.id,
          rank: row.rank,
          points: row.points,
          finished: row.finished,
          bonusPoints: row.bonusPoints,
          prizeMoney: row.prizeMoney,
          changes: row.changes,
          picks: row.picks.map(
            (id) => byId[id]?.name || "Creator no longer listed"
          ),
          kingmaker: row.picks.some((id) => byId[id]?.signedByFaZe),
        })),
      };
    }

    return json({
      current: board(week),
      last: board(lastWeek),
    });
  } catch (error) {
    return apiError(error);
  }
}
