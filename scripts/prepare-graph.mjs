import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const START = '2026-01-01';
export function range(end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || end < START) throw new Error('Invalid end date');
  const start = new Date(START + 'T00:00:00Z');
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return { start: start.toISOString(), end: end + 'T00:00:00Z', width: Math.floor((Date.parse(end) - start.getTime()) / 604800000) + 1 };
}

async function contributions(end) {
  const days = new Map();
  for (let year = 2026; year <= Number(end.slice(0, 4)); year++) {
    const from = year === 2026 ? START : `${year}-01-01`;
    const to = year === Number(end.slice(0, 4)) ? end : `${year}-12-31`;
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query($from: DateTime!, $to: DateTime!) { user(login: "LimHHSS") { contributionsCollection(from: $from, to: $to) { contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel color } } } } } }',
        variables: { from: from + 'T00:00:00Z', to: to + 'T23:59:59Z' }
      })
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const body = await response.json();
    if (body.errors) throw new Error(JSON.stringify(body.errors));
    const weeks = body.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (!Array.isArray(weeks)) throw new Error('Missing contribution calendar');
    for (const week of weeks) for (const day of week.contributionDays) {
      if (day.date >= START && day.date <= end) days.set(day.date, day);
    }
  }
  return [...days.values()];
}

export async function prepare(root, end, days) {
  const bounds = range(end);
  async function edit(path, before, after) {
    const file = resolve(root, path);
    const text = await readFile(file, 'utf8');
    if (!text.includes(before)) throw new Error(`Upstream changed: ${path}`);
    await writeFile(file, text.replace(before, after));
  }
  await edit('src/shared/constants.ts', 'export const GRID_WIDTH = 53;', `export const GRID_WIDTH = ${bounds.width};`);
  await edit('src/shared/utils/utils.ts', 'const endDate = truncateToUTCDate(new Date());', `const endDate = new Date('${bounds.end}');`);
  await edit('src/shared/utils/utils.ts', "const currentMonth = date.toLocaleString('default',", "if (week === 0) date.setUTCDate(date.getUTCDate() + 6);\n\t\tconst currentMonth = date.toLocaleString('en-US',");
  const filtered = days.filter(d => d.date >= START && d.date <= end);
  await writeFile(resolve(root, 'src/shared/providers/github-contributions.ts'), `import { BaseStore, Contribution, ContributionLevel } from '../types';
export const fetchGithubContributions = async (_store: BaseStore): Promise<Contribution[]> => {
  const days = ${JSON.stringify(filtered)};
  return days.map(d => ({ date: new Date(d.date), count: d.contributionCount, color: d.color, level: d.contributionLevel as ContributionLevel }));
};\n`);
  console.log(`Graph range: ${START} to ${end}, ${bounds.width} weeks`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  await prepare(process.argv[2] || 'arcade', end, await contributions(end));
}
