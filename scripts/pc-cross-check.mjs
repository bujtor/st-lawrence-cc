import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

// Load .env.production (has the Play-Cricket creds)
for (const raw of fs.readFileSync('.env.production', 'utf8').split(/\r?\n/)) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const eq = line.indexOf('=')
  if (eq < 0) continue
  const key = line.slice(0, eq).trim()
  let val = line.slice(eq + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim()
  // Don't overwrite values already set in the actual shell env (the
  // `vercel env pull` for this project strips sensitive values like
  // PLAY_CRICKET_API_TOKEN to empty strings, so an inherited shell
  // value should win).
  if (!process.env[key] || process.env[key].length === 0) process.env[key] = val
}

const SEASON = 2025
const SITE_ID = process.env.PLAY_CRICKET_SITE_ID
const TOKEN = process.env.PLAY_CRICKET_API_TOKEN
const banner = (s) => console.log('\n' + '═'.repeat(72) + '\n' + s + '\n' + '═'.repeat(72))

// ── Pull from Play-Cricket API direct ─────────────────────────────────
banner(`Play-Cricket: result_summary.json site_id=${SITE_ID} season=${SEASON}`)
const rsUrl = `https://play-cricket.com/api/v2/result_summary.json?site_id=${SITE_ID}&season=${SEASON}&api_token=${TOKEN}`
const rs = await fetch(rsUrl).then((r) => r.json())
const matches = rs.result_summary ?? []
console.log(`  ${matches.length} matches returned`)

let pcWon = 0, pcLost = 0, pcDrawn = 0, pcTied = 0, pcAbn = 0, pcCanc = 0, pcConc = 0
let pcRunsFor = 0, pcRunsAgainst = 0
let pcHomeW = 0, pcHomeL = 0, pcAwayW = 0, pcAwayL = 0
let pcTossUs = 0, pcWonAfterToss = 0
const pcMatchSummary = []

// Helper to coerce PC string-numbers reliably
const num = (v) => v === null || v === undefined || v === '' ? null : Number(v)

for (const m of matches) {
  const isHome = String(m.home_club_id) === String(SITE_ID)
  const ourTeamId = isHome ? m.home_team_id : m.away_team_id
  // result_summary uses innings array — first innings = team that batted first
  const innings = m.innings ?? []
  const ourInn = innings.find((i) => String(i.team_batting_id) === String(ourTeamId))
  const oppInn = innings.find((i) => String(i.team_batting_id) !== String(ourTeamId))
  const ourScore = ourInn ? num(ourInn.runs) : null
  const oppScore = oppInn ? num(oppInn.runs) : null
  const ourWkts = ourInn ? num(ourInn.wickets) : null
  const oppWkts = oppInn ? num(oppInn.wickets) : null
  const result = String(m.result_applied_to) === String(ourTeamId) ? m.result : (m.result === 'W' ? 'L' : m.result === 'L' ? 'W' : m.result)
  const tossUs = String(m.toss) === String(ourTeamId)

  pcMatchSummary.push({
    date: m.match_date,
    opp: isHome ? m.away_club_name : m.home_club_name,
    ha: isHome ? 'H' : 'A',
    ours: ourScore !== null ? `${ourScore}/${ourWkts ?? '?'}` : '—',
    theirs: oppScore !== null ? `${oppScore}/${oppWkts ?? '?'}` : '—',
    result,
    tossUs,
    pcId: m.id,
  })

  pcRunsFor += ourScore ?? 0
  pcRunsAgainst += oppScore ?? 0
  if (tossUs) pcTossUs++

  if (result === 'W') {
    pcWon++; if (tossUs) pcWonAfterToss++
    if (isHome) pcHomeW++; else pcAwayW++
  } else if (result === 'L') {
    pcLost++
    if (isHome) pcHomeL++; else pcAwayL++
  } else if (result === 'D') pcDrawn++
  else if (result === 'T') pcTied++
  else if (result === 'A' || result === 'AB') pcAbn++
  else if (result === 'C' || result === 'CA') pcCanc++
  else if (result === 'CON' || (typeof result === 'string' && result.includes('Conc'))) pcConc++
}

console.log(`\n  Match list (date · opp · home/away · ours · theirs · result · toss):`)
for (const m of pcMatchSummary) {
  console.log(`    ${m.date}  ${m.ha}  vs ${(m.opp ?? '?').padEnd(28)}  ${(m.ours).padEnd(8)}  ${(m.theirs).padEnd(8)}  ${(m.result ?? '?').padEnd(4)}  toss=${m.tossUs ? 'us' : 'them'}  pc=${m.pcId}`)
}

console.log(`\n  PC tally: W=${pcWon} L=${pcLost} T=${pcTied} D=${pcDrawn} Aban=${pcAbn} Canc=${pcCanc} Conc=${pcConc}`)
console.log(`  PC RunsFor=${pcRunsFor}   RunsAgainst=${pcRunsAgainst}`)
console.log(`  PC Home W-L: ${pcHomeW}-${pcHomeL}    Away W-L: ${pcAwayW}-${pcAwayL}`)
console.log(`  PC Toss us: ${pcTossUs}/${matches.length} = ${Math.round(100 * pcTossUs / matches.length)}%   Won after toss: ${pcWonAfterToss}/${pcTossUs} = ${pcTossUs > 0 ? Math.round(100 * pcWonAfterToss / pcTossUs) : 0}%`)

