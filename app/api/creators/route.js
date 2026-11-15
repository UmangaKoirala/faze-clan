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
    const context = await userContext(request, true);

    const teams = context
      ? await sharedTeams(context.db)
      : null;

    const creators = readJson("creators.json", []);
    const snapshots = readSnapshots();

    const rows = creators.map((creator) => {
      const growth = growthPoints(
        creator.id,
        snapshots
      );

      return {
        ...creator,

        growth,

        points: creator.momentum + growth,

        draftCount: teams
          ? teams.filter((team) =>
              team.picks.includes(creator.id)
            ).length
          : null,
      };
    });

    return json(rows);
  } catch (error) {
    return apiError(error);
  }
}
