'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmt, readScoutName } from '@/lib/format';

const BUDGET = 50;
const TEAM_SIZE = 5;

export default function DraftPage() {
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [picks, setPicks] = useState([]);
  const [scout, setScout] = useState('');
  const [game, setGame] = useState('All');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/creators')
      .then((r) => r.json())
      .then((data) => {
        setCreators(data);
        setScout((current) => current || readScoutName());
      });
  }, []);

  const byId = useMemo(() => Object.fromEntries(creators.map((c) => [c.id, c])), [creators]);
  const spent = picks.reduce((sum, id) => sum + (byId[id]?.salary || 0), 0);
  const games = ['All', ...new Set(creators.map((c) => c.game))];
  const shown = creators
    .filter((c) => game === 'All' || c.game === game)
    .sort((a, b) => b.momentum - a.momentum);

  function toggle(c) {
    setError('');
    if (picks.includes(c.id)) {
      setPicks(picks.filter((id) => id !== c.id));
      return;
    }
    if (picks.length >= TEAM_SIZE) {
      setError('Your team is full. Remove someone first.');
      return;
    }
    if (spent + c.salary > BUDGET) {
      setError(`Not enough budget for ${c.name}. You have $${BUDGET - spent} left.`);
      return;
    }
    setPicks([...picks, c.id]);
  }

  async function lockIn() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scout, picks }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || 'Could not save your team.');
      return;
    }
    try {
      localStorage.setItem('scoutName', scout.trim());
    } catch {}
    router.push('/leaderboard');
  }

  return (
    <div className="pb-48">
      <h1 className="font-display text-4xl">
        Draft your <span className="text-[#E4002B]">squad</span>
      </h1>
      <p className="mt-2 text-white/60">
        Pick {TEAM_SIZE} creators with a ${BUDGET} budget. Higher momentum means faster growth.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {games.map((g) => (
          <button
            key={g}
            onClick={() => setGame(g)}
            className={`rounded-full border px-4 py-1 text-sm ${
              game === g ? 'border-[#E4002B] bg-[#E4002B]' : 'border-white/20 hover:border-white/60'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => {
          const picked = picks.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c)}
              className={`rounded-lg border p-4 text-left transition ${
                picked ? 'border-[#E4002B] bg-[#E4002B]/10' : 'border-white/10 hover:border-white/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {c.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- YouTube avatars, no image config needed
                  <img src={c.avatar} alt="" className="h-12 w-12 rounded-full" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-bold">
                    {c.name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className="text-xs text-white/50">
                    {c.game} · {fmt(c.subs)} subs
                  </div>
                </div>
                <div className="font-display text-2xl">${c.salary}</div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Momentum</span>
                  <span>{c.momentum}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-white/10">
                  <div className="h-2 rounded bg-[#E4002B]" style={{ width: `${c.momentum}%` }} />
                </div>
              </div>
              <p className="mt-3 text-sm text-white/70">{c.scoutReport}</p>
              <div className="mt-3 text-xs text-white/40">
                Drafted by {c.draftCount} scouts{c.growth > 0 ? ` · +${c.growth} growth pts` : ''}
              </div>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="text-sm">
            <span className="font-display text-2xl">${BUDGET - spent}</span>{' '}
            <span className="text-white/50">
              left · {picks.length}/{TEAM_SIZE} picked
            </span>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {picks.map((id) => (
              <span key={id} className="rounded bg-white/10 px-2 py-1 text-xs">
                {byId[id]?.name}
              </span>
            ))}
          </div>
          <input
            value={scout}
            onChange={(e) => setScout(e.target.value)}
            placeholder="Your scout name"
            className="rounded border border-white/20 bg-transparent px-3 py-2 text-sm"
          />
          <button
            onClick={lockIn}
            disabled={picks.length !== TEAM_SIZE || !scout.trim() || saving}
            className="rounded bg-[#E4002B] px-5 py-2 font-semibold disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Lock in team'}
          </button>
          {error && <p className="w-full text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
