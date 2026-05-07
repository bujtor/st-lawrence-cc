import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
for (const raw of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const eq = line.indexOf('=')
  if (eq < 0) continue
  const key = line.slice(0, eq).trim()
  let val = line.slice(eq + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim()
  process.env[key] = val
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const SEASON = 2025
const banner = (s) => console.log('\n' + '═'.repeat(72) + '\n' + s + '\n' + '═'.repeat(72))

// ── 1. Match list & W/L from fixtures vs scorecards ─────────────────
banner(`1. ${SEASON} match-by-match (fixtures table)`)
const { data: fx } = await sb.from('fixtures')
  .select('id, match_date, opponent, home_away, result_text, play_cricket_match_id')
  .eq('season', SEASON).order('match_date')

const tally = { Won: 0, Lost: 0, Drew: 0, Tied: 0, Abandoned: 0, Cancelled: 0, Conceded: 0, Unknown: 0 }
for (const f of fx) {
  const r = f.result_text ?? 'Unknown'
  if (r === 'Won') tally.Won++
  else if (r === 'Lost') tally.Lost++
  else if (r === 'Drew') tally.Drew++
  else if (r === 'Tied') tally.Tied++
  else if (r === 'Abandoned') tally.Abandoned++
  else if (r === 'Cancelled') tally.Cancelled++
  else if (r.includes('Conceded')) tally.Conceded++
  else tally.Unknown++
  console.log(`  ${f.match_date} ${f.home_away}  vs ${(f.opponent ?? '?').padEnd(28)}  ${(r ?? '—').padEnd(20)}  pc=${f.play_cricket_match_id ?? '—'}`)
}
console.log(`  Tally: ${JSON.stringify(tally)}`)
console.log(`  Total fixtures: ${fx.length}`)

// ── 2. Match scorecards: our_runs / opp_runs / result_text per match ────
banner(`2. ${SEASON} scorecards (match_scorecards table)`)
const { data: scs } = await sb.from('match_scorecards')
  .select('match_id, our_team_id, our_runs, our_wickets, our_overs, opp_runs, opp_wickets, opp_overs, result_text, toss_won_by_team_id, home_team_id, away_team_id')
  .eq('season', SEASON).order('match_id')
for (const s of scs) {
  const fxRow = fx.find((f) => f.play_cricket_match_id === s.match_id)
  const isHome = s.our_team_id === s.home_team_id
  const tossUs = s.toss_won_by_team_id === s.our_team_id
  console.log(`  pc=${s.match_id}  ${fxRow?.match_date ?? '?'}  vs ${fxRow?.opponent ?? '?'}  SLCC ${s.our_runs}/${s.our_wickets} (${s.our_overs} ov)  vs  opp ${s.opp_runs}/${s.opp_wickets} (${s.opp_overs} ov)  ${(s.result_text ?? '—').padEnd(8)}  ${isHome ? 'HOME' : 'AWAY'}  toss=${tossUs ? 'us' : 'them'}`)
}

const scTally = scs.reduce((a, s) => { a[s.result_text ?? '?'] = (a[s.result_text ?? '?'] ?? 0) + 1; return a }, {})
let runsFor = 0, runsAgainst = 0, homeW = 0, homeL = 0, awayW = 0, awayL = 0, tossWon = 0, wonAfterToss = 0
for (const s of scs) {
  runsFor += s.our_runs ?? 0
  runsAgainst += s.opp_runs ?? 0
  const isHome = s.our_team_id === s.home_team_id
  if (s.result_text === 'Won') { isHome ? homeW++ : awayW++ }
  if (s.result_text === 'Lost') { isHome ? homeL++ : awayL++ }
  if (s.toss_won_by_team_id === s.our_team_id) { tossWon++; if (s.result_text === 'Won') wonAfterToss++ }
}
console.log(`  Scorecard tally: ${JSON.stringify(scTally)}`)
console.log(`  Runs For: ${runsFor}   Runs Against: ${runsAgainst}   Avg score: ${(runsFor / scs.length).toFixed(1)}`)
console.log(`  Home W-L: ${homeW}-${homeL}    Away W-L: ${awayW}-${awayL}`)
console.log(`  Toss won by us: ${tossWon}/${scs.length} = ${Math.round(100 * tossWon / scs.length)}%   Won after winning toss: ${wonAfterToss}/${tossWon} = ${tossWon > 0 ? Math.round(100 * wonAfterToss / tossWon) : 0}%`)

// ── 3. Top batters 2025 with key numbers ────────────────────────────
banner(`3. ${SEASON} top 5 batters (sourced from batting_entries)`)
const { data: bat } = await sb.from('batting_entries')
  .select('batsman_name, batsman_id, runs, balls, how_out, match_id')
  .eq('is_our_batsman', true).eq('season', SEASON).limit(20000)
const batters = new Map()
for (const r of bat) {
  const key = String(r.batsman_id ?? r.batsman_name)
  if (!batters.has(key)) batters.set(key, { name: r.batsman_name, matches: new Set(), inns: 0, no: 0, runs: 0, balls: 0, hs: 0, fifties: 0, hundreds: 0 })
  const b = batters.get(key)
  const ho = (r.how_out ?? '').toLowerCase().trim()
  if (ho === 'did not bat' || ho === 'dnb' || ho === '') {
    // skip from innings count (matches our app logic)
    continue
  }
  b.matches.add(r.match_id)
  b.inns++
  if (ho === 'not out') b.no++
  b.runs += r.runs ?? 0
  b.balls += r.balls ?? 0
  if ((r.runs ?? 0) > b.hs) b.hs = r.runs ?? 0
  if ((r.runs ?? 0) >= 50 && (r.runs ?? 0) < 100) b.fifties++
  if ((r.runs ?? 0) >= 100) b.hundreds++
}
const topBat = [...batters.values()].sort((a, b) => b.runs - a.runs).slice(0, 5)
for (const b of topBat) {
  const dismissals = b.inns - b.no
  const avg = dismissals > 0 ? (b.runs / dismissals).toFixed(1) : '−'
  const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '−'
  console.log(`  ${b.name.padEnd(22)}  M=${b.matches.size}  Inn=${b.inns}  NO=${b.no}  Runs=${b.runs}  HS=${b.hs}  Avg=${avg}  SR=${sr}  50/100=${b.fifties}/${b.hundreds}`)
}
const totalBatRuns = [...batters.values()].reduce((s, b) => s + b.runs, 0)
const totalBatInns = [...batters.values()].reduce((s, b) => s + b.inns, 0)
console.log(`  ALL BATTERS: ${batters.size} players, total runs ${totalBatRuns}, total innings ${totalBatInns}`)
console.log(`  Sanity: site shows Runs For ${runsFor}; sum of batters' runs ${totalBatRuns}; difference (= extras + run-outs/wides etc): ${runsFor - totalBatRuns}`)

// ── 4. Top bowlers 2025 ────────────────────────────────────────────
banner(`4. ${SEASON} top 5 bowlers (sourced from bowling_entries)`)
const { data: bowl } = await sb.from('bowling_entries')
  .select('bowler_name, bowler_id, overs, runs, wickets, maidens, match_id, innings_number')
  .eq('is_our_bowler', true).eq('season', SEASON).limit(20000)
const bowlers = new Map()
for (const r of bowl) {
  const key = String(r.bowler_id ?? r.bowler_name)
  if (!bowlers.has(key)) bowlers.set(key, { name: r.bowler_name, matches: new Set(), overs: 0, runs: 0, wickets: 0, maidens: 0, bestWkts: 0, bestRuns: 999 })
  const b = bowlers.get(key)
  b.matches.add(r.match_id)
  b.overs += r.overs ?? 0
  b.runs += r.runs ?? 0
  b.wickets += r.wickets ?? 0
  b.maidens += r.maidens ?? 0
  const w = r.wickets ?? 0, ru = r.runs ?? 0
  if (w > b.bestWkts || (w === b.bestWkts && ru < b.bestRuns)) {
    b.bestWkts = w; b.bestRuns = ru
  }
}
const topBowl = [...bowlers.values()].filter((b) => b.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 5)
for (const b of topBowl) {
  const avg = b.wickets > 0 ? (b.runs / b.wickets).toFixed(1) : '−'
  const econ = b.overs > 0 ? (b.runs / b.overs).toFixed(2) : '−'
  console.log(`  ${b.name.padEnd(22)}  M=${b.matches.size}  O=${b.overs.toFixed(1)}  R=${b.runs}  W=${b.wickets}  Avg=${avg}  Econ=${econ}  Best=${b.bestWkts}/${b.bestRuns === 999 ? '−' : b.bestRuns}`)
}
const totalWkts = [...bowlers.values()].reduce((s, b) => s + b.wickets, 0)
console.log(`  ALL BOWLERS: ${bowlers.size} players took total of ${totalWkts} wickets`)

// ── 5. Top fielders 2025 ───────────────────────────────────────────
banner(`5. ${SEASON} top 5 fielders (caught/runOut/stumping in batting_entries)`)
const { data: fld } = await sb.from('batting_entries')
  .select('fielder_name, fielder_id, how_out')
  .eq('is_our_fielder', true).not('fielder_id', 'is', null).eq('season', SEASON).limit(20000)
const fielders = new Map()
for (const r of fld) {
  const key = String(r.fielder_id ?? r.fielder_name)
  if (!fielders.has(key)) fielders.set(key, { name: r.fielder_name, ct: 0, ro: 0, st: 0 })
  const f = fielders.get(key)
  const ho = (r.how_out ?? '').toLowerCase()
  if (ho.startsWith('ct')) f.ct++
  else if (ho.startsWith('run out')) f.ro++
  else if (ho.startsWith('st')) f.st++
}
const topFld = [...fielders.values()].map((f) => ({ ...f, total: f.ct + f.ro + f.st })).filter((f) => f.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)
for (const f of topFld) {
  console.log(`  ${f.name.padEnd(22)}  Ct=${f.ct}  RO=${f.ro}  St=${f.st}  Total=${f.total}`)
}

// ── 6. Cross-check: site's home page hero stats ────────────────────
banner(`6. Home page hero numbers vs raw data`)
console.log(`  W-L 2025 from site = "7-8" (per screenshot you sent earlier)`)
console.log(`  W-L 2025 from data = ${tally.Won}-${tally.Lost}`)
console.log(`  Match if same? ${tally.Won === 7 && tally.Lost === 8 ? '✓' : '✗  MISMATCH'}`)

// ── 7. League table position for 2025 ──────────────────────────────
banner(`7. League table position 2025 (league_standings table)`)
const { data: ls } = await sb.from('league_standings')
  .select('team_name, club_name, position, played, won, lost, tied, drew, abandoned, cancelled, points, club_id')
  .eq('season', SEASON).order('position')
for (const r of ls ?? []) {
  const us = r.club_id === '9754'
  console.log(`  ${us ? '★' : ' '}  pos=${String(r.position).padStart(2)}  ${(r.club_name ?? r.team_name).padEnd(30)}  P=${r.played}  W=${r.won}  L=${r.lost}  T=${r.tied}  D=${r.drew}  A=${r.abandoned}  C=${r.cancelled}  Pts=${r.points}`)
}

console.log('\nDone.')
