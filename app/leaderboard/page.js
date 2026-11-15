"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WEEKLY_BONUS_POINTS, WEEKLY_PRIZE_MONEY } from "@/lib/rules";
import { weekLabel } from "@/lib/weeks";
import { useAuth } from "../components/AuthProvider";
import MonthlyBoard from "./MonthlyBoard";

const TABS = [
  { key: "current", label: "This week" },
  { key: "last", label: "Last week" },
  { key: "month", label: "This month" },
];

export default function LeaderboardPage() {
  const { user, ready, api, error: authError } = useAuth();
  const userId = user?.id;

  const [tab, setTab] = useState("current");
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({
    data: null,
    error: "",
    owner: null,
  });

  useEffect(() => {
    if (!ready || !userId || tab === "month") return;

    let active = true;
    let busy = false;

    async function load() {
      if (busy) return;
      busy = true;

      try {
        const data = await api("/api/leaderboard");

        if (active) {
          setState({
            data,
            error: "",
            owner: userId,
          });
        }
      } catch (error) {
        if (active) {
          setState((previous) => ({
            data:
              previous.owner === userId
                ? previous.data
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
  }, [ready, userId, api, refresh, tab]);

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

  const data =
    state.owner === userId ? state.data : null;

  const error =
    state.owner === userId ? state.error : "";

  const board = tab === "month" ? null : data?.[tab];

  return (
    <div>
      <h1 className="font-display text-4xl">
        Scout{" "}
        <span className="text-[#E4002B]">
          leaderboard
        </span>
      </h1>

      <div
        role="tablist"
        aria-label="Leaderboard period"
        className="mt-5 flex flex-wrap gap-2"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-full border px-4 py-1 text-sm ${
              tab === item.key
                ? "border-[#10364c] bg-[#10364c] text-[#fff7e5]"
                : "border-[#10364c]/30 hover:border-[#10364c]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "month" ? (
        <MonthlyBoard api={api} userId={userId} />
      ) : (
        <>
          <p className="mt-4 text-[#405563]">
            {board
              ? `Week of ${weekLabel(board.key)}. `
              : ""}
            {tab === "current"
              ? "Live standings, updated every five seconds."
              : "Final results from last week."}
          </p>

          <p className="mt-2 text-sm text-[#405563]">
            Points = creator momentum + growth measured during
            the week. Top 3 each week earn +
            {WEEKLY_BONUS_POINTS.join(" / +")} bonus points and
            +${WEEKLY_PRIZE_MONEY.join(" / +$")} for the next
            draft. Everyone else gets the normal weekly money
            back.
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
              {data
                ? " Showing the last loaded results."
                : ""}
            </p>
          )}

          {!data && !error && (
            <p role="status" className="mt-8">
              Loading shared squads…
            </p>
          )}

          {board?.rows.length === 0 && (
            <div className="mt-8">
              <p>
                {tab === "current"
                  ? "No squads locked in this week yet."
                  : "Nobody played last week."}
              </p>

              {tab === "current" && (
                <Link
                  href="/draft"
                  className="mt-3 inline-block underline"
                >
                  Draft your squad →
                </Link>
              )}
            </div>
          )}

          {board && board.rows.length > 0 && (
            <ol className="mt-8 divide-y divide-[#10364c]/20 rounded-lg border border-[#10364c]/30">
              {board.rows.map((row) => (
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

                    {row.bonusPoints > 0 && (
                      <span className="rounded border border-[#E4002B] px-2 py-1 text-xs text-[#E4002B]">
                        {row.finished
                          ? `+${row.bonusPoints} bonus pts · +$${row.prizeMoney} next week`
                          : `On track for +${row.bonusPoints} pts`}
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

                  {row.changes > 0 && (
                    <p className="mt-3 text-xs text-[#405563]">
                      Changed squad {row.changes} time
                      {row.changes === 1 ? "" : "s"} this week
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
