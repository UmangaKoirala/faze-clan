'use client';

import { useEffect, useState } from 'react';

function timeAgo(iso) {
  if (!iso) return 'Not yet';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
}

export default function LiveStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((s) => setStats({ ...s, ago: timeAgo(s.updatedAt) }));
  }, []);

  const items = [
    [stats ? stats.creators : '–', 'creators tracked'],
    [stats ? stats.scouts : '–', 'scouts drafting'],
    [stats ? stats.ago : '–', 'last YouTube update'],
  ];

  return (
    <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-y border-white/10 py-5">
      {items.map(([value, label]) => (
        <div key={label}>
          <div className="font-display text-2xl sm:text-3xl">{value}</div>
          <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
        </div>
      ))}
    </div>
  );
}
