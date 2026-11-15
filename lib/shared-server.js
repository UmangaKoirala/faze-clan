import { createClient } from "@supabase/supabase-js";

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

export async function sharedTeams(db) {
  const { data, error } = await db
    .from("teams")
    .select(
      "user_id,picks,created_at,profiles(display_name)"
    );

  if (error) {
    throw new ApiError(
      "Could not load shared teams. Check the Supabase tables and policies.",
      503
    );
  }

  return data;
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
