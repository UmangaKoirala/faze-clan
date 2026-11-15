'use client';

import { useEffect, useState } from 'react';
import { fmt } from '@/lib/format';

export default function WatchlistPage() {
  const [data, setData] = useState(null);
  const [requested, setRequested] = useState({});

  useEffect(() => {
    fetch('/api/watchlist').then((r) => r.json()).then(setData);
  }, []);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a5c2a]">For the FaZe talent team</p>
      <h1 className="font-display mt-2 text-4xl">FaZe Watchlist</h1>
      <p className="mt-2 max-w-2xl text-[#10364c]/70">
        A crowd-scouted talent pipeline, updated live from YouTube. Fan confidence is the share of scouts who
        drafted each creator.
        {data ? ` ${data.totalScouts} scouts voted with their picks.` : ''}
      </p>

      {!data ? (
        <p className="mt-8 text-[#10364c]/65">Loading…</p>
      ) : data.creators.length === 0 ? (
        <p className="mt-8 text-[#10364c]/65">No drafts yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-[#10364c]/15">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase text-[#10364c]/65">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="py-3">Creator</th>
                <th className="py-3">Game</th>
                <th className="py-3">Subs</th>
                <th className="py-3">Momentum</th>
                <th className="py-3">Growth</th>
                <th className="py-3">Fan confidence</th>
                <th className="py-3 pr-4 text-right">Talent team</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.map((c, i) => {
                const confidence = Math.round((c.draftCount / data.totalScouts) * 100);
                return (
                  <tr key={c.id} className="border-t border-[#10364c]/15">
                    <td className="font-display px-4 py-3 text-xl">{i + 1}</td>
                    <td className="py-3">
                      <a
                        href={`https://www.youtube.com/${c.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:text-[#7a5c2a]"
                      >
                        {c.name}
                      </a>
                      {c.signedByFaZe && (
                        <span className="ml-2 rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">SIGNED</span>
                      )}
                    </td>
                    <td className="py-3">{c.game}</td>
                    <td className="py-3">{fmt(c.subs)}</td>
                    <td className="py-3">{c.momentum}</td>
                    <td className="py-3">{c.growth > 0 ? `+${c.growth}` : '–'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded bg-[#10364c]/10">
                          <div className="h-2 rounded bg-[#a68243]" style={{ width: `${confidence}%` }} />
                        </div>
                        <span>{confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {requested[c.id] ? (
                        <span className="text-xs text-[#1f6b3a]">Sent to FaZe talent team ✓</span>
                      ) : (
                        <button
                          onClick={() => setRequested({ ...requested, [c.id]: true })}
                          className="rounded border border-[#10364c]/35 px-3 py-1 text-xs font-semibold hover:border-[#10364c] hover:bg-[#10364c] hover:text-[#e9dfc9]"
                        >
                          Request tryout
                        </button>
                      )}
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
