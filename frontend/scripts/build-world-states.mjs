import fs from 'fs';
import path from 'path';
import os from 'os';

const source = path.join(os.tmpdir(), 'states.json');
const rows = JSON.parse(fs.readFileSync(source, 'utf8'))
  .map((row) => ({ name: String(row.name || '').trim(), country: String(row.country_name || '').trim() }))
  .filter((row) => row.name && row.country)
  .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

const countries = [...new Set(rows.map((row) => row.country))].sort((a, b) => a.localeCompare(b));
const lines = rows.map((row) => `  ${JSON.stringify(`${row.name}|${row.country}`)}`);

const out = `export const WORLD_STATE_ROWS = [
${lines.join(',\n')}
] as const;

export type WorldStateOption = { value: string; label: string; country: string };

export const WORLD_STATES: WorldStateOption[] = WORLD_STATE_ROWS.map((row) => {
  const sep = row.lastIndexOf('|');
  const name = row.slice(0, sep);
  const country = row.slice(sep + 1);
  const label = name + ', ' + country;
  return { value: label, label, country };
});

export const WORLD_COUNTRIES = ${JSON.stringify(countries)} as const;
`;

const dest = path.resolve('src/data/worldStates.ts');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log(`wrote ${rows.length} states, ${countries.length} countries, ${out.length} bytes`);