// ── Cross-check vs Supabase ───────────────────────────────────────
banner(`Compare with our Supabase data`)
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { data: scs } = await sb.from('match_scorecards')
  .select('match_id, our_runs, opp_runs, result_text, our_team_id, home_team_id, toss_won_by_team_id')
  .eq('season', SEASON)

let sbRunsFor = 0, sbRunsAgainst = 0, sbWon = 0, sbLost = 0
for (const s of scs) {
  sbRunsFor += s.our_runs ?? 0
  sbRunsAgainst += s.opp_runs ?? 0
  if (s.result_text === 'Won') sbWon++
  if (s.result_text === 'Lost') sbLost++
}
console.log(`  Supabase: ${scs.length} scorecards, RunsFor=${sbRunsFor}, RunsAgainst=${sbRunsAgainst}, W=${sbWon}, L=${sbLost}`)
console.log(`  PC API:   ${matches.length} matches,  RunsFor=${pcRunsFor},  RunsAgainst=${pcRunsAgainst},  W=${pcWon}, L=${pcLost}`)
console.log(`  Match? ${matches.length === scs.length && pcRunsFor === sbRunsFor && pcRunsAgainst === sbRunsAgainst && pcWon === sbWon && pcLost === sbLost ? '✓' : '✗  MISMATCH'}`)

// ── Pull match_detail for the top match (Greg Shea's HS = 65 vs ?) ─
banner(`Spot check: full scorecards for two matches`)
const spotMatchIds = [6698256, 6698244] // Southborough away (W), Bearsted away (L 258 v 260)
for (const mid of spotMatchIds) {
  const det = await fetch(`https://play-cricket.com/api/v2/match_detail.json?match_id=${mid}&api_token=${TOKEN}`).then((r) => r.json())
  const m = det.match_details?.[0]
  if (!m) { console.log(`  pc=${mid}: not found`); continue }
  console.log(`\n  pc=${mid}  ${m.match_date}  ${m.home_club_name} vs ${m.away_club_name}  ${m.ground_name ?? '?'}`)
  // Show innings totals as PC reports them
  for (const inn of m.innings ?? []) {
    console.log(`    ${inn.team_batting_name} ${inn.runs}/${inn.wickets} (${inn.overs} ov, RR ${inn.run_rate})`)
    // Top 3 scorers in this innings
    const bats = (inn.bat ?? []).filter((b) => b.runs != null && b.runs > 0).sort((a, b) => b.runs - a.runs).slice(0, 3)
    for (const b of bats) {
      console.log(`      ${b.batsman_name.padEnd(22)} ${b.how_out.padEnd(20)} ${(b.runs ?? '').toString().padStart(3)}r ${(b.balls ?? '').toString().padStart(3)}b`)
    }
    // Top wicket-takers
    const bowls = (inn.bowl ?? []).filter((b) => b.wickets != null && b.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 3)
    if (bowls.length) console.log(`      Bowlers:`)
    for (const b of bowls) {
      console.log(`      ${b.bowler_name.padEnd(22)} ${b.overs}-${b.maidens}-${b.runs}-${b.wickets}`)
    }
  }
}

// ── Specific player career data from PC ──────────────────────────
banner(`Spot check: Greg Shea's career in 2025 from match_detail aggregation`)
// Pull all matches and aggregate
let totalRuns = 0, totalInns = 0, hs = 0
let totalWkts = 0, totalRunsConc = 0, totalOvers = 0, bestW = 0, bestR = 999
const matchIds = matches.map((m) => m.id)
for (const mid of matchIds) {
  const det = await fetch(`https://play-cricket.com/api/v2/match_detail.json?match_id=${mid}&api_token=${TOKEN}`).then((r) => r.json())
  const m = det.match_details?.[0]
  if (!m) continue
  for (const inn of m.innings ?? []) {
    for (const b of inn.bat ?? []) {
      if (b.batsman_name === 'Greg Shea') {
        const ho = (b.how_out ?? '').toLowerCase().trim()
        if (ho === 'did not bat' || ho === 'dnb' || ho === '') continue
        const r = num(b.runs) ?? 0
        totalInns++
        totalRuns += r
        if (r > hs) hs = r
      }
    }
    for (const b of inn.bowl ?? []) {
      if (b.bowler_name === 'Greg Shea') {
        const w = num(b.wickets) ?? 0
        const ru = num(b.runs) ?? 0
        totalWkts += w
        totalRunsConc += ru
        totalOvers += parseFloat(b.overs ?? 0)
        if (w > bestW || (w === bestW && ru < bestR)) { bestW = w; bestR = ru }
      }
    }
  }
}
console.log(`  Greg Shea (from PC match_detail): ${totalInns} inns, ${totalRuns} runs, HS ${hs}; ${totalWkts} wkts in ${totalOvers.toFixed(1)} overs at avg ${(totalRunsConc / Math.max(totalWkts, 1)).toFixed(1)}, best ${bestW}/${bestR}`)
console.log(`  Site/Supabase says:                   12 inns, 304 runs, HS 65;          17 wkts in 92.2 overs at avg 22.3, best 3/22`)

console.log('\nDone.')
