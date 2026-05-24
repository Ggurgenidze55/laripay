import fs from 'fs';
import path from 'path';

const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) process.exit(0);

/** Production `next build` artifacts; dev then 500s with missing chunk modules (e.g. ./8948.js). */
const cacheDir = path.join(nextDir, 'cache', 'webpack');
const productionArtifacts =
  fs.existsSync(path.join(nextDir, 'standalone')) ||
  fs.existsSync(path.join(nextDir, 'export-marker.json')) ||
  fs.existsSync(path.join(cacheDir, 'server-production')) ||
  fs.existsSync(path.join(cacheDir, 'client-production'));

if (productionArtifacts) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[laripay] Cleared stale production .next cache before dev.');
}
