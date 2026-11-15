import { connection } from "next/server";

import { readJson, readSnapshots } from "@/lib/data";
import { validateDraft } from "@/lib/validate-draft";
import { rankWeek, samePicks, walletFor } from "@/lib/league";
import { CHANGE_FEE } from "@/lib/rules";
import { addWeeks, weekKey, weekRange } from "@/lib/weeks";
import {
  userContext,
  weeklyDrafts,
  apiError,
  ApiError,
  json,
} from "@/lib/shared-server";

async function loadWeek(db, user) {
  const week = weekKey();
  const lastWeek = addWeeks(week, -1);

  const [draft, lastWeekDrafts] = await Promise.all([
    db
      .from("weekly_drafts")
      .select("picks,changes,updated_at")
      .eq("user_id", user.id)
      .eq("week", week)
      .maybeSingle(),

    weeklyDrafts(db, [lastWeek]),
  ]);

  if (draft.error) {
    throw new ApiError(
      "Could not load your squad for this week. Run supabase/weekly-league.sql in the Supabase SQL editor, then check the table policies.",
      503
    );
  }

  const creators = readJson("creators.json", []);
  const byId = Object.fromEntries(
    creators.map((creator) => [creator.id, creator])
  );

  // Last week's finish decides this week's prize money.
  const lastWeekRows = rankWeek(
    lastWeekDrafts,
    byId,
    readSnapshots(),
    lastWeek
  );

  return {
    week,
    creators,
    team: draft.data,
    wallet: walletFor(user.id, lastWeekRows, draft.data?.changes || 0),
  };
}

// Load the signed-in player's squad and money for this week.
export async function GET(request) {
  await connection();

  try {
    const { db, user } = await userContext(request);

    const [{ week, team, wallet }, profile] = await Promise.all([
      loadWeek(db, user),

      db
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (profile.error) {
      throw new ApiError(
        "Could not load your profile. Check the Supabase tables and policies.",
        503
      );
    }

    return json({
      week: weekRange(week),
      team,
      wallet,
      scout:
        profile.data?.display_name ||
        user.user_metadata?.display_name ||
        "Scout",
    });
  } catch (error) {
    return apiError(error);
  }
}

// Lock in this week's squad. The first save each week is free;
// every change after that costs CHANGE_FEE from this week's money.
export async function POST(request) {
  try {
    const { db, user } = await userContext(request);

    const body = await request.json().catch(() => null);

    const { week, creators, team, wallet } = await loadWeek(db, user);

    const scout =
      String(user.user_metadata?.display_name || "Scout")
        .trim()
        .slice(0, 24) || "Scout";

    if (team && samePicks(team.picks, body?.picks)) {
      return json({ ok: true, scout, charged: 0, team, wallet });
    }

    const changes = team ? team.changes + 1 : 0;

    const validationError = validateDraft(
      body,
      creators,
      wallet.total - changes * CHANGE_FEE
    );

    if (validationError) {
      throw new ApiError(validationError, 400);
    }

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

    // The database trigger counts changes itself,
    // so the browser cannot skip the fee by writing to Supabase directly.
    const saved = team
      ? await db
          .from("weekly_drafts")
          .update({ picks: body.picks })
          .eq("user_id", user.id)
          .eq("week", week)
          .select("picks,changes,updated_at")
          .single()
      : await db
          .from("weekly_drafts")
          .insert({ user_id: user.id, week, picks: body.picks })
          .select("picks,changes,updated_at")
          .single();

    if (saved.error) {
      if (saved.error.code === "23505") {
        throw new ApiError(
          "You already locked in a squad this week. Refresh to see it.",
          409
        );
      }

      if (saved.error.code === "23514") {
        throw new ApiError(
          "The database rejected this squad. Check the team size and whether the creator catalog matches the website.",
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
      charged: team ? CHANGE_FEE : 0,
      team: saved.data,
      wallet: {
        ...wallet,
        changes: saved.data.changes,
        fees: saved.data.changes * CHANGE_FEE,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
