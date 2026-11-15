import { connection } from "next/server";

import { readJson, readSnapshots } from "@/lib/data";
import { teamPoints } from "@/lib/score";
import {
  userContext,
  sharedTeams,
  apiError,
  json,
} from "@/lib/shared-server";

export async function GET(request) {
  await connection();

  try {
    const { db, user } = await userContext(request);

    const teams = await sharedTeams(db);
    const creators = readJson("creators.json", []);
    const snapshots = readSnapshots();

    const byId = Object.fromEntries(
      creators.map((creator) => [creator.id, creator])
    );

    const rows = teams
      .map((team) => ({
        id: team.user_id,

        scout:
          team.profiles?.display_name || "Scout",

        mine: team.user_id === user.id,

        points: teamPoints(team, byId, snapshots),

        picks: team.picks.map(
          (id) =>
            byId[id]?.name || "Creator no longer listed"
        ),

        kingmaker: team.picks.some(
          (id) => byId[id]?.signedByFaZe
        ),
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          a.id.localeCompare(b.id)
      )
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    return json(rows);
  } catch (error) {
    return apiError(error);
  }
}
