import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const ALLOWED: Record<string, string> = {
  'georgia-pay': 'georgia-pay',
  'georgia-delivery': 'georgia-delivery',
  'georgia-warehouse': 'georgia-warehouse',
};

export function resolveWordPressPluginDir(pluginId: string): string | null {
  const folder = ALLOWED[pluginId];
  if (!folder) return null;
  const root = path.resolve(process.cwd(), '../../wordpress', folder);
  if (!existsSync(root)) return null;
  return root;
}

/** Zip plugin folder to stdout buffer via system `zip`. */
export function zipWordPressPlugin(pluginId: string): Promise<Buffer> {
  const dir = resolveWordPressPluginDir(pluginId);
  if (!dir) return Promise.reject(new Error('Plugin not found'));

  const folder = ALLOWED[pluginId]!;
  const parent = path.dirname(dir);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const proc = spawn('zip', ['-r', '-q', '-', folder], { cwd: parent, stdio: ['ignore', 'pipe', 'pipe'] });
    proc.stdout.on('data', (c: Buffer) => chunks.push(c));
    proc.stderr.on('data', (c: Buffer) => chunks.push(c));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`zip failed (${code})`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}
