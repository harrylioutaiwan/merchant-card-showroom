import { cp, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await Promise.all(
  ['index.html', 'sample.html', 'showroom.css', 'card.css', 'assets'].map((name) =>
    cp(new URL(`../${name}`, import.meta.url), new URL(name, dist), { recursive: true }),
  ),
);
