"use client";

import { useEffect, useState } from "react";
import { MONTHLY_REWARDS } from "@/lib/rules";

const SHOWN_BACKERS = 6;

export default function MonthlyBoard({ api, userId }) {
  const [state, setState] = useState({
    data: null,
    error: "",
    owner: null,
  });

  useEffect(() => {
    let active = true;
    let busy = false;

    async function load() {
      if (busy) return;
      busy = true;

      try {
        const data = await api("/api/monthly");
        if (active) setState({ data, error: "", owner: userId });
      } catch (error) {
        if (active) {
          setState((previous) => ({
            data: previous.owner === userId ? previous.data : null,
            error: error.message,
            owner: userId,
          }));
        }
      } finally {
        busy = false;
      }
    }

    load();

    const timer = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [api, userId]);

  const data = state.owner === userId ? state.data : null;
  const error = state.owner === userId ? state.error : "";

  return (
    <div>
      <p className="mt-4 text-[#405563]">
        {data ? `${data.month.label}. ` : ""}
        Streamers ranked by their points this month. Scouts
        who drafted a top streamer in any week of the month
        win a reward when the month ends.
      </p>

      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {MONTHLY_REWARDS.map((tier, index) => (
          <li
            key={tier.rank}
            className="rounded-lg border border-[#10364c]/30 p-3"
          >
            <div className="text-xs uppercase tracking-[0.15em] text-[#405563]">
              {index === MONTHLY_REWARDS.length - 1
                ? `#${MONTHLY_REWARDS[index - 1].rank + 1}–${tier.rank} streamer`
                : `#${tier.rank} streamer`}
            </div>
            <div className="mt-1 font-semibold">{tier.reward}</div>
            <div className="mt-1 text-xs text-[#405563]">
              {tier.detail}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
          {data ? " Showing the last loaded results." : ""}
        </p>
      )}

      {!data && !error && (
        <p role="status" className="mt-8">
          Loading this month’s standings…
        </p>
      )}

      {data?.myRewards.length > 0 && (
        <div className="mt-6 rounded-lg border border-[#E4002B] p-4">
          <p className="font-semibold">
            If the month ended now, you would win:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {data.myRewards.map((item) => (
              <li key={item.streamer}>
                {item.reward.reward} — for backing #{item.rank}{" "}
                {item.streamer}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && (
        <>
          <h2 className="font-display mt-10 text-2xl">
            Top streamers
          </h2>

          <ol className="mt-4 divide-y divide-[#10364c]/20 rounded-lg border border-[#10364c]/30">
            {data.streamers.map((streamer) => (
              <li
                key={streamer.id}
                className={`p-5 ${
                  streamer.backedByMe ? "bg-[#10364c]/10" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-display text-2xl">
                    #{streamer.rank}
                  </span>

                  {streamer.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- YouTube avatars, no image config needed
                    <img
                      src={streamer.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full"
                    />
                  ) : null}

                  <div>
                    <strong>{streamer.name}</strong>
                    <div className="text-xs text-[#405563]">
                      {streamer.game}
                    </div>
                  </div>

                  {streamer.reward && (
                    <span className="rounded border border-[#E4002B] px-2 py-1 text-xs text-[#E4002B]">
                      Backers win: {streamer.reward.reward}
                    </span>
                  )}

                  {streamer.backedByMe && (
                    <span className="rounded bg-[#10364c] px-2 py-1 text-xs text-[#fff7e5]">
                      YOU BACKED THEM
                    </span>
                  )}

                  <span className="ml-auto font-semibold">
                    {streamer.points} pts
                  </span>
                </div>

                <p className="mt-3 text-sm text-[#405563]">
                  {streamer.backers.length === 0
                    ? "No scouts backed this streamer this month."
                    : `Backed by ${streamer.backers
                        .slice(0, SHOWN_BACKERS)
                        .map((backer) =>
                          backer.mine ? "you" : backer.scout
                        )
                        .join(", ")}${
                        streamer.backers.length > SHOWN_BACKERS
                          ? ` and ${streamer.backers.length - SHOWN_BACKERS} more`
                          : ""
                      }`}
                </p>
              </li>
            ))}
          </ol>

          <h2 className="font-display mt-10 text-2xl">
            Top scouts this month
          </h2>

          <p className="mt-2 text-sm text-[#405563]">
            Weekly points added up, plus top 3 bonuses from
            weeks that have finished.
          </p>

          {data.scouts.length === 0 ? (
            <p className="mt-4">No squads drafted this month yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-[#10364c]/20 rounded-lg border border-[#10364c]/30">
              {data.scouts.map((row) => (
                <li
                  key={row.id}
                  className={`flex flex-wrap items-center gap-4 p-4 ${
                    row.mine ? "bg-[#10364c]/10" : ""
                  }`}
                >
                  <span className="font-display text-xl">
                    #{row.rank}
                  </span>
                  <strong>{row.scout}</strong>
                  {row.mine && (
                    <span className="rounded bg-[#10364c] px-2 py-1 text-xs text-[#fff7e5]">
                      YOU
                    </span>
                  )}
                  <span className="text-xs text-[#405563]">
                    {row.weeksPlayed} week
                    {row.weeksPlayed === 1 ? "" : "s"} played
                    {row.weeklyWins > 0
                      ? ` · ${row.weeklyWins} weekly win${row.weeklyWins === 1 ? "" : "s"}`
                      : ""}
                    {row.bonusPoints > 0
                      ? ` · +${row.bonusPoints} bonus`
                      : ""}
                  </span>
                  <span className="ml-auto font-semibold">
                    {row.total} pts
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
