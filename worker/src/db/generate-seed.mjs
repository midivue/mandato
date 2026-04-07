#!/usr/bin/env node
import { randomBytes } from 'crypto';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config — bump RECORD_COUNT for larger datasets
// ---------------------------------------------------------------------------

const RECORD_COUNT = 10_000;
const GROUP_RATIO = 0.015;          // ~1 group per 67 predictions
const SEED = 42;
const OUTPUT_FILE = join(__dirname, 'seed-large.sql');

const PARTY_IDS = ['mkkp', 'tisza', 'mi_hazank', 'dk', 'fidesz_kdnp'];

const REFERENCE = {
  listWinnerId: 'tisza',
  pmWinnerId: 'tisza',
  pct: { mkkp: 2.8, tisza: 44.6, mi_hazank: 6.9, dk: 4.3, fidesz_kdnp: 35.2, nationalities: 0.44 },
};

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) for reproducibility
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);

function normalRandom(mean, stddev) {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round1(v) { return Math.round(v * 10) / 10; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

function weightedPick(obj) {
  const r = rand();
  let cum = 0;
  for (const [k, w] of Object.entries(obj)) { cum += w; if (r < cum) return k; }
  return Object.keys(obj).at(-1);
}

function hexToken(bytes = 16) { return randomBytes(bytes).toString('hex'); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Prediction profiles — control the distribution shape
// ---------------------------------------------------------------------------

const PROFILES = [
  {
    name: 'mainstream_tisza',
    weight: 0.45,
    pct: { tisza: [54, 3], fidesz_kdnp: [36, 3], mi_hazank: [4.5, 1.5], dk: [1.8, 1], mkkp: [1.8, 1], nationalities: [3.5, 1.5] },
    listWinner: { tisza: 0.95, fidesz_kdnp: 0.05 },
    pmWinner: { tisza: 0.92, fidesz_kdnp: 0.06, mi_hazank: 0.02 },
  },
  {
    name: 'moderate_fidesz',
    weight: 0.18,
    pct: { tisza: [43, 3], fidesz_kdnp: [42, 3], mi_hazank: [5, 1.5], dk: [2.5, 1], mkkp: [2, 1], nationalities: [4, 1.5] },
    listWinner: { fidesz_kdnp: 0.60, tisza: 0.40 },
    pmWinner: { fidesz_kdnp: 0.55, tisza: 0.45 },
  },
  {
    name: 'close_race',
    weight: 0.13,
    pct: { tisza: [47, 2], fidesz_kdnp: [39, 2], mi_hazank: [5, 1], dk: [2.5, 0.8], mkkp: [2, 0.8], nationalities: [3.5, 1] },
    listWinner: { tisza: 0.70, fidesz_kdnp: 0.30 },
    pmWinner: { tisza: 0.65, fidesz_kdnp: 0.35 },
  },
  {
    name: 'tisza_landslide',
    weight: 0.05,
    pct: { tisza: [59, 3], fidesz_kdnp: [27, 3], mi_hazank: [4, 1.5], dk: [3, 1], mkkp: [3, 1.5], nationalities: [3, 1] },
    listWinner: { tisza: 1.0 },
    pmWinner: { tisza: 1.0 },
  },
  {
    name: 'fidesz_majority',
    weight: 0.06,
    pct: { tisza: [34, 3], fidesz_kdnp: [49, 3], mi_hazank: [6, 2], dk: [3, 1], mkkp: [2, 1], nationalities: [4, 1.5] },
    listWinner: { fidesz_kdnp: 1.0 },
    pmWinner: { fidesz_kdnp: 1.0 },
  },
  {
    name: 'mi_hazank_fan',
    weight: 0.03,
    pct: { tisza: [42, 4], fidesz_kdnp: [32, 4], mi_hazank: [14, 3], dk: [3, 1], mkkp: [3, 1.5], nationalities: [4, 1.5] },
    listWinner: { tisza: 0.50, fidesz_kdnp: 0.30, mi_hazank: 0.20 },
    pmWinner: { tisza: 0.45, fidesz_kdnp: 0.30, mi_hazank: 0.25 },
  },
  {
    name: 'dk_optimist',
    weight: 0.02,
    pct: { tisza: [40, 4], fidesz_kdnp: [33, 4], mi_hazank: [5, 1.5], dk: [12, 3], mkkp: [3, 1.5], nationalities: [4, 1.5] },
    listWinner: { tisza: 0.55, fidesz_kdnp: 0.25, dk: 0.20 },
    pmWinner: { tisza: 0.50, fidesz_kdnp: 0.20, dk: 0.30 },
  },
  {
    name: 'mkkp_fan',
    weight: 0.02,
    pct: { tisza: [42, 4], fidesz_kdnp: [34, 4], mi_hazank: [5, 1.5], dk: [3, 1], mkkp: [10, 3], nationalities: [4, 1.5] },
    listWinner: { tisza: 0.55, fidesz_kdnp: 0.30, mkkp: 0.15 },
    pmWinner: { tisza: 0.55, fidesz_kdnp: 0.30, mkkp: 0.15 },
  },
  {
    name: 'wild_outlier',
    weight: 0.06,
    pct: { tisza: [40, 12], fidesz_kdnp: [35, 12], mi_hazank: [8, 5], dk: [5, 4], mkkp: [5, 4], nationalities: [5, 3] },
    listWinner: { tisza: 0.40, fidesz_kdnp: 0.35, mi_hazank: 0.10, dk: 0.08, mkkp: 0.07 },
    pmWinner: { tisza: 0.40, fidesz_kdnp: 0.35, mi_hazank: 0.10, dk: 0.08, mkkp: 0.07 },
  },
];

// ---------------------------------------------------------------------------
// Display name generation
// ---------------------------------------------------------------------------

const HU_FIRST_NAMES = [
  'Ádám', 'Ákos', 'Attila', 'Balázs', 'Bence', 'Csaba', 'Dániel', 'Dávid',
  'Dénes', 'Endre', 'Ferenc', 'Gábor', 'Gergő', 'Gyula', 'Hunor', 'Imre',
  'István', 'János', 'József', 'Kristóf', 'László', 'Levente', 'Márton',
  'Máté', 'Miklós', 'Norbert', 'Olivér', 'Péter', 'Richárd', 'Sándor',
  'Tamás', 'Viktor', 'Zoltán', 'Zsolt', 'Anna', 'Boglárka', 'Csilla',
  'Dóra', 'Éva', 'Flóra', 'Gabriella', 'Hajnalka', 'Ildikó', 'Judit',
  'Katalin', 'Lilla', 'Noémi', 'Orsolya', 'Petra', 'Réka', 'Sára',
  'Tímea', 'Veronika', 'Zsófia', 'Bálint', 'Benedek', 'Dominik', 'Milán',
  'Patrik', 'Roland', 'Szabolcs', 'Vivien', 'Hanna', 'Kinga', 'Bianka',
];

const HU_LAST_NAMES = [
  'Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár',
  'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos',
  'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete', 'Szilágyi', 'Török',
  'Vincze', 'Hegedűs', 'Pintér', 'Szűcs', 'Budai', 'Hajdu', 'Lukács',
  'Gulyás', 'Bíró', 'Katona', 'Király', 'Balog', 'Kocsis', 'Orbán',
  'Nemes', 'Fülöp', 'Antal', 'Illés',
];

const CREATIVE_HANDLES = [
  'TippMester', 'VoksGuru', 'MagyarTipp', 'Szavazogep', 'PestiBull',
  'BudaiBéka', 'VoteHunter', 'JokerVoks', 'PolitiGuru', 'BallotBoss',
  'TiszaFan', 'Mandatum', 'VoxPopuli', 'Választó', 'HunVoter',
  'TippKirály', 'SzavazóGép', 'ParlamentPro', 'Taktikus', 'ElectionNerd',
  'KutacsKing', 'Prognózis', 'VéleményVezér', 'Forecaster', 'OszlopGraf',
  'KékHullám', 'NarancsLáz', 'KutyaPárt', 'DemKoal', 'HazánkFija',
  'BudapestBet', 'SzavazóLap', 'TippAdó', 'PredictorHU', 'Pollster42',
  'Elemző', 'DataNerd', 'Tippelek', 'GrafGuru', 'SzavazóHős',
  'MandátumMágus', 'PolitikaFan', 'VoksVadász', 'Tippelő', 'UrnaHős',
];

function generateDisplayName() {
  const r = rand();
  if (r < 0.28) {
    return `Anonymous${String(1000 + Math.floor(rand() * 8999)).padStart(4, '0')}`;
  }
  if (r < 0.52) {
    const first = pick(HU_FIRST_NAMES);
    const suffix = rand() < 0.5 ? String(Math.floor(rand() * 99) + 1) : '';
    const sep = rand() < 0.5 ? '_' : '';
    return `${first}${sep}${suffix}`.replace(/^(.{1,20}).*$/, '$1');
  }
  if (r < 0.78) {
    const last = pick(HU_LAST_NAMES);
    const first = pick(HU_FIRST_NAMES);
    const style = rand();
    if (style < 0.25) return `${last}_${first.charAt(0)}`;
    if (style < 0.50) return `${first}${last.charAt(0)}${Math.floor(rand() * 99)}`;
    if (style < 0.75) return `${last}${Math.floor(rand() * 999)}`;
    return `${first}.${last}`;
  }
  const handle = pick(CREATIVE_HANDLES);
  const num = rand() < 0.4 ? String(Math.floor(rand() * 99) + 1) : '';
  return `${handle}${num}`;
}

// ---------------------------------------------------------------------------
// Location data — all 20 Hungarian counties plus comprehensive abroad
// ---------------------------------------------------------------------------

const COUNTY_SETTLEMENTS = {
  'Budapest':           { weight: 0.30, zips: ['1011','1024','1032','1044','1052','1061','1073','1082','1094','1111','1117','1125','1134','1143','1152','1163','1173','1181','1191','1201','1211','1221','1239'] },
  'Pest':               { weight: 0.12, cities: [
    { name: 'Érd', zips: ['2030'] }, { name: 'Dunakeszi', zips: ['2120'] }, { name: 'Gödöllő', zips: ['2100'] },
    { name: 'Szentendre', zips: ['2000'] }, { name: 'Vác', zips: ['2600'] }, { name: 'Budaörs', zips: ['2040'] },
    { name: 'Szigetszentmiklós', zips: ['2310'] }, { name: 'Cegléd', zips: ['2700'] },
    { name: 'Monor', zips: ['2200'] }, { name: 'Dabas', zips: ['2370'] },
  ]},
  'Baranya':            { weight: 0.03, cities: [{ name: 'Pécs', zips: ['7621','7622','7624','7626'] }, { name: 'Mohács', zips: ['7700'] }, { name: 'Komló', zips: ['7300'] }]},
  'Bács-Kiskun':        { weight: 0.04, cities: [{ name: 'Kecskemét', zips: ['6000'] }, { name: 'Baja', zips: ['6500'] }, { name: 'Kiskunfélegyháza', zips: ['6100'] }, { name: 'Kiskunhalas', zips: ['6400'] }]},
  'Békés':              { weight: 0.02, cities: [{ name: 'Békéscsaba', zips: ['5600'] }, { name: 'Gyula', zips: ['5700'] }, { name: 'Orosháza', zips: ['5900'] }]},
  'Borsod-Abaúj-Zemplén': { weight: 0.05, cities: [{ name: 'Miskolc', zips: ['3525','3527','3529','3530'] }, { name: 'Eger', zips: ['3300'] }, { name: 'Sárospatak', zips: ['3950'] }, { name: 'Ózd', zips: ['3600'] }, { name: 'Kazincbarcika', zips: ['3700'] }]},
  'Csongrád-Csanád':    { weight: 0.03, cities: [{ name: 'Szeged', zips: ['6720','6722','6724','6726'] }, { name: 'Hódmezővásárhely', zips: ['6800'] }, { name: 'Makó', zips: ['6900'] }]},
  'Fejér':              { weight: 0.03, cities: [{ name: 'Székesfehérvár', zips: ['8000'] }, { name: 'Dunaújváros', zips: ['2400'] }]},
  'Győr-Moson-Sopron':  { weight: 0.04, cities: [{ name: 'Győr', zips: ['9021','9023','9024','9025'] }, { name: 'Sopron', zips: ['9400'] }, { name: 'Mosonmagyaróvár', zips: ['9200'] }]},
  'Hajdú-Bihar':        { weight: 0.04, cities: [{ name: 'Debrecen', zips: ['4024','4025','4026','4032'] }, { name: 'Hajdúböszörmény', zips: ['4220'] }, { name: 'Hajdúszoboszló', zips: ['4200'] }]},
  'Heves':              { weight: 0.02, cities: [{ name: 'Eger', zips: ['3300'] }, { name: 'Gyöngyös', zips: ['3200'] }, { name: 'Hatvan', zips: ['3000'] }]},
  'Jász-Nagykun-Szolnok': { weight: 0.03, cities: [{ name: 'Szolnok', zips: ['5000'] }, { name: 'Jászberény', zips: ['5100'] }, { name: 'Törökszentmiklós', zips: ['5200'] }]},
  'Komárom-Esztergom':  { weight: 0.02, cities: [{ name: 'Tatabánya', zips: ['2800'] }, { name: 'Komárom', zips: ['2900'] }, { name: 'Esztergom', zips: ['2500'] }]},
  'Nógrád':             { weight: 0.01, cities: [{ name: 'Salgótarján', zips: ['3100'] }, { name: 'Balassagyarmat', zips: ['2660'] }]},
  'Somogy':             { weight: 0.02, cities: [{ name: 'Kaposvár', zips: ['7400'] }, { name: 'Siófok', zips: ['8600'] }]},
  'Szabolcs-Szatmár-Bereg': { weight: 0.04, cities: [{ name: 'Nyíregyháza', zips: ['4400','4431'] }, { name: 'Kisvárda', zips: ['4600'] }, { name: 'Mátészalka', zips: ['4700'] }]},
  'Tolna':              { weight: 0.01, cities: [{ name: 'Szekszárd', zips: ['7100'] }, { name: 'Paks', zips: ['7030'] }]},
  'Vas':                { weight: 0.02, cities: [{ name: 'Szombathely', zips: ['9700'] }, { name: 'Körmend', zips: ['9900'] }, { name: 'Sárvár', zips: ['9600'] }]},
  'Veszprém':           { weight: 0.02, cities: [{ name: 'Veszprém', zips: ['8200'] }, { name: 'Pápa', zips: ['8500'] }, { name: 'Ajka', zips: ['8400'] }]},
  'Zala':               { weight: 0.02, cities: [{ name: 'Zalaegerszeg', zips: ['8900'] }, { name: 'Nagykanizsa', zips: ['8800'] }]},
};

const ABROAD_COUNTRIES = [
  // Western & Central Europe
  { code: 'DE', name: 'Germany', weight: 0.18 },
  { code: 'GB', name: 'United Kingdom', weight: 0.12 },
  { code: 'AT', name: 'Austria', weight: 0.11 },
  { code: 'NL', name: 'Netherlands', weight: 0.06 },
  { code: 'IE', name: 'Ireland', weight: 0.05 },
  { code: 'CH', name: 'Switzerland', weight: 0.05 },
  { code: 'FR', name: 'France', weight: 0.03 },
  { code: 'BE', name: 'Belgium', weight: 0.02 },
  { code: 'LU', name: 'Luxembourg', weight: 0.01 },
  // Nordics
  { code: 'SE', name: 'Sweden', weight: 0.03 },
  { code: 'DK', name: 'Denmark', weight: 0.02 },
  { code: 'NO', name: 'Norway', weight: 0.02 },
  { code: 'FI', name: 'Finland', weight: 0.01 },
  { code: 'IS', name: 'Iceland', weight: 0.005 },
  // Southern Europe
  { code: 'IT', name: 'Italy', weight: 0.02 },
  { code: 'ES', name: 'Spain', weight: 0.02 },
  { code: 'PT', name: 'Portugal', weight: 0.01 },
  { code: 'GR', name: 'Greece', weight: 0.005 },
  // Neighbours & Eastern Europe
  { code: 'RO', name: 'Romania', weight: 0.04 },
  { code: 'SK', name: 'Slovakia', weight: 0.03 },
  { code: 'CZ', name: 'Czech Republic', weight: 0.02 },
  { code: 'PL', name: 'Poland', weight: 0.01 },
  { code: 'HR', name: 'Croatia', weight: 0.01 },
  { code: 'RS', name: 'Serbia', weight: 0.01 },
  { code: 'SI', name: 'Slovenia', weight: 0.005 },
  { code: 'UA', name: 'Ukraine', weight: 0.005 },
  // Americas
  { code: 'US', name: 'United States', weight: 0.06 },
  { code: 'CA', name: 'Canada', weight: 0.03 },
  { code: 'BR', name: 'Brazil', weight: 0.005 },
  { code: 'AR', name: 'Argentina', weight: 0.003 },
  { code: 'MX', name: 'Mexico', weight: 0.002 },
  // Asia-Pacific
  { code: 'AU', name: 'Australia', weight: 0.03 },
  { code: 'NZ', name: 'New Zealand', weight: 0.01 },
  { code: 'JP', name: 'Japan', weight: 0.005 },
  { code: 'SG', name: 'Singapore', weight: 0.005 },
  { code: 'KR', name: 'South Korea', weight: 0.003 },
  { code: 'CN', name: 'China', weight: 0.003 },
  { code: 'IN', name: 'India', weight: 0.002 },
  { code: 'TH', name: 'Thailand', weight: 0.002 },
  // Middle East & Africa
  { code: 'AE', name: 'United Arab Emirates', weight: 0.01 },
  { code: 'IL', name: 'Israel', weight: 0.005 },
  { code: 'ZA', name: 'South Africa', weight: 0.003 },
  { code: 'EG', name: 'Egypt', weight: 0.002 },
];

function pickAbroadCountry() {
  const r = rand();
  let cum = 0;
  for (const c of ABROAD_COUNTRIES) { cum += c.weight; if (r < cum) return c; }
  return ABROAD_COUNTRIES[0];
}

function pickCounty() {
  const entries = Object.entries(COUNTY_SETTLEMENTS);
  const r = rand();
  let cum = 0;
  for (const [county, data] of entries) { cum += data.weight; if (r < cum) return [county, data]; }
  return entries[0];
}

function generateLocation() {
  const r = rand();
  if (r < 0.10) {
    const c = pickAbroadCountry();
    return { country: 'abroad', settlement: c.name, zip: c.code };
  }
  if (r < 0.16) {
    return { country: 'hu', settlement: null, zip: null };
  }

  const [county, data] = pickCounty();

  if (county === 'Budapest') {
    return { country: 'hu', settlement: 'Budapest', zip: pick(data.zips) };
  }
  const city = pick(data.cities);
  return { country: 'hu', settlement: city.name, zip: pick(city.zips) };
}

// ---------------------------------------------------------------------------
// Temporal patterns — early adopters, steady growth, pre-election rush
// ---------------------------------------------------------------------------

function generateTimestamps(isFinal) {
  const start = new Date('2026-03-01T00:00:00Z').getTime();
  const end = new Date('2026-04-11T23:59:59Z').getTime();
  const range = end - start;

  // Non-uniform temporal distribution:
  // ~15% in first week (early adopters), ~35% mid-March, ~50% last 2 weeks (rush)
  const u = rand();
  let t;
  if (u < 0.15) {
    t = rand() * 0.17;       // days 0-7 out of 42
  } else if (u < 0.50) {
    t = 0.17 + rand() * 0.35; // days 7-22
  } else {
    t = 0.52 + rand() * 0.48; // days 22-42 (rush)
  }

  const createdMs = start + t * range;
  const created = new Date(createdMs);

  const updateLag = rand() * 7 * 24 * 60 * 60 * 1000;
  const updated = new Date(Math.min(createdMs + updateLag, end));

  const finalized = isFinal
    ? new Date(Math.min(updated.getTime() + rand() * 2 * 24 * 60 * 60 * 1000, end))
    : null;

  const fmt = (d) => d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  return { createdAt: fmt(created), updatedAt: fmt(updated), finalizedAt: finalized ? fmt(finalized) : null };
}

// ---------------------------------------------------------------------------
// Percentage generation
// ---------------------------------------------------------------------------

function generatePercentages(profile) {
  const p = profile.pct;
  const raw = {};
  for (const key of [...PARTY_IDS, 'nationalities']) {
    const [mean, std] = p[key];
    raw[key] = clamp(normalRandom(mean, std), 0.1, 90);
  }
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(raw)) raw[key] = raw[key] / sum * 100;
  for (const key of Object.keys(raw)) raw[key] = round1(raw[key]);

  const roundedSum = Object.values(raw).reduce((a, b) => round1(a + b), 0);
  raw.tisza = round1(raw.tisza + (100 - roundedSum));

  if (raw.nationalities < 0.1) {
    raw.tisza = round1(raw.tisza - (0.1 - raw.nationalities));
    raw.nationalities = 0.1;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Scoring (matches docs/SCORE.md)
// ---------------------------------------------------------------------------

const REFERENCE_PARTICIPATION = 68.0;

function computeScore(record) {
  let score = 0;
  if (record.listWinnerId === REFERENCE.listWinnerId) score += 5;
  if (record.pmWinnerId === REFERENCE.pmWinnerId) score += 10;

  // 5-party MAE: 70 pts
  let partyError = 0;
  let partyCount = 0;
  for (const f of PARTY_IDS) {
    partyError += Math.abs((record.pct[f] ?? REFERENCE.pct[f]) - REFERENCE.pct[f]);
    partyCount++;
  }
  const partyMae = partyCount > 0 ? partyError / partyCount : 30;
  score += Math.max(0, 70 * (1 - partyMae / 30));

  // Nationalities: 5 pts (tight 0.5pp cap)
  const natErr = Math.abs((record.pct?.nationalities ?? REFERENCE.pct.nationalities) - REFERENCE.pct.nationalities);
  score += Math.max(0, 5 * (1 - natErr / 0.5));

  // Attendance: 10 pts (20pp cap)
  const attErr = Math.abs((record.participationRate ?? REFERENCE_PARTICIPATION) - REFERENCE_PARTICIPATION);
  score += Math.max(0, 10 * (1 - attErr / 20));

  return round1(score);
}

// ---------------------------------------------------------------------------
// Profile picker
// ---------------------------------------------------------------------------

function pickProfile() {
  const r = rand();
  let cum = 0;
  for (const p of PROFILES) { cum += p.weight; if (r < cum) return p; }
  return PROFILES[0];
}

// ---------------------------------------------------------------------------
// Generate all prediction records
// ---------------------------------------------------------------------------

function generateRecords() {
  const records = [];
  const usedNames = new Set();

  for (let i = 0; i < RECORD_COUNT; i++) {
    const profile = pickProfile();
    const isDraft = rand() < 0.05;
    const isPrivate = rand() < 0.12;

    let name;
    do { name = generateDisplayName(); } while (usedNames.has(name));
    usedNames.add(name);

    let pct = null;
    let isPartialDraft = false;
    if (isDraft) {
      isPartialDraft = rand() < 0.5;
      if (!isPartialDraft) pct = generatePercentages(profile);
    } else {
      pct = generatePercentages(profile);
    }

    const listWinnerId = isDraft && isPartialDraft ? null : weightedPick(profile.listWinner);
    let pmWinnerId = null;
    if (!isDraft || !isPartialDraft) {
      pmWinnerId = weightedPick(profile.pmWinner);
      if (pct && pct[pmWinnerId] !== undefined && pct[pmWinnerId] < 5) {
        const sorted = Object.entries(pct).filter(([k]) => PARTY_IDS.includes(k)).sort((a, b) => b[1] - a[1]);
        pmWinnerId = sorted[0][0];
      }
    }

    const timestamps = generateTimestamps(!isDraft);
    const location = generateLocation();

    const participationRate = round1(clamp(normalRandom(69.5, 4), 45, 90));

    const record = {
      token: hexToken(16),
      shareToken: hexToken(16),
      displayName: name,
      visibility: isPrivate ? 'private' : 'public',
      status: isDraft ? 'draft' : 'finalized',
      listWinnerId,
      pct,
      pmWinnerId,
      participationRate,
      location,
      ...timestamps,
      score: null,
    };

    if (!isDraft && pct) record.score = computeScore(record);
    records.push(record);
  }
  return records;
}

// ---------------------------------------------------------------------------
// Group generation — realistic community simulation
// ---------------------------------------------------------------------------

const GROUP_NAMES = JSON.parse(readFileSync(join(__dirname, 'group-names.json'), 'utf-8'));

const GROUP_SIZE_DISTRIBUTION = [
  { min: 2, max: 3,  weight: 0.35 },  // small friend pairs
  { min: 4, max: 7,  weight: 0.30 },  // friend groups / office teams
  { min: 8, max: 15, weight: 0.20 },  // larger communities
  { min: 16, max: 30, weight: 0.15 }, // big groups
];

function pickGroupSize() {
  const r = rand();
  let cum = 0;
  for (const tier of GROUP_SIZE_DISTRIBUTION) {
    cum += tier.weight;
    if (r < cum) return tier.min + Math.floor(rand() * (tier.max - tier.min + 1));
  }
  return 3;
}

function generateGroups(records) {
  const groupCount = Math.max(10, Math.round(RECORD_COUNT * GROUP_RATIO));
  const finalized = records.filter((r) => r.status === 'finalized' && r.visibility === 'public');

  // Build an index by location for geo-clustered groups
  const bySettlement = new Map();
  for (const r of finalized) {
    const key = r.location.settlement ?? '__noLocation__';
    if (!bySettlement.has(key)) bySettlement.set(key, []);
    bySettlement.get(key).push(r);
  }
  const locationKeys = [...bySettlement.keys()].filter(
    (k) => k !== '__noLocation__' && bySettlement.get(k).length >= 3,
  );

  const groups = [];
  const namePool = shuffle(GROUP_NAMES);
  let nameIdx = 0;

  for (let i = 0; i < groupCount; i++) {
    const targetSize = pickGroupSize();

    // ~40% of groups are geo-clustered (workplace/school), rest are random (online friends)
    const isGeoClustered = rand() < 0.40 && locationKeys.length > 0;

    let pool;
    if (isGeoClustered) {
      const loc = pick(locationKeys);
      pool = bySettlement.get(loc);
      if (pool.length < 2) pool = finalized;
    } else {
      pool = finalized;
    }

    const shuffledPool = shuffle(pool);
    const members = [];
    for (const r of shuffledPool) {
      if (members.length >= targetSize) break;
      members.push(r.shareToken);
    }
    if (members.length < 2) continue;

    const baseName = namePool[nameIdx % namePool.length];
    nameIdx++;
    const suffix = String(Math.floor(10 + rand() * 90));
    const groupToken = hexToken(16);
    const isPrivate = rand() < 0.18;

    const start = new Date('2026-03-05T00:00:00Z').getTime();
    const end = new Date('2026-04-10T00:00:00Z').getTime();
    const createdMs = start + rand() * (end - start);
    const fmt = (d) => new Date(d).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

    groups.push({
      groupToken,
      name: `${baseName} ${suffix}`,
      visibility: isPrivate ? 'private' : 'public',
      members,
      createdAt: fmt(createdMs),
      updatedAt: fmt(createdMs),
    });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// SQL generation
// ---------------------------------------------------------------------------

function sqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function recordToSQL(r) {
  return `  (${[
    sqlValue(r.token), sqlValue(r.shareToken), sqlValue(r.displayName),
    sqlValue(r.visibility), sqlValue(r.status), sqlValue(r.listWinnerId),
    sqlValue(r.pct?.mkkp ?? null), sqlValue(r.pct?.tisza ?? null),
    sqlValue(r.pct?.mi_hazank ?? null), sqlValue(r.pct?.dk ?? null),
    sqlValue(r.pct?.fidesz_kdnp ?? null), sqlValue(r.pct?.nationalities ?? null),
    sqlValue(r.participationRate ?? null),
    sqlValue(r.pmWinnerId),
    sqlValue(r.location.country), sqlValue(r.location.settlement), sqlValue(r.location.zip),
    r.location.settlement ? '1' : '0',
    sqlValue(r.createdAt), sqlValue(r.updatedAt), sqlValue(r.finalizedAt),
    sqlValue(r.score),
  ].join(', ')})`;
}

function generateSQL(records, groups) {
  const columns = [
    'token', 'share_token', 'display_name', 'visibility', 'status',
    'list_winner_id', 'pct_mkkp', 'pct_tisza', 'pct_mi_hazank', 'pct_dk', 'pct_fidesz_kdnp', 'pct_nationalities',
    'participation_rate',
    'pm_winner_id',
    'location_country', 'location_settlement', 'location_zip', 'location_public',
    'created_at', 'updated_at', 'finalized_at',
    'score',
  ];

  const lines = [];
  lines.push(`-- Generated mock dataset for mandatoto (${records.length} predictions, ${groups.length} groups)`);
  lines.push(`-- Run: node worker/src/db/generate-seed.mjs to regenerate\n`);

  // Predictions in batches of 200
  const batchSize = 200;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    lines.push(`INSERT INTO predictions (${columns.join(', ')})\nVALUES\n${batch.map(recordToSQL).join(',\n')};`);
  }

  // Groups
  if (groups.length > 0) {
    lines.push('\n-- Groups');
    const groupRows = groups.map((g) =>
      `  (${sqlValue(g.groupToken)}, ${sqlValue(g.name)}, ${sqlValue(g.visibility)}, ${sqlValue(g.createdAt)}, ${sqlValue(g.updatedAt)})`
    );
    for (let i = 0; i < groupRows.length; i += batchSize) {
      const batch = groupRows.slice(i, i + batchSize);
      lines.push(`INSERT INTO groups (group_token, name, visibility, created_at, updated_at)\nVALUES\n${batch.join(',\n')};`);
    }

    lines.push('\n-- Group members');
    const memberRows = [];
    for (let gi = 0; gi < groups.length; gi++) {
      for (const shareToken of groups[gi].members) {
        memberRows.push(`  (${gi + 1}, ${sqlValue(shareToken)})`);
      }
    }
    for (let i = 0; i < memberRows.length; i += batchSize) {
      const batch = memberRows.slice(i, i + batchSize);
      lines.push(`INSERT INTO group_members (group_id, prediction_share_token)\nVALUES\n${batch.join(',\n')};`);
    }
  }

  return lines.join('\n\n');
}

// ---------------------------------------------------------------------------
// Stats summary
// ---------------------------------------------------------------------------

function printStats(records, groups) {
  const finalized = records.filter((r) => r.status === 'finalized');
  const drafts = records.filter((r) => r.status === 'draft');
  const pub = records.filter((r) => r.visibility === 'public');
  const priv = records.filter((r) => r.visibility === 'private');

  const withPct = finalized.filter((r) => r.pct);
  const medians = {};
  for (const key of [...PARTY_IDS, 'nationalities']) {
    const sorted = withPct.map((r) => r.pct[key]).sort((a, b) => a - b);
    medians[key] = sorted[Math.floor(sorted.length / 2)];
  }

  const listWinnerCounts = {};
  const pmWinnerCounts = {};
  for (const r of finalized) {
    listWinnerCounts[r.listWinnerId] = (listWinnerCounts[r.listWinnerId] || 0) + 1;
    pmWinnerCounts[r.pmWinnerId] = (pmWinnerCounts[r.pmWinnerId] || 0) + 1;
  }

  const scores = finalized.filter((r) => r.score != null).map((r) => r.score).sort((a, b) => a - b);
  const scoreMedian = scores[Math.floor(scores.length / 2)];
  const scoreMin = scores[0];
  const scoreMax = scores[scores.length - 1];
  const scoreMean = round1(scores.reduce((a, b) => a + b, 0) / scores.length);

  const abroad = records.filter((r) => r.location.country === 'abroad');
  const bp = records.filter((r) => r.location.settlement === 'Budapest');
  const abroadCountries = new Set(abroad.map((r) => r.location.zip));
  const huSettlements = new Set(records.filter((r) => r.location.settlement && r.location.country === 'hu').map((r) => r.location.settlement));

  console.log('\n=== Dataset Summary ===');
  console.log(`Total predictions: ${records.length}`);
  console.log(`  Finalized:       ${finalized.length} (${round1(finalized.length / records.length * 100)}%)`);
  console.log(`  Drafts:          ${drafts.length} (${round1(drafts.length / records.length * 100)}%)`);
  console.log(`  Public:          ${pub.length} (${round1(pub.length / records.length * 100)}%)`);
  console.log(`  Private:         ${priv.length} (${round1(priv.length / records.length * 100)}%)`);
  console.log(`  Budapest:        ${bp.length} (${round1(bp.length / records.length * 100)}%)`);
  console.log(`  HU settlements:  ${huSettlements.size} unique`);
  console.log(`  Abroad:          ${abroad.length} (${round1(abroad.length / records.length * 100)}%) across ${abroadCountries.size} countries`);
  console.log('');
  console.log('Percentage medians:');
  for (const [key, val] of Object.entries(medians)) console.log(`  ${key.padEnd(16)} ${val}%`);
  console.log('');
  console.log('List winner picks:');
  for (const [key, val] of Object.entries(listWinnerCounts).sort((a, b) => b[1] - a[1]))
    console.log(`  ${key.padEnd(16)} ${val} (${round1(val / finalized.length * 100)}%)`);
  console.log('');
  console.log('PM winner picks:');
  for (const [key, val] of Object.entries(pmWinnerCounts).sort((a, b) => b[1] - a[1]))
    console.log(`  ${key.padEnd(16)} ${val} (${round1(val / finalized.length * 100)}%)`);
  console.log('');
  console.log('Score distribution:');
  console.log(`  Min:    ${scoreMin}`);
  console.log(`  Max:    ${scoreMax}`);
  console.log(`  Median: ${scoreMedian}`);
  console.log(`  Mean:   ${scoreMean}`);
  const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  console.log('  Histogram:');
  for (let i = 0; i < buckets.length - 1; i++) {
    const lo = buckets[i], hi = buckets[i + 1];
    const count = scores.filter((s) => s >= lo && s < (i === buckets.length - 2 ? hi + 1 : hi)).length;
    const bar = '█'.repeat(Math.round(count / Math.max(1, Math.ceil(records.length / 2000))));
    console.log(`    ${String(lo).padStart(3)}-${String(hi).padStart(3)}: ${String(count).padStart(5)} ${bar}`);
  }

  // Group stats
  console.log('');
  console.log(`=== Groups Summary ===`);
  console.log(`Total groups:      ${groups.length}`);
  const publicGroups = groups.filter((g) => g.visibility === 'public');
  const privateGroups = groups.filter((g) => g.visibility === 'private');
  console.log(`  Public:          ${publicGroups.length}`);
  console.log(`  Private:         ${privateGroups.length}`);

  const sizes = groups.map((g) => g.members.length);
  sizes.sort((a, b) => a - b);
  const totalMembers = sizes.reduce((a, b) => a + b, 0);
  const uniqueMembers = new Set(groups.flatMap((g) => g.members)).size;
  console.log(`  Total members:   ${totalMembers}`);
  console.log(`  Unique members:  ${uniqueMembers} (${round1(uniqueMembers / finalized.length * 100)}% of finalized)`);
  console.log(`  Size range:      ${sizes[0]} - ${sizes[sizes.length - 1]}`);
  console.log(`  Size median:     ${sizes[Math.floor(sizes.length / 2)]}`);
  console.log(`  Size mean:       ${round1(totalMembers / groups.length)}`);

  const tierLabels = ['2-3', '4-7', '8-15', '16-30'];
  const tierBounds = [[2,3],[4,7],[8,15],[16,30]];
  console.log('  Size tiers:');
  for (let i = 0; i < tierBounds.length; i++) {
    const [lo, hi] = tierBounds[i];
    const count = sizes.filter((s) => s >= lo && s <= hi).length;
    console.log(`    ${tierLabels[i].padEnd(6)} ${count} groups`);
  }

  console.log(`\nOutput: ${OUTPUT_FILE}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`Generating ${RECORD_COUNT} predictions...`);
const records = generateRecords();
console.log(`Generating groups...`);
const groups = generateGroups(records);
console.log(`Writing SQL...`);
const sql = generateSQL(records, groups);
writeFileSync(OUTPUT_FILE, sql, 'utf-8');
printStats(records, groups);
