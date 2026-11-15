import { connection } from "next/server";

import { readJson, readSnapshots } from "@/lib/data";
import { growthPoints } from "@/lib/score";
import {
  userContext,
  sharedTeams,
  apiError,
  json,
} from "@/lib/shared-server";

export async function GET(request) {
  await connection();

  try {
    const { db } = await userContext(request);
    const teams = await sharedTeams(db);

    const creators = readJson("creators.json", []);
    const snapshots = readSnapshots();

    const rows = creators
      .map((creator) => ({
        ...creator,

        growth: growthPoints(
          creator.id,
          snapshots
        ),

        draftCount: teams.filter((team) =>
          team.picks.includes(creator.id)
        ).length,
      }))
      .filter((creator) => creator.draftCount > 0)
      .sort(
        (a, b) =>
          b.draftCount - a.draftCount ||
          b.momentum - a.momentum
      )
      .slice(0, 10);

    return json({
      totalScouts: teams.length,
      creators: rows,
    });
  } catch (error) {
    return apiError(error);
  }
}
