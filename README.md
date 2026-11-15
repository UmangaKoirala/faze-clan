# FaZe Draft

Fantasy sports for gaming creators, built for the HackUTA 2026 FaZe Clan challenge.
Fans draft 5 small YouTube gaming creators with a $50 budget, earn points as those
creators grow in real life, and become a **Kingmaker** if FaZe signs their pick.
FaZe gets a **Watchlist** of the creators fans believe in most.

## Run it

Needs Node 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

| Page | What it does |
|---|---|
| `/` | Home: "Scout the next FaZe star" |
| `/draft` | Pick 5 creators under the $50 budget and lock in a team |
| `/leaderboard` | Scouts ranked by points (refreshes every 30 seconds) |
| `/watchlist` | Most-drafted creators: the FaZe talent team's view |

## Data commands

Put your keys in `.env.local` (never committed):

```
YOUTUBE_API_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

| Command | What it does |
|---|---|
| `npm run fetch` | Reads `data/channel-list.json`, gets real stats from YouTube, writes `data/creators.json` and a new snapshot in `data/snapshots/`. Run it every 30 minutes so growth points change |
| `npm run ai` | Writes a one-line AI scout report for each creator (Gemini free tier) |
| `npm run seed` | Adds 15 sample scouts to `data/teams.json` so the leaderboard looks alive |

`data/channel-list.json` lists the creators, in the same format as `data/channel-list.example.json`.

## Kingmaker demo moment

In `data/creators.json`, set `"signedByFaZe": true` on one creator and save.
Every scout who drafted them gets a **KINGMAKER** badge, and the Watchlist marks them **SIGNED**.

## How scoring works

- **Momentum (0–100):** 50% recent views compared with subscribers, 30% uploads in the last 30 days, 20% engagement, ranked against the other creators
- **Salary ($3–$15):** 1K subs = $3, 10K = $9, 100K+ = $15
- **Team points:** each creator's momentum plus growth points (up to 50) from real view and subscriber growth since the first snapshot

## Project layout

```
app/            pages and API routes (api/creators, api/draft, api/leaderboard, api/watchlist)
lib/            data.js (JSON files), score.js (scoring), format.js (number formatting)
scripts/        fetch-creators.mjs, ai-reports.mjs, seed-teams.mjs
data/           creators.json, channel-list.json, snapshots/, teams.json (local only)
```
