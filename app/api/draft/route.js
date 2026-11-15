import { connection } from "next/server";

import { readJson } from "@/lib/data";
import { validateDraft } from "@/lib/validate-draft";
import {
  userContext,
  apiError,
  ApiError,
  json,
} from "@/lib/shared-server";

// Load the signed-in player's saved squad.
export async function GET(request) {
  await connection();

  try {
    const { db, user } = await userContext(request);

    const [team, profile] = await Promise.all([
      db
        .from("teams")
        .select("picks")
        .eq("user_id", user.id)
        .maybeSingle(),

      db
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (team.error || profile.error) {
      throw new ApiError(
        "Could not load your saved squad. Check the Supabase tables and policies.",
        503
      );
    }

    return json({
      team: team.data,
      scout:
        profile.data?.display_name ||
        user.user_metadata?.display_name ||
        "Scout",
    });
  } catch (error) {
    return apiError(error);
  }
}

// Save only the authenticated player's squad.
export async function POST(request) {
  try {
    const { db, user } = await userContext(request);

    const body = await request.json().catch(() => null);

    const validationError = validateDraft(
      body,
      readJson("creators.json", [])
    );

    if (validationError) {
      throw new ApiError(validationError, 400);
    }

    const scout =
      String(user.user_metadata?.display_name || "Scout")
        .trim()
        .slice(0, 24) || "Scout";

    const profile = await db
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: scout,
        },
        {
          onConflict: "id",
        }
      );

    if (profile.error) {
      throw new ApiError(
        "Could not save your profile. Check the Supabase tables and policies.",
        503
      );
    }

    const saved = await db
      .from("teams")
      .upsert(
        {
          user_id: user.id,
          picks: body.picks,
        },
        {
          onConflict: "user_id",
        }
      );

    if (saved.error) {
      if (saved.error.code === "23514") {
        throw new ApiError(
          "The database rejected this squad. Check the budget and whether the creator catalog matches the website.",
          400
        );
      }

      throw new ApiError(
        "Could not confirm your squad was saved. Refresh and try again.",
        503
      );
    }

    return json({
      ok: true,
      scout,
    });
  } catch (error) {
    return apiError(error);
  }
}
