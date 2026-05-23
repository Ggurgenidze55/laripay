import fs from 'fs';
import path from 'path';

const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) process.exit(0);

/** `output: standalone` leaves this folder; dev then misses vendor-chunks like framer-motion. */
const productionArtifacts =
  fs.existsSync(path.join(nextDir, 'standalone')) ||
  fs.existsSync(path.join(nextDir, 'export-marker.json'));

if (productionArtifacts) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[laripay] Cleared stale production .next cache before dev.');
}
