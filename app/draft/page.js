'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fmt } from '@/lib/format';
import { useAuth } from '../components/AuthProvider';

const BUDGET = 50;
const TEAM_SIZE = 5;

const TIERS = [
  { key: 'star', label: '⭐ Star', range: '$12–25', hint: 'Proven channels. Safer, but they eat your budget.', test: (s) => s >= 12 },
  { key: 'rising', label: '🔥 Rising', range: '$7–11', hint: 'Growing fast. The core of most squads.', test: (s) => s >= 7 && s < 12 },
  { key: 'sleeper', label: '💎 Sleeper', range: '$6', hint: 'Tiny channels. The next FaZe Rug could be here.', test: (s) => s < 7 },
];

export default function DraftPage() {
  const { user, ready, api, error: authError } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [loadedFor, setLoadedFor] = useState(null);
  const [creators, setCreators] = useState([]);
  const [picks, setPicks] = useState([]);
  const [scout, setScout] = useState('');
  const [game, setGame] = useState('All');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(null);
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ready || !userId) return;

    let active = true;

    Promise.all([
      api('/api/creators'),
      api('/api/draft')
    ])
      .then(([data, saved]) => {
        if (!active) return;

        setCreators(data);
        setPicks(saved.team?.picks || []);
        setScout(saved.scout);
        setLocked(null);
        setError('');
        setLoading(false);
        setLoadedFor(userId);
      })
      .catch((error) => {
        if (!active) return;

        setCreators([]);
        setPicks([]);
        setLocked(null);
        setScout('');
        setError(error.message);
        setLoading(false);
        setLoadedFor(userId);
      });

    return () => {
      active = false;
    };
  }, [ready, userId, api]);

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
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      const result = await api('/api/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ picks }),
      });

      setCopied(false);
      setShareText('');

      setLocked({
        scout: result.scout,
        picks: picks.map((id) => byId[id]),
        cost: spent,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
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

  if (!ready) {
    return <p className="py-8">Checking your session…</p>;
  }

  if (!userId) {
    return (
      <div className="py-8">
        <h1 className="font-display text-3xl">
          Sign in to draft your squad.
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

  if (loading || loadedFor !== userId) {
    return (
      <p className="py-8" role="status">
        Loading your saved squad…
      </p>
    );
  }

  if (!creators.length && error) {
    return (
      <div className="py-8">
        <p role="alert">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="mt-3 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E4002B]">Squad locked 🔒</p>
        <h1 className="font-display mt-3 text-5xl leading-none">You are in, {locked.scout}.</h1>
        <p className="mt-3 text-white/60">Your points grow as these creators grow on YouTube.</p>
        <ul className="mt-8 divide-y divide-white/10 rounded-lg border border-white/10">
          {locked.picks.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- YouTube avatars, no image config needed
                <img src={c.avatar} alt="" className="h-9 w-9 rounded-full" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                  {c.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="text-xs text-white/50">
                  {c.game} · momentum {c.momentum}
                </div>
              </div>
              <div className="font-display text-xl">${c.salary}</div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-sm text-white/60">
          Total <span className="font-display text-lg text-white">${locked.cost}</span> of ${BUDGET}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={share} className="rounded bg-[#E4002B] px-6 py-3 font-semibold hover:bg-red-700">
            Share your squad
          </button>
          <Link href="/leaderboard" className="rounded border border-white/30 px-6 py-3 font-semibold hover:border-white">
            See the leaderboard
          </Link>
          <button onClick={() => setLocked(null)} className="px-2 py-3 text-sm text-white/60 hover:text-white">
            Edit squad
          </button>
        </div>
        {shareText && (
          <div className="mt-4">
            <p className="text-sm text-white/70">
              {copied ? 'Copied. Paste it in your group chat.' : 'Copy this and share it with your friends:'}
            </p>
            {!copied && (
              <textarea
                readOnly
                value={shareText}
                onFocus={(e) => e.target.select()}
                className="mt-2 h-24 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
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
        Draft your <span className="text-[#E4002B]">squad</span>
      </h1>
      <p className="mt-2 text-white/60">
        Pick {TEAM_SIZE} creators with a ${BUDGET} budget. Momentum reflects recent activity; measured growth adds bonus points.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-white/25 bg-white/5 px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">Season 1 · Open League</div>
          <div className="font-semibold">
            Presented by <span className="text-[#E4002B]">UTA</span>
          </div>
        </div>
        <div className="text-xs text-white/50">Sponsored leagues: brand prizes for the top scouts</div>
      </div>

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

      {TIERS.map((tier) => {
        const list = shown.filter((c) => tier.test(c.salary));
        if (list.length === 0) return null;
        return (
          <section key={tier.key} className="mt-10">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-2xl">{tier.label}</h2>
              <span className="text-sm text-white/50">{tier.range}</span>
              <span className="text-sm text-white/40">{tier.hint}</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
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
                    <div className="mt-3 flex items-center justify-between rounded bg-white/5 px-2 py-1.5 text-xs text-white/40">
                      <span>🔒 30-day growth chart</span>
                      <span className="font-semibold text-[#E4002B]">Scout Pro</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

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
          <span className="text-sm">
            Signed in as {scout}
          </span>

          <button
            onClick={() => {
              setPicks([]);
              setError('');
            }}
            disabled={saving}
            className="px-2 py-2 text-sm underline"
          >
            Clear picks
          </button>
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
