import { mkdir, copyFile } from 'node:fs/promises';
// Give the web app a real static entry so /app works without host rewrite rules.
await mkdir('dist/app', { recursive: true });
await copyFile('dist/index.html', 'dist/app/index.html');
// Publish the standalone, self-contained architecture diagram alongside the app.
await mkdir('dist/architecture', { recursive: true });
await copyFile('docs/architecture.html', 'dist/architecture/index.html');
