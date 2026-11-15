// Runs the YouTube fetch now, then again every few minutes, until you press Ctrl+C.
// Run: npm run fetch:auto            (every 15 minutes)
//      AUTO_FETCH_MINUTES=5 npm run fetch:auto
import { spawn } from 'child_process';

const minutes = Number(process.env.AUTO_FETCH_MINUTES) || 15;

function runFetch() {
  console.log(`\n[${new Date().toLocaleTimeString()}] Fetching from YouTube...`);
  const child = spawn(process.execPath, ['--env-file=.env.local', 'scripts/fetch-creators.mjs'], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    if (code !== 0) console.log(`Fetch failed (exit ${code}). Trying again next round.`);
    console.log(`Next fetch in ${minutes} minutes. Press Ctrl+C to stop.`);
  });
}

runFetch();
setInterval(runFetch, minutes * 60 * 1000);
