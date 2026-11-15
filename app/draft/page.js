'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fmt, readScoutName } from '@/lib/format';

const BUDGET = 50;
const TEAM_SIZE = 5;

const TIERS = [
  { key: 'star', label: '⭐ Star', range: '$12–15', hint: 'Proven channels. Safer, but they eat your budget.', test: (s) => s >= 12 },
  { key: 'rising', label: '🔥 Rising', range: '$7–11', hint: 'Growing fast. The core of most squads.', test: (s) => s >= 7 && s < 12 },
  { key: 'sleeper', label: '💎 Sleeper', range: '$3–6', hint: 'Tiny channels. The next FaZe Rug could be here.', test: (s) => s < 7 },
];

export default function DraftPage() {
  const [creators, setCreators] = useState([]);
  const [picks, setPicks] = useState([]);
  const [scout, setScout] = useState('');
  const [game, setGame] = useState('All');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(null);
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);

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
  const q = query.trim().toLowerCase();
  const shown = creators
    .filter((c) => game === 'All' || c.game === game)
    .filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.game.toLowerCase().includes(q) ||
        (c.handle || '').toLowerCase().includes(q)
    )
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
    setCopied(false);
    setShareText('');
    setLocked({ scout: scout.trim(), picks: picks.map((id) => byId[id]), cost: spent });
  }

  async function share() {
    const names = locked.picks.map((c) => c.name).join(', ');
    const text = `My FaZe Draft squad: ${names} ($${locked.cost}/$${BUDGET}). Think you can scout better? ${window.location.origin}/draft`;
    setShareText(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (locked) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a5c2a]">Squad locked 🔒</p>
        <h1 className="font-display mt-3 text-5xl leading-none">You are in, {locked.scout}.</h1>
        <p className="mt-3 text-[#10364c]/70">Your points grow as these creators grow on YouTube.</p>
        <ul className="mt-8 divide-y divide-[#10364c]/15 rounded-lg border border-[#10364c]/15">
          {locked.picks.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- YouTube avatars, no image config needed
                <img src={c.avatar} alt="" className="h-9 w-9 rounded-full" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10364c]/10 text-sm font-bold">
                  {c.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="text-xs text-[#10364c]/65">
                  {c.game} · momentum {c.momentum}
                </div>
              </div>
              <div className="font-display text-xl">${c.salary}</div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-sm text-[#10364c]/70">
          Total <span className="font-display text-lg text-[#10364c]">${locked.cost}</span> of ${BUDGET}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={share} className="rounded bg-[#10364c] px-6 py-3 font-semibold text-[#e9dfc9] hover:bg-[#28536a]">
            Share your squad
          </button>
          <Link href="/leaderboard" className="rounded border border-[#10364c]/35 px-6 py-3 font-semibold hover:border-[#10364c]">
            See the leaderboard
          </Link>
          <button onClick={() => setLocked(null)} className="px-2 py-3 text-sm text-[#10364c]/70 hover:text-[#10364c]">
            Edit squad
          </button>
        </div>
        {shareText && (
          <div className="mt-4">
            <p className="text-sm text-[#10364c]/80">
              {copied ? 'Copied. Paste it in your group chat.' : 'Copy this and share it with your friends:'}
            </p>
            {!copied && (
              <textarea
                readOnly
                value={shareText}
                onFocus={(e) => e.target.select()}
                className="mt-2 h-24 w-full rounded border border-[#10364c]/25 bg-transparent p-2 text-sm"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-48">
      <h1 className="font-display text-4xl">
        Draft your <span className="text-[#7a5c2a]">squad</span>
      </h1>
      <p className="mt-2 text-[#10364c]/70">
        Pick {TEAM_SIZE} creators with a ${BUDGET} budget. Higher momentum means faster growth.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-[#10364c]/30 bg-[#10364c]/5 px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#10364c]/65">Season 1 · Open League</div>
          <div className="font-semibold">
            Presented by <span className="text-[#7a5c2a]">Your Brand Here</span>
          </div>
        </div>
        <div className="text-xs text-[#10364c]/65">Sponsored leagues: brand prizes for the top scouts</div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label htmlFor="creator-search" className="sr-only">
          Search creators
        </label>
        <input
          id="creator-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators or games…"
          className="w-full rounded-full border border-[#10364c]/25 bg-transparent px-4 py-1.5 text-sm placeholder:text-[#10364c]/50 focus:border-[#10364c] focus:outline-none sm:w-64"
        />
        {games.map((g) => (
          <button
            key={g}
            onClick={() => setGame(g)}
            className={`rounded-full border px-4 py-1 text-sm ${
              game === g ? 'border-[#10364c] bg-[#10364c] text-[#e9dfc9]' : 'border-[#10364c]/25 hover:border-[#10364c]/60'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {creators.length > 0 && shown.length === 0 && (
        <p className="mt-10 text-[#10364c]/70">
          No creators match “{query}”.{' '}
          <button onClick={() => setQuery('')} className="underline">
            Clear search
          </button>
        </p>
      )}

      {TIERS.map((tier) => {
        const list = shown.filter((c) => tier.test(c.salary));
        if (list.length === 0) return null;
        return (
          <section key={tier.key} className="mt-10">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-2xl">{tier.label}</h2>
              <span className="text-sm text-[#10364c]/65">{tier.range}</span>
              <span className="text-sm text-[#10364c]/60">{tier.hint}</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const picked = picks.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c)}
                    className={`rounded-lg border p-4 text-left transition ${
                      picked ? 'border-[#a68243] bg-[#a68243]/15' : 'border-[#10364c]/15 hover:border-[#10364c]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {c.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element -- YouTube avatars, no image config needed
                        <img src={c.avatar} alt="" className="h-12 w-12 rounded-full" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10364c]/10 font-bold">
                          {c.name[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{c.name}</div>
                        <div className="text-xs text-[#10364c]/65">
                          {c.game} · {fmt(c.subs)} subs
                        </div>
                      </div>
                      <div className="font-display text-2xl">${c.salary}</div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-[#10364c]/70">
                        <span>Momentum</span>
                        <span>{c.momentum}</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-[#10364c]/10">
                        <div className="h-2 rounded bg-[#a68243]" style={{ width: `${c.momentum}%` }} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[#10364c]/80">{c.scoutReport}</p>
                    <div className="mt-3 text-xs text-[#10364c]/60">
                      Drafted by {c.draftCount} scouts{c.growth > 0 ? ` · +${c.growth} growth pts` : ''}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded bg-[#10364c]/5 px-2 py-1.5 text-xs text-[#10364c]/60">
                      <span>🔒 30-day growth chart</span>
                      <span className="font-semibold text-[#7a5c2a]">Scout Pro</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="fixed inset-x-0 bottom-0 border-t border-[#10364c]/15 bg-[#e9dfc9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="text-sm">
            <span className="font-display text-2xl">${BUDGET - spent}</span>{' '}
            <span className="text-[#10364c]/65">
              left · {picks.length}/{TEAM_SIZE} picked
            </span>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {picks.map((id) => (
              <span key={id} className="rounded bg-[#10364c]/10 px-2 py-1 text-xs">
                {byId[id]?.name}
              </span>
            ))}
          </div>
          <input
            value={scout}
            onChange={(e) => setScout(e.target.value)}
            placeholder="Your scout name"
            className="rounded border border-[#10364c]/25 bg-transparent px-3 py-2 text-sm"
          />
          <button
            onClick={lockIn}
            disabled={picks.length !== TEAM_SIZE || !scout.trim() || saving}
            className="rounded bg-[#10364c] px-5 py-2 font-semibold text-[#e9dfc9] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Lock in team'}
          </button>
          {error && <p className="w-full text-sm text-[#b3261e]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
