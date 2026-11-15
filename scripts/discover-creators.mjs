import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) {
  console.error('Missing YOUTUBE_API_KEY in .env.local');
  process.exit(1);
}

const API = 'https://www.googleapis.com/youtube/v3';
const games = ['Fortnite', 'Warzone', 'Valorant', 'Minecraft'];
const since = new Date(Date.now() - 14 * 864e5).toISOString();
const candidates = new Map();
const selected = [];
const seenHandles = new Set();

async function yt(endpoint, params) {
  const url = new URL(`${API}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { 'x-goog-api-key': KEY },
    signal: AbortSignal.timeout(30000),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      `${endpoint}: ${result.error?.message || response.status}`
    );
  }
  return result;
}

try {
  for (const game of games) {
    console.log(`Searching recent ${game} videos...`);

    const result = await yt('search', {
      part: 'snippet',
      type: 'video',
      q: `${game} gameplay`,
      publishedAfter: since,
      order: 'date',
      maxResults: 50,
      relevanceLanguage: 'en',
    });

    for (const item of result.items || []) {
      const id = item.snippet?.channelId;
      if (id && !candidates.has(id)) {
        candidates.set(id, game);
      }
    }
  }

  const ids = [...candidates.keys()];
  const eligible = [];

  for (let start = 0; start < ids.length; start += 50) {
    const result = await yt('channels', {
      part: 'snippet,statistics',
      id: ids.slice(start, start + 50).join(','),
      maxResults: 50,
    });

    for (const channel of result.items || []) {
      const stats = channel.statistics;
      const subs = Number(stats?.subscriberCount);
      const handle = channel.snippet?.customUrl;

      if (
        stats?.hiddenSubscriberCount ||
        !Number.isFinite(subs) ||
        subs < 1000 ||
        subs > 100000 ||
        !handle?.startsWith('@')
      ) {
        continue;
      }

      eligible.push({
        handle,
        game: candidates.get(channel.id),
        subs,
        name: channel.snippet.title,
      });
    }
  }

  // Favor smaller channels and take turns across games.
  const pools = games.map((game) =>
    eligible
      .filter((creator) => creator.game === game)
      .sort((a, b) => a.subs - b.subs)
  );

  while (selected.length < 30 && pools.some((pool) => pool.length)) {
    for (const pool of pools) {
      if (selected.length >= 30) break;

      const creator = pool.shift();
      if (!creator) continue;

      const normalized = creator.handle.toLowerCase();
      if (seenHandles.has(normalized)) continue;

      seenHandles.add(normalized);
      selected.push(creator);
    }
  }

  if (!selected.length) {
    throw new Error(
      'No qualifying channels found. Existing channel list was preserved.'
    );
  }

  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const file = path.join(dataDir, 'channel-list.json');
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.${Date.now()}.bak`);
  }

  fs.writeFileSync(
    file,
    JSON.stringify(
      selected.map(({ handle, game }) => ({ handle, game })),
      null,
      2
    ) + '\n'
  );

  for (const creator of selected) {
    console.log(
      `${creator.game}: ${creator.handle} — ${creator.subs} subscribers`
    );
  }

  console.log(`Saved ${selected.length} channels to data/channel-list.json.`);
  console.log(
    'Review channel relevance before fetching stats. Game labels come from search queries.'
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}