import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Alle bestanden in public/ (relatieve paden), voor de offline-cache. */
function listPublicFiles(dir: string, base = dir): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...listPublicFiles(full, base));
    else files.push(relative(base, full).split('\\').join('/'));
  }
  return files;
}

/**
 * Genereert sw.js bij de build met de exacte lijst gebouwde bestanden (inclusief hashes)
 * en een cachenaam die per build verandert. Geen extra dependency nodig.
 */
function serviceWorker(): Plugin {
  return {
    name: 'lumi2d-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = ['./', 'index.html', ...Object.keys(bundle), ...listPublicFiles('public')]
        .filter((f) => !f.endsWith('.map'))
        .filter((f, i, all) => all.indexOf(f) === i)
        .sort();
      const hash = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
      const source = readFileSync('sw-template.js', 'utf8')
        .replace('__CACHE_NAME__', `lumi2d-${hash}`)
        .replace('__PRECACHE__', JSON.stringify(files, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
  },
  plugins: [serviceWorker()],
});
