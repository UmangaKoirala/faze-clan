import { createClient } from "@supabase/supabase-js";

import { addWeeks, weekKey } from "./weeks";

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function userContext(request, optional = false) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];

  if (!token) {
    if (optional) return null;

    throw new ApiError(
      "Sign in to view and save shared squads.",
      401
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new ApiError(
      "Supabase is not configured on this server.",
      503
    );
  }

  const db = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Verify the token with Supabase.
  // Never trust a user ID supplied by the browser.
  const { data, error } = await db.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(
      "Your session expired. Sign in again.",
      401
    );
  }

  return {
    db,
    user: data.user,
  };
}

// Every squad drafted in the given weeks (week keys like "2026-11-09").
export async function weeklyDrafts(db, weeks) {
  const { data, error } = await db
    .from("weekly_drafts")
    .select(
      "user_id,week,picks,changes,updated_at,profiles(display_name)"
    )
    .in("week", weeks);

  if (error) {
    throw new ApiError(
      "Could not load weekly squads. Run supabase/weekly-league.sql in the Supabase SQL editor, then check the table policies.",
      503
    );
  }

  return data;
}

// Each scout's most recent squad from the last five weeks.
// Used for draft counts on the draft page, stats and the watchlist.
export async function sharedTeams(db) {
  const thisWeek = weekKey();
  const weeks = [0, -1, -2, -3, -4].map((offset) =>
    addWeeks(thisWeek, offset)
  );

  const latest = new Map();

  for (const draft of await weeklyDrafts(db, weeks)) {
    const seen = latest.get(draft.user_id);
    if (!seen || draft.week > seen.week) {
      latest.set(draft.user_id, draft);
    }
  }

  return [...latest.values()];
}

export function apiError(error) {
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "The request failed. Please try again.",
    },
    {
      status:
        error instanceof ApiError
          ? error.status
          : 500,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export function json(value) {
  return Response.json(value, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
