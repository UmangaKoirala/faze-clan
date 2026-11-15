# FaZe Draft

Fantasy sports for gaming creators, built for the HackUTA 2026 FaZe Clan challenge.
Each week fans draft 4 small YouTube gaming creators with $24 of virtual money, earn
points as those creators grow in real life, and become a **Kingmaker** if FaZe signs their pick.
FaZe gets a **Watchlist** of the creators fans believe in most.

## Run it

First run `supabase/weekly-league.sql` once in the Supabase SQL editor. It creates the
`weekly_drafts` table the draft and leaderboards use.

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
| `/draft` | Pick 4 creators with this week's money and lock in a team (changes cost $5) |
| `/leaderboard` | This week, last week, and this month: top streamers and the rewards their backers win |
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

## How the league works

All the numbers live in `lib/rules.js`.

- **Weekly draft:** a new week starts every Monday at 00:00 UTC. Everyone gets $24 and picks 4 creators.
- **Changes:** locking in is free. Each change after that costs $5 from the same week's money, so the more you change, the less you can spend on creators.
- **Weekly prizes:** when the week ends, the top 3 scouts get +15, +10 and +5 bonus points, plus $6, $4 and $2 extra for next week. Everyone gets their money back for the next draft.
- **Monthly leaderboard:** streamers are ranked by their points for the month. Scouts who drafted them in any week of that month win: #1 meet the streamer, #2 signed merch, #3 a shoutout on stream, #4–10 a giveaway entry. Scouts are also ranked by their weekly points plus bonuses.

## How scoring works

- **Momentum (0–100):** 50% recent views compared with subscribers, 30% uploads in the last 30 days, 20% engagement, ranked against the other creators
- **Salary ($3–$15):** 1K subs = $3, 10K = $9, 100K+ = $15
- **Team points:** each creator's momentum plus growth points (up to 50) from real view and subscriber growth between the first and last snapshot of that week (or month, for the monthly streamer ranking)

## Project layout

```
app/            pages and API routes (api/creators, api/draft, api/leaderboard, api/monthly, api/watchlist)
lib/            rules.js (league numbers), weeks.js (week dates), league.js (weekly ranking and money),
                score.js (scoring), data.js (JSON files), format.js (number formatting)
supabase/       weekly-league.sql (run once in the Supabase SQL editor)
scripts/        fetch-creators.mjs, ai-reports.mjs, seed-teams.mjs
data/           creators.json, channel-list.json, snapshots/, teams.json (local only)
```
