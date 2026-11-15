"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

function timeAgo(iso) {
  if (!iso) return "Not yet";

  const minutes = Math.max(
    0,
    Math.round(
      (Date.now() - new Date(iso).getTime()) / 60000
    )
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  return `${Math.round(minutes / 60)} h ago`;
}

export default function LiveStats() {
  const { ready, user, api } = useAuth();
  const userId = user?.id || null;

  const [state, setState] = useState({
    stats: null,
    owner: null,
    error: "",
  });

  useEffect(() => {
    if (!ready) return;

    let active = true;
    let busy = false;

    async function load() {
      if (busy) return;
      busy = true;

      try {
        const stats = await api("/api/stats");

        if (active) {
          setState({
            stats,
            owner: userId,
            error: "",
          });
        }
      } catch {
        if (active) {
          setState({
            stats: null,
            owner: userId,
            error: "Stats temporarily unavailable.",
          });
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
  }, [ready, userId, api]);

  const stats =
    state.owner === userId ? state.stats : null;

  const items = [
    [
      stats ? stats.creators : "—",
      "creators tracked",
    ],
    [
      !ready
        ? "—"
        : userId
          ? stats?.scouts ?? "—"
          : "Sign in",
      "submitted squads",
    ],
    [
      stats ? timeAgo(stats.updatedAt) : "—",
      "last YouTube update",
    ],
  ];

  return (
    <div>
      <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-y border-[#10364c]/20 py-5">
        {items.map(([value, label]) => (
          <div key={label}>
            <div className="font-display text-2xl sm:text-3xl">
              {value}
            </div>

            <div className="text-[11px] uppercase tracking-wider text-[#405563]">
              {label}
            </div>
          </div>
        ))}
      </div>

      {state.owner === userId && state.error && (
        <p role="status" className="mt-2 text-xs text-[#405563]">
          {state.error}
        </p>
      )}
    </div>
  );
}
