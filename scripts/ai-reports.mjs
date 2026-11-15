// Run: node --env-file=.env.local scripts/ai-reports.mjs
import fs from 'fs';
import path from 'path';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
if (!KEY) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

const file = path.join(process.cwd(), 'data', 'creators.json');
const creators = JSON.parse(fs.readFileSync(file, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const c of creators) {
  if (c.aiReport) continue;

  const prompt = `You are a FaZe Clan talent scout. Write ONE punchy sentence (max 20 words) scouting this gaming YouTuber for fans playing a fantasy draft. Mention their game, their content style, and why they could blow up. No hashtags, no emojis.
Channel: ${c.name}
Game: ${c.game}
Subscribers: ${c.subs}
Average views on recent videos: ${c.recentAvgViews}
Uploads in the last 30 days: ${c.uploadsLast30d}
Recent video titles: ${(c.recentTitles || []).join(' | ')}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || res.status);
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) {
      c.aiReport = text;
      c.scoutReport = text;
      console.log(`✓ ${c.name}: ${text}`);
    }
  } catch (err) {
    console.warn(`✗ ${c.name}: ${err.message} (keeping the template report)`);
  }

  fs.writeFileSync(file, JSON.stringify(creators, null, 2));
  await sleep(4000); // stay under the free rate limit
}

console.log('Done.');
