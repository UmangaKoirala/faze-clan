'use client';

import { useEffect, useState } from 'react';
import { readScoutName } from '@/lib/format';

export default function LeaderboardPage() {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState('');

  useEffect(() => {
    const load = () =>
      fetch('/api/leaderboard')
        .then((r) => r.json())
        .then((data) => {
          setMe(readScoutName().toLowerCase());
          setRows(data);
        });
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">
        Scout <span className="text-[#7a5c2a]">leaderboard</span>
      </h1>
      <p className="mt-2 text-[#10364c]/70">
        Points = creator momentum + real growth since the season started. Refreshes every 30 seconds.
      </p>

      {!rows ? (
        <p className="mt-8 text-[#10364c]/65">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-[#10364c]/65">No teams yet. Be the first to draft.</p>
      ) : (
        <ol className="mt-8 divide-y divide-[#10364c]/15 rounded-lg border border-[#10364c]/15">
          {rows.map((r) => {
            const mine = r.scout.toLowerCase() === me;
            return (
              <li
                key={r.scout}
                className={`flex flex-wrap items-center gap-4 px-4 py-3 ${mine ? 'bg-[#a68243]/20' : ''}`}
              >
                <span className="font-display w-12 text-2xl text-[#10364c]/65">#{r.rank}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {r.scout}
                    {mine && <span className="ml-2 rounded bg-[#10364c] px-2 py-0.5 text-xs text-[#e9dfc9]">YOU</span>}
                    {r.kingmaker && (
                      <span className="ml-2 rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
                        KINGMAKER
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-[#10364c]/65">{r.picks.join(' · ')}</div>
                </div>
                <span className="font-display text-2xl">{r.points}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
