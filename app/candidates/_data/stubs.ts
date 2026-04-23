// Synthetic preview data — real data requires Play-Cricket API token (Phase 2, blocked).
// Fixtures and sponsors are NOT here — fixtures come from Supabase, sponsors from app/page.tsx array.

export type Batter = {
  name: string
  inns: number
  runs: number
  hs: number
  avg: number
}

export type Bowler = {
  name: string
  overs: number
  wkts: number
  best: string
  avg: number
}

export type TableRow = {
  pos: number
  team: string
  p: number
  w: number
  l: number
  pts: number
  self?: boolean
}

export type Tweet = {
  who: string
  when: string
  text: string
}

export const topBatters: Batter[] = [
  { name: 'Alex Bujtor',     inns: 5, runs: 241, hs: 78, avg: 48.2 },
  { name: 'Shea McCullough', inns: 5, runs: 198, hs: 64, avg: 39.6 },
  { name: 'Hugh Morris',     inns: 4, runs: 142, hs: 55, avg: 35.5 },
  { name: 'Dan Palmer',      inns: 5, runs: 124, hs: 41, avg: 24.8 },
  { name: 'Will Jefferies',  inns: 4, runs: 88,  hs: 34, avg: 22.0 },
]

export const topBowlers: Bowler[] = [
  { name: 'Martin Ridley', overs: 42, wkts: 14, best: '4/18', avg: 13.2 },
  { name: 'Tom Greenwood', overs: 36, wkts: 11, best: '3/22', avg: 15.8 },
  { name: 'Paul Smith',    overs: 38, wkts: 9,  best: '3/31', avg: 19.4 },
  { name: 'Rob Fenton',    overs: 28, wkts: 7,  best: '2/14', avg: 18.1 },
  { name: 'Ollie Brooks',  overs: 22, wkts: 5,  best: '2/19', avg: 20.6 },
]

export const table: TableRow[] = [
  { pos: 1,  team: 'Sevenoaks Vine 3rd XI', p: 5, w: 5, l: 0, pts: 55 },
  { pos: 2,  team: 'Plaxtol',               p: 5, w: 4, l: 1, pts: 44 },
  { pos: 3,  team: 'St Lawrence',           p: 5, w: 3, l: 2, pts: 38, self: true },
  { pos: 4,  team: 'Hildenborough',         p: 5, w: 3, l: 2, pts: 36 },
  { pos: 5,  team: 'Borough Green',         p: 5, w: 2, l: 3, pts: 28 },
  { pos: 6,  team: 'Otford 2nd XI',         p: 5, w: 2, l: 3, pts: 26 },
  { pos: 7,  team: 'Shoreham',              p: 5, w: 2, l: 3, pts: 24 },
  { pos: 8,  team: 'Kemsing',               p: 5, w: 1, l: 4, pts: 18 },
  { pos: 9,  team: 'Wrotham',               p: 5, w: 1, l: 4, pts: 16 },
  { pos: 10, team: 'Leigh',                 p: 5, w: 0, l: 5, pts: 9  },
]

export const tweets: Tweet[] = [
  { who: '@stlawrencecc', when: '2d', text: 'XI for Saturday vs Vine 3s is up — a couple of spots still flexible, DM if you can play.' },
  { who: '@stlawrencecc', when: '5d', text: 'Win vs Hildenborough. Martin 4-18, Shea 58, and a spilled catch on the long-on boundary we shall never speak of again.' },
  { who: '@stlawrencecc', when: '1w', text: 'Teas this Saturday: sausage rolls, two varieties of cake, and — owing to an administrative error — eleven Scotch eggs.' },
  { who: '@stlawrencecc', when: '2w', text: 'Square boundary looking sharp after the roller\'s long weekend. Thanks Roger.' },
]
