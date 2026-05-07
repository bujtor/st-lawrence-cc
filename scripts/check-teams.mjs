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

// Check 1: Distinct competitions per season
const { data: comps } = await sb.from('fixtures').select('season, competition').gte('season', 2008).lte('season', 2015)
const compsBySeason = {}
for (const f of comps ?? []) {
  if (!compsBySeason[f.season]) compsBySeason[f.season] = new Set()
  if (f.competition) compsBySeason[f.season].add(f.competition)
}
console.log('Competitions per season (2008-2015):')
for (const s of Object.keys(compsBySeason).sort()) {
  console.log(`  ${s}: ${[...compsBySeason[s]].join(' | ') || '(no competition data)'}`)
}

// Check 2: Look for duplicates by date+opponent in 2012 (suspicious season)
const { data: f2012 } = await sb.from('fixtures').select('match_date, opponent, play_cricket_match_id, competition, home_away').eq('season', 2012).order('match_date')
console.log(`\n2012 fixtures (${f2012.length} total):`)
const byDate = {}
for (const f of f2012) {
  byDate[f.match_date] ??= []
  byDate[f.match_date].push(f)
}
const sameDayDates = Object.entries(byDate).filter(([, v]) => v.length > 1)
console.log(`  ${sameDayDates.length} dates have >1 fixture:`)
for (const [d, list] of sameDayDates.slice(0, 8)) {
  console.log(`    ${d}: ${list.map(f => `vs ${f.opponent} [${f.competition || '?'}] ${f.home_away}`).join('  ;  ')}`)
}

// Check 3: distinct our_team_id per season from match_scorecards (these IDs differ for 1st XI / 2nd XI on play-cricket)
const { data: scs } = await sb.from('match_scorecards').select('season, our_team_id, our_team_name').gte('season', 2008).lte('season', 2015)
const teamsBySeason = {}
for (const s of scs ?? []) {
  if (!teamsBySeason[s.season]) teamsBySeason[s.season] = new Map()
  const key = `${s.our_team_id}|${s.our_team_name ?? ''}`
  teamsBySeason[s.season].set(key, (teamsBySeason[s.season].get(key) ?? 0) + 1)
}
console.log('\nDistinct SLCC teams per season (from match_scorecards):')
for (const s of Object.keys(teamsBySeason).sort()) {
  const entries = [...teamsBySeason[s].entries()]
  console.log(`  ${s}:`)
  for (const [k, count] of entries) console.log(`    ${k} → ${count} matches`)
}
