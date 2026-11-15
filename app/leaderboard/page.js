"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";

export default function LeaderboardPage() {
  const { user, ready, api, error: authError } = useAuth();
  const userId = user?.id;

  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({
    rows: null,
    error: "",
    owner: null,
  });

  useEffect(() => {
    if (!ready || !userId) return;

    let active = true;
    let busy = false;

    async function load() {
      if (busy) return;
      busy = true;

      try {
        const rows = await api("/api/leaderboard");

        if (active) {
          setState({
            rows,
            error: "",
            owner: userId,
          });
        }
      } catch (error) {
        if (active) {
          setState((previous) => ({
            rows:
              previous.owner === userId
                ? previous.rows
                : null,
            error: error.message,
            owner: userId,
          }));
        }
      } finally {
        busy = false;
      }
    }

    load();

    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ready, userId, api, refresh]);

  if (!ready) {
    return (
      <p className="py-8">
        Checking your session…
      </p>
    );
  }

  if (!userId) {
    return (
      <div className="py-8">
        <h1 className="font-display text-3xl">
          Sign in to see the league.
        </h1>

        {authError && (
          <p role="alert" className="mt-3">
            {authError}
          </p>
        )}

        <Link href="/login" className="od-button mt-5">
          Sign in / Create account →
        </Link>
      </div>
    );
  }

  const rows =
    state.owner === userId ? state.rows : null;

  const error =
    state.owner === userId ? state.error : "";

  return (
    <div>
      <h1 className="font-display text-4xl">
        Scout{" "}
        <span className="text-[#E4002B]">
          leaderboard
        </span>
      </h1>

      <p className="mt-3 text-[#405563]">
        See everyone’s submitted squad. Updates every
        five seconds.
      </p>

      <p className="mt-2 text-sm text-[#405563]">
        Points = creator momentum + measured growth bonus.
      </p>

      <button
        onClick={() => setRefresh((value) => value + 1)}
        className="mt-4 text-sm underline"
      >
        Refresh now
      </button>

      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
          {rows
            ? " Showing the last loaded results."
            : ""}
        </p>
      )}

      {!rows && !error && (
        <p role="status" className="mt-8">
          Loading shared squads…
        </p>
      )}

      {rows?.length === 0 && (
        <div className="mt-8">
          <p>No submitted squads yet.</p>

          <Link
            href="/draft"
            className="mt-3 inline-block underline"
          >
            Draft your squad →
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ol className="mt-8 divide-y divide-[#10364c]/20 rounded-lg border border-[#10364c]/30">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`p-5 ${
                row.mine ? "bg-[#10364c]/10" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-display text-2xl">
                  #{row.rank}
                </span>

                <strong>{row.scout}</strong>

                {row.mine && (
                  <span className="rounded bg-[#10364c] px-2 py-1 text-xs text-[#fff7e5]">
                    MY TEAM
                  </span>
                )}

                {row.kingmaker && (
                  <span className="text-xs">
                    KINGMAKER · simulated signing
                  </span>
                )}

                <span className="ml-auto font-semibold">
                  {row.points} pts
                </span>
              </div>

              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {row.picks.map((name, index) => (
                  <li key={index}>
                    {index + 1}. {name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
