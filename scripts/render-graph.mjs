import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { ArcadeRenderer } = await import(pathToFileURL(resolve(process.argv[2] || 'arcade', 'dist/pacman-contribution-graph.min.js')));
await mkdir('dist', { recursive: true });
for (const theme of ['github', 'github-dark']) {
  let svg;
  const renderer = new ArcadeRenderer({
    game: 'bomberman', platform: 'github', username: 'LimHHSS', gameTheme: theme,
    svgCallback: result => { svg = result; }
  });
  await renderer.start();
  if (!svg?.startsWith('<svg')) throw new Error('No SVG generated');
  await writeFile(`dist/bomberman-contribution-graph${theme === 'github-dark' ? '-dark' : ''}.svg`, svg);
}
