import { mkdir, copyFile } from 'node:fs/promises';
// Give the web app a real static entry so /app works without host rewrite rules.
await mkdir('dist/app', { recursive: true });
await copyFile('dist/index.html', 'dist/app/index.html');
