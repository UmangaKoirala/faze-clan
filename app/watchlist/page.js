"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fmt } from "@/lib/format";
import { useAuth } from "../components/AuthProvider";

export default function WatchlistPage() {
  const { user, ready, api, error: authError } = useAuth();
  const userId = user?.id;

  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({
    data: null,
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
        const data = await api("/api/watchlist");

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
          Sign in to view the shared Watchlist.
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

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#705629]">
        Community-powered talent discovery
      </p>

      <h1 className="font-display mt-2 text-4xl">
        FaZe Watchlist
      </h1>

      <p className="mt-3 max-w-2xl text-[#405563]">
        Creators ranked by how many players drafted them.
        Fan confidence is the percentage of submitted
        squads that include each creator.
      </p>

      <p className="mt-2 text-sm text-[#405563]">
        {data
          ? `${data.totalScouts} submitted squads. `
          : ""}
        Shared picks refresh every five seconds.
        YouTube statistics update when the team refreshes
        the creator dataset.
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
          Loading the shared Watchlist…
        </p>
      )}

      {data && data.creators.length === 0 && (
        <div className="mt-8">
          <p>No squads have been submitted yet.</p>

          <Link
            href="/draft"
            className="mt-3 inline-block underline"
          >
            Draft your squad →
          </Link>
        </div>
      )}

      {data && data.creators.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-[#10364c]/25">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-[#10364c]/25 text-xs uppercase text-[#405563]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="py-3">Creator</th>
                <th className="py-3">Game</th>
                <th className="py-3">Subs</th>
                <th className="py-3">Momentum</th>
                <th className="py-3">Growth bonus</th>
                <th className="py-3 pr-4">
                  Fan confidence
                </th>
              </tr>
            </thead>

            <tbody>
              {data.creators.map((creator, index) => {
                const confidence = data.totalScouts
                  ? Math.round(
                      (creator.draftCount /
                        data.totalScouts) *
                        100
                    )
                  : 0;

                return (
                  <tr
                    key={creator.id}
                    className="border-t border-[#10364c]/20"
                  >
                    <td className="font-display px-4 py-4 text-xl">
                      {index + 1}
                    </td>

                    <td className="py-4">
                      <a
                        href={
                          "https://www.youtube.com/channel/" +
                          encodeURIComponent(creator.id)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:underline"
                      >
                        {creator.name}
                      </a>

                      {creator.signedByFaZe && (
                        <span className="ml-2 text-xs">
                          SIGNED · DEMO
                        </span>
                      )}
                    </td>

                    <td className="py-4">
                      {creator.game}
                    </td>

                    <td className="py-4">
                      {fmt(creator.subs)}
                    </td>

                    <td className="py-4">
                      {creator.momentum}
                    </td>

                    <td className="py-4">
                      {creator.growth > 0
                        ? `+${creator.growth}`
                        : "—"}
                    </td>

                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-20 overflow-hidden rounded bg-[#10364c]/10">
                          <div
                            className="h-full rounded bg-[#a2864b]"
                            style={{
                              width: `${confidence}%`,
                            }}
                          />
                        </div>

                        <span>{confidence}%</span>

                        <span className="text-xs text-[#405563]">
                          ({creator.draftCount}/
                          {data.totalScouts})
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
