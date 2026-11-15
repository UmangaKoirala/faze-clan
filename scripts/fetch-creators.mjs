// Run: node --env-file=.env.local scripts/fetch-creators.mjs
import fs from 'fs';
import path from 'path';

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) {
  console.error('Missing YOUTUBE_API_KEY in .env.local');
  process.exit(1);
}

const API = 'https://www.googleapis.com/youtube/v3';
const DATA = path.join(process.cwd(), 'data');

async function yt(endpoint, params) {
  const url = new URL(`${API}/${endpoint}`);
  for (const [k, v] of Object.entries({ ...params, key: KEY })) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${json.error?.message || res.status}`);
  return json;
}

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// Where a value sits in the group, from 0 (lowest) to 1 (highest)
function percentile(values, v) {
  const below = values.filter((x) => x < v).length;
  const same = values.filter((x) => x === v).length;
  return values.length > 1 ? (below + (same - 1) / 2) / (values.length - 1) : 1;
}

const listFile = path.join(DATA, 'channel-list.json');
if (!fs.existsSync(listFile)) {
  console.error('Missing data/channel-list.json. Create it like data/channel-list.example.json:');
  console.error('[ { "handle": "@SomeCreator", "game": "Fortnite" } ]');
  process.exit(1);
}
let list;
try {
  list = JSON.parse(fs.readFileSync(listFile, 'utf8'));
} catch (err) {
  console.error(`data/channel-list.json is not valid JSON: ${err.message}`);
  console.error('Check it at https://jsonlint.com (commas between entries, none after the last one).');
  process.exit(1);
}
if (!Array.isArray(list) || list.length === 0) {
  console.error('data/channel-list.json is empty. Add at least 5 creators.');
  process.exit(1);
}
console.log(`Fetching ${list.length} creators from YouTube...\n`);
const oldFile = path.join(DATA, 'creators.json');
const old = fs.existsSync(oldFile) ? JSON.parse(fs.readFileSync(oldFile, 'utf8')) : [];
const oldById = Object.fromEntries(old.map((o) => [o.id, o]));

const raw = [];
for (const entry of list) {
  try {
    const ch = await yt('channels', { part: 'snippet,statistics,contentDetails', forHandle: entry.handle });
    const c = ch.items?.[0];
    if (!c) {
      console.warn(`✗ Not found: ${entry.handle}`);
      continue;
    }

    const uploads = c.contentDetails.relatedPlaylists.uploads;
    const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 10 });
    const ids = (pl.items || []).map((i) => i.contentDetails.videoId);
    const vids = ids.length
      ? await yt('videos', { part: 'snippet,statistics', id: ids.join(',') })
      : { items: [] };

    let views = 0;
    let likes = 0;
    let comments = 0;
    let last30 = 0;
    const titles = [];
    for (const v of vids.items) {
      views += Number(v.statistics.viewCount || 0);
      likes += Number(v.statistics.likeCount || 0);
      comments += Number(v.statistics.commentCount || 0);
      titles.push(v.snippet.title);
      if (Date.now() - new Date(v.snippet.publishedAt).getTime() < 30 * 864e5) last30++;
    }

    const subs = Number(c.statistics.subscriberCount || 0);
    const recentAvgViews = vids.items.length ? Math.round(views / vids.items.length) : 0;

    raw.push({
      id: c.id,
      handle: entry.handle,
      name: c.snippet.title,
      avatar: c.snippet.thumbnails?.medium?.url || c.snippet.thumbnails?.default?.url || '',
      game: entry.game,
      subs,
      views: Number(c.statistics.viewCount || 0),
      videos: Number(c.statistics.videoCount || 0),
      recentAvgViews,
      uploadsLast30d: last30,
      engagement: views ? (likes + comments) / views : 0,
      reach: subs ? recentAvgViews / subs : 0,
      recentTitles: titles,
    });
    console.log(`✓ ${c.snippet.title}`);
  } catch (err) {
    console.warn(`✗ ${entry.handle}: ${err.message}`);
  }
}

const reachVals = raw.map((r) => r.reach);
const uploadVals = raw.map((r) => Math.min(r.uploadsLast30d, 30));
const engVals = raw.map((r) => r.engagement);

const creators = raw.map((r) => {
  const momentum = Math.round(
    100 *
      (0.5 * percentile(reachVals, r.reach) +
        0.3 * percentile(uploadVals, Math.min(r.uploadsLast30d, 30)) +
        0.2 * percentile(engVals, r.engagement))
  );
  // 1K subs = $3, 10K = $9, 100K+ = $15
  const logSubs = Math.log10(Math.max(r.subs, 1000));
  const salary = Math.max(3, Math.min(15, Math.round(3 + ((logSubs - 3) / 2) * 12)));
  const templateReport = `${r.game} · ${r.uploadsLast30d} uploads in 30 days · avg ${fmt(r.recentAvgViews)} views on ${fmt(r.subs)} subs (${Math.round(r.reach * 100)}% reach)`;
  const prev = oldById[r.id] || {};
  return {
    ...r,
    momentum,
    salary,
    aiReport: prev.aiReport || null,
    scoutReport: prev.aiReport || templateReport,
    signedByFaZe: prev.signedByFaZe || false,
  };
});

fs.writeFileSync(oldFile, JSON.stringify(creators, null, 2));

const snapDir = path.join(DATA, 'snapshots');
fs.mkdirSync(snapDir, { recursive: true });
const stats = Object.fromEntries(creators.map((c) => [c.id, { views: c.views, subs: c.subs }]));
fs.writeFileSync(
  path.join(snapDir, `${Date.now()}.json`),
  JSON.stringify({ takenAt: new Date().toISOString(), stats }, null, 2)
);

// Keep only two snapshots: the first one (baseline) and the newest (latest).
// Growth points compare these two, so the ones in between are not needed.
const snaps = fs.readdirSync(snapDir).filter((f) => f.endsWith('.json')).sort();
for (const f of snaps.slice(1, -1)) fs.unlinkSync(path.join(snapDir, f));

console.log(`\nSaved ${creators.length} creators. Snapshots kept: baseline + latest.`);