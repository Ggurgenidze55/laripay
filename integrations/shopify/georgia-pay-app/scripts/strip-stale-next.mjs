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

const CHUNK_RE = /(?:require|import)\(['"]\.\/(\d+\.js)['"]\)/g;

function hasMissingServerChunks() {
  const serverDir = path.join(nextDir, 'server');
  if (!fs.existsSync(serverDir)) return false;

  const queue = [serverDir];
  while (queue.length) {
    const dir = queue.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
        continue;
      }
      if (!entry.name.endsWith('.js')) continue;

      const source = fs.readFileSync(full, 'utf8');
      for (const match of source.matchAll(CHUNK_RE)) {
        if (!fs.existsSync(path.join(dir, match[1]))) return true;
      }
    }
  }
  return false;
}

const brokenDevCache = hasMissingServerChunks();

if (productionArtifacts || brokenDevCache) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  const reason = productionArtifacts
    ? 'stale production .next cache'
    : 'corrupt dev chunk cache';
  console.log(`[laripay] Cleared ${reason} before dev.`);
}
