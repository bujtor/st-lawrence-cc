import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
for (const raw of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const eq = line.indexOf('=')
  if (eq < 0) continue
  const key = line.slice(0, eq).trim()
  let val = line.slice(eq + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  // Vercel CLI writes literal "\n" at the end of every value — interpret escapes.
  val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim()
  process.env[key] = val
}
console.error(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.error(`KEY len: ${(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').length}`)

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const { data: fixtures, error } = await sb
  .from('fixtures')
  .select('season, result_text')
  .gte('season', 2008)
  .lte('season', 2026)

if (error) { console.error(error); process.exit(1) }

const bySeason = {}
for (const f of fixtures) {
  const s = f.season
  if (!bySeason[s]) bySeason[s] = { total: 0, won: 0, lost: 0, drew: 0, tied: 0, abandoned: 0, cancelled: 0, conceded: 0, other: 0, no_result: 0 }
  bySeason[s].total++
  const r = f.result_text
  if (!r) bySeason[s].no_result++
  else if (r === 'Won') bySeason[s].won++
  else if (r === 'Lost') bySeason[s].lost++
  else if (r === 'Drew') bySeason[s].drew++
  else if (r === 'Tied') bySeason[s].tied++
  else if (r === 'Abandoned') bySeason[s].abandoned++
  else if (r === 'Cancelled') bySeason[s].cancelled++
  else if (r.includes('Conceded')) bySeason[s].conceded++
  else bySeason[s].other++
}

console.log('Season | Total | W  | L  | D  | T | Aban | Canc | Conc | Other | NoRes')
console.log('-------+-------+----+----+----+---+------+------+------+-------+------')
for (const s of Object.keys(bySeason).sort()) {
  const x = bySeason[s]
  console.log(`${s}   | ${String(x.total).padStart(5)} | ${String(x.won).padStart(2)} | ${String(x.lost).padStart(2)} | ${String(x.drew).padStart(2)} | ${String(x.tied).padStart(1)} | ${String(x.abandoned).padStart(4)} | ${String(x.cancelled).padStart(4)} | ${String(x.conceded).padStart(4)} | ${String(x.other).padStart(5)} | ${String(x.no_result).padStart(5)}`)
}
