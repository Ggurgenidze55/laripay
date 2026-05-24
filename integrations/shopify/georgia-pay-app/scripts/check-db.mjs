#!/usr/bin/env node
/**
 * Quick Postgres connectivity check before local dev.
 * Warns when DATABASE_URL points at localhost:5433 but nothing is listening.
 */
import net from 'node:net';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    if (line.startsWith('DATABASE_URL=')) {
      return line.slice(13).replace(/^["']|["']$/g, '').trim();
    }
  }
  return undefined;
}

function probe(host, port, ms = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(ms);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

const urlRaw = loadDatabaseUrl();
if (!urlRaw) {
  console.warn('[laripay] DATABASE_URL not set — auth and dashboard APIs will fail until configured.');
  process.exit(0);
}

let host = 'localhost';
let port = 5432;
try {
  const u = new URL(urlRaw);
  host = u.hostname;
  port = Number(u.port || 5432);
} catch {
  console.warn('[laripay] DATABASE_URL is invalid.');
  process.exit(0);
}

if (host === 'localhost' || host === '127.0.0.1') {
  const ok = await probe(host, port);
  if (ok) {
    console.log(`[laripay] Postgres reachable at ${host}:${port}`);
  } else {
    console.warn(
      `[laripay] Postgres not running at ${host}:${port}.\n` +
        '  Start: docker compose -f deploy/docker-compose.yml up -d postgres\n' +
        '  Or set DATABASE_URL to Railway DATABASE_PUBLIC_URL in .env',
    );
  }
} else {
  console.log(`[laripay] DATABASE_URL host: ${host} (remote — skipping local probe)`);
}
