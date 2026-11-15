import { connection } from "next/server";

import { readJson, readSnapshots } from "@/lib/data";
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

    return json({
      creators: creators.length,
      scouts: teams ? teams.length : null,
      updatedAt:
        snapshots.at(-1)?.takenAt || null,
    });
  } catch (error) {
    return apiError(error);
  }
}
