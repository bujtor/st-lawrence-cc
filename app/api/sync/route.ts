import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  fetchPlayers,
  fetchMatches,
  fetchResults,
  fetchMatchDetail,
  parsePCDate,
  parsePCTime,
  parsePCOvers,
  toIntOrNull,
  toNumOrNull,
  type PCMatch,
  type PCResult,
} from '@/lib/play-cricket'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const OUR_CLUB_ID = '9754'

function authorized(req: NextRequest): boolean {
  const secret = process.env.SYNC_API_SECRET
  const provided = req.headers.get('x-sync-token')
  if (!secret || !provided) return false
  const a = Buffer.from(secret)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function normaliseName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Subtract 45 min from HH:MM:SS
function computeMeetTime(startTime: string | null): string | null {
  if (!startTime) return null
  const [h, m] = startTime.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const total = h * 60 + m - 45
  if (total < 0) return null
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:00`
}

type FixtureUpsert = {
  play_cricket_match_id: number
  match_date: string
  start_time: string | null
  meet_time: string | null
  opponent: string
  venue: string
  home_away: 'H' | 'A'
  competition: string | null
  season: number
  result_text: string | null
  lat: number | null
  lng: number | null
  last_synced: string
}

function matchToFixtureRow(m: PCMatch, resultByMatchId: Map<number, PCResult>): FixtureUpsert {
  const homeAway: 'H' | 'A' = m.home_club_id === OUR_CLUB_ID ? 'H' : 'A'
  const opponent = homeAway === 'H' ? m.away_club_name : m.home_club_name
  const venue = homeAway === 'H' ? 'St Lawrence CC' : m.ground_name || opponent
  const start = parsePCTime(m.match_time)
  const meet = computeMeetTime(start)

  let resultText: string | null = null
  const r = resultByMatchId.get(m.id)
  if (r) {
    const ourTeamId = homeAway === 'H' ? r.home_team_id : r.away_team_id
    if (r.result === 'T') resultText = 'Tied'
    else if (r.result === 'D') resultText = 'Drew'
    else if (r.result === 'A') resultText = 'Abandoned'
    else if (r.result === 'W' && r.result_applied_to === ourTeamId) resultText = 'Won'
    else if (r.result === 'W') resultText = 'Lost'
    else resultText = r.result_description || null
  }

  const { lat, lng } = parseCoords(m.ground_latitude, m.ground_longitude)

  return {
    play_cricket_match_id: m.id,
    match_date: parsePCDate(m.match_date),
    start_time: start,
    meet_time: meet,
    opponent,
    venue,
    home_away: homeAway,
    competition: m.competition_name || null,
    season: parseInt(m.season, 10),
    result_text: resultText,
    lat,
    lng,
    last_synced: new Date().toISOString(),
  }
}

// Play-Cricket transposes lat/lng for some grounds (e.g. our home ground stores lat=0.24, lng=51.26).
// Detect and swap when the pair looks like (UK-lng, UK-lat) rather than (UK-lat, UK-lng).
function parseCoords(latStr: string, lngStr: string): { lat: number | null; lng: number | null } {
  let la = parseFloat(latStr)
  let ln = parseFloat(lngStr)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return { lat: Number.isFinite(la) ? la : null, lng: Number.isFinite(ln) ? ln : null }
  }
  const looksSwapped = la >= -8 && la <= 2 && ln >= 49 && ln <= 59
  if (looksSwapped) {
    const tmp = la
    la = ln
    ln = tmp
  }
  return { lat: la, lng: ln }
}

async function syncPlayers() {
  const supabase = supabaseAdmin()
  const pcPlayers = await fetchPlayers()
  const pcMemberIds = new Set(pcPlayers.map(p => p.member_id))

  const { data: dbPlayers, error: readErr } = await supabase
    .from('players')
    .select('id, name, play_cricket_member_id, is_active, is_ringin, role')
  if (readErr) throw new Error(`read players: ${readErr.message}`)

  const byMemberId = new Map<number, typeof dbPlayers[number]>()
  const byName = new Map<string, typeof dbPlayers[number]>()
  for (const p of dbPlayers ?? []) {
    if (p.play_cricket_member_id != null) byMemberId.set(p.play_cricket_member_id, p)
    byName.set(normaliseName(p.name), p)
  }

  const stats = { added: 0, linked_by_name: 0, name_updated: 0, reactivated: 0, deactivated: 0, unchanged: 0 }

  for (const pc of pcPlayers) {
    const existing = byMemberId.get(pc.member_id) ?? byName.get(normaliseName(pc.name))
    if (existing) {
      const updates: Record<string, unknown> = {}
      if (existing.play_cricket_member_id !== pc.member_id) {
        updates.play_cricket_member_id = pc.member_id
        stats.linked_by_name++
      }
      if (existing.name !== pc.name) {
        updates.name = pc.name
        stats.name_updated++
      }
      if (!existing.is_active) {
        updates.is_active = true
        stats.reactivated++
      }
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('players').update(updates).eq('id', existing.id)
        if (error) throw new Error(`update player ${existing.id}: ${error.message}`)
      } else {
        stats.unchanged++
      }
    } else {
      const { error } = await supabase.from('players').insert({
        name: pc.name,
        role: 'AR',
        is_ringin: false,
        is_active: true,
        play_cricket_member_id: pc.member_id,
      })
      if (error) throw new Error(`insert player ${pc.name}: ${error.message}`)
      stats.added++
    }
  }

  // Deactivate DB players not in the latest feed (excluding ringins, who never appear in the squad list)
  for (const p of dbPlayers ?? []) {
    if (p.is_ringin) continue
    const stillPresent =
      (p.play_cricket_member_id != null && pcMemberIds.has(p.play_cricket_member_id)) ||
      pcPlayers.some(pc => normaliseName(pc.name) === normaliseName(p.name))
    if (!stillPresent && p.is_active) {
      const { error } = await supabase.from('players').update({ is_active: false }).eq('id', p.id)
      if (error) throw new Error(`deactivate player ${p.id}: ${error.message}`)
      stats.deactivated++
    }
  }

  return { source_count: pcPlayers.length, ...stats }
}

async function syncFixtures(season: number) {
  const supabase = supabaseAdmin()
  const [matches, results] = await Promise.all([fetchMatches(season), fetchResults(season)])

  const resultByMatchId = new Map<number, PCResult>()
  for (const r of results) resultByMatchId.set(r.id, r)

  const incoming = matches.map(m => matchToFixtureRow(m, resultByMatchId))
  const incomingIds = new Set(incoming.map(r => r.play_cricket_match_id))

  const { data: existing, error: readErr } = await supabase
    .from('fixtures')
    .select('id, play_cricket_match_id, match_date, opponent, meet_time, result_text')
    .eq('season', season)
  if (readErr) throw new Error(`read fixtures: ${readErr.message}`)

  const existingByPcId = new Map<number, typeof existing[number]>()
  const existingByDateOpponent = new Map<string, typeof existing[number]>()
  const dateOpKey = (date: string, opponent: string) => `${date}|${opponent.trim().toLowerCase()}`
  for (const f of existing ?? []) {
    if (f.play_cricket_match_id != null) existingByPcId.set(f.play_cricket_match_id, f)
    existingByDateOpponent.set(dateOpKey(f.match_date, f.opponent), f)
  }

  const stats = { added: 0, updated: 0, linked_by_date: 0, results_merged: 0, unchanged: 0, orphaned_kept: 0 }

  for (const row of incoming) {
    const prev =
      existingByPcId.get(row.play_cricket_match_id) ??
      existingByDateOpponent.get(dateOpKey(row.match_date, row.opponent))
    if (prev) {
      const linkedNow = prev.play_cricket_match_id == null
      if (linkedNow) stats.linked_by_date++
      // Preserve captain-edited meet_time
      const preserved: FixtureUpsert = {
        ...row,
        meet_time: prev.meet_time ?? row.meet_time,
      }
      const { error } = await supabase
        .from('fixtures')
        .update(preserved)
        .eq('id', prev.id)
      if (error) throw new Error(`update fixture ${prev.id}: ${error.message}`)
      if (row.result_text && prev.result_text !== row.result_text) stats.results_merged++
      stats.updated++
    } else {
      const { error } = await supabase.from('fixtures').insert(row)
      if (error) throw new Error(`insert fixture ${row.play_cricket_match_id}: ${error.message}`)
      stats.added++
    }
  }

  // Orphans: DB fixtures with a Play-Cricket id not in the current feed. Leave them in place
  // (captain may have manually adjusted something) but count for reporting.
  for (const f of existing ?? []) {
    if (f.play_cricket_match_id != null && !incomingIds.has(f.play_cricket_match_id)) {
      stats.orphaned_kept++
    }
  }

  return { source_count: matches.length, results_count: results.length, ...stats }
}

const OUR_CLUB_ID_SET = new Set(['9754'])

function normaliseResult(result: string, resultAppliedTo: string, ourTeamId: string): string {
  if (result === 'W') return resultAppliedTo === ourTeamId ? 'Won' : 'Lost'
  if (result === 'T') return 'Tied'
  if (result === 'D') return 'Drew'
  if (result === 'A') return 'Abandoned'
  return result
}

async function syncScorecards(season: number) {
  const supabase = supabaseAdmin()

  // 1. Get completed matches from result_summary
  const results = await fetchResults(season)
  if (results.length === 0) return { source_count: 0, fetched: 0, unchanged: 0, not_available: 0, error_count: 0, matches: [] }

  // 2. Build a map of existing match_scorecards last_updated_pc
  const { data: existingRows } = await supabase
    .from('match_scorecards')
    .select('match_id, last_updated_pc')
    .eq('season', season)

  const storedLastUpdated = new Map<number, string>()
  for (const row of existingRows ?? []) {
    storedLastUpdated.set(row.match_id, row.last_updated_pc ?? '')
  }

  // 3. Fetch fixture lookup: play_cricket_match_id -> fixture.id
  const { data: fixtureRows } = await supabase
    .from('fixtures')
    .select('id, play_cricket_match_id')
    .eq('season', season)
    .not('play_cricket_match_id', 'is', null)

  const fixtureByMatchId = new Map<number, number>()
  for (const f of fixtureRows ?? []) {
    if (f.play_cricket_match_id) fixtureByMatchId.set(f.play_cricket_match_id, f.id)
  }

  const stats = {
    source_count: results.length,
    fetched: 0,
    unchanged: 0,
    not_available: 0,
    error_count: 0,
    matches: [] as { match_id: number; status: string }[],
  }

  for (const r of results) {
    const matchId = r.id
    const pcLastUpdated = r.last_updated ?? ''

    // Skip if stored last_updated matches what PC reports (use result_description as proxy if last_updated absent)
    const storedVal = storedLastUpdated.get(matchId) ?? ''
    if (storedVal && storedVal === pcLastUpdated) {
      stats.unchanged++
      stats.matches.push({ match_id: matchId, status: 'unchanged' })
      continue
    }

    let detail = null
    try {
      detail = await fetchMatchDetail(matchId)
    } catch {
      stats.error_count++
      stats.matches.push({ match_id: matchId, status: 'error' })
      continue
    }

    if (!detail) {
      stats.not_available++
      stats.matches.push({ match_id: matchId, status: 'not_available' })
      continue
    }

    stats.fetched++

    const isHome = OUR_CLUB_ID_SET.has(detail.home_club_id)
    const ourTeamId = isHome ? detail.home_team_id : detail.away_team_id
    const oppTeamId = isHome ? detail.away_team_id : detail.home_team_id
    const resultText = normaliseResult(detail.result ?? '', detail.result_applied_to ?? '', ourTeamId)

    // Extract innings figures
    let ourRuns: number | null = null
    let ourWkts: number | null = null
    let ourOvers: number | null = null
    let oppRuns: number | null = null
    let oppWkts: number | null = null
    let oppOvers: number | null = null

    for (const inn of detail.innings ?? []) {
      const battingTeamId = inn.team_batting_id
      const runs = toIntOrNull(inn.runs)
      const wkts = toIntOrNull(inn.wickets)
      const overs = parsePCOvers(inn.overs)
      if (battingTeamId === ourTeamId) {
        ourRuns = (ourRuns ?? 0) + (runs ?? 0)
        ourWkts = (ourWkts ?? 0) + (wkts ?? 0)
        ourOvers = (ourOvers ?? 0) + (overs ?? 0)
      } else {
        oppRuns = (oppRuns ?? 0) + (runs ?? 0)
        oppWkts = (oppWkts ?? 0) + (wkts ?? 0)
        oppOvers = (oppOvers ?? 0) + (overs ?? 0)
      }
    }

    // Points
    const ourPoints = (detail.points ?? []).find(p => String(p.team_id) === String(ourTeamId))
    const ourGamePoints = toNumOrNull(ourPoints?.game_points)
    const ourBonusTotal =
      (toNumOrNull(ourPoints?.bonus_points_together) ?? 0) +
      (toNumOrNull(ourPoints?.bonus_points_batting) ?? 0) +
      (toNumOrNull(ourPoints?.bonus_points_bowling) ?? 0)

    // Build our lineup set (player_id as string) for is_our checks
    const homeLineup = (detail.players?.[0]?.home_team ?? []).map(p => String(p.player_id))
    const awayLineup = (detail.players?.[1]?.away_team ?? []).map(p => String(p.player_id))
    const ourLineupIds = new Set<string>(isHome ? homeLineup : awayLineup)

    // Upsert match_scorecards
    const scorecardRow = {
      match_id: matchId,
      fixture_id: fixtureByMatchId.get(matchId) ?? null,
      season,
      home_club_id: detail.home_club_id || null,
      home_team_id: detail.home_team_id || null,
      home_team_name: detail.home_team_name || null,
      away_club_id: detail.away_club_id || null,
      away_team_id: detail.away_team_id || null,
      away_team_name: detail.away_team_name || null,
      our_team_id: ourTeamId || null,
      opponent_team_id: oppTeamId || null,
      toss_won_by_team_id: detail.toss_won_by_team_id || null,
      batted_first_team_id: detail.batted_first || null,
      result: detail.result || null,
      result_applied_to: detail.result_applied_to || null,
      result_text: resultText || null,
      our_game_points: ourGamePoints,
      our_bonus_total: ourBonusTotal,
      our_runs: ourRuns,
      our_wickets: ourWkts,
      our_overs: ourOvers,
      opp_runs: oppRuns,
      opp_wickets: oppWkts,
      opp_overs: oppOvers,
      no_of_overs: toIntOrNull(detail.no_of_overs),
      competition_name: detail.competition_name || null,
      last_updated_pc: detail.last_updated || '',
      synced_at: new Date().toISOString(),
    }

    const { error: upsertErr } = await supabase
      .from('match_scorecards')
      .upsert(scorecardRow, { onConflict: 'match_id' })
    if (upsertErr) {
      stats.error_count++
      stats.matches.push({ match_id: matchId, status: `error: ${upsertErr.message}` })
      continue
    }

    // Delete existing batting/bowling/points rows
    await supabase.from('batting_entries').delete().eq('match_id', matchId)
    await supabase.from('bowling_entries').delete().eq('match_id', matchId)
    await supabase.from('league_points').delete().eq('match_id', matchId)

    // Insert batting entries
    const battingRows: Record<string, unknown>[] = []
    for (const inn of detail.innings ?? []) {
      const isOurBatting = inn.team_batting_id === ourTeamId
      for (const bat of inn.bat ?? []) {
        const fielderId = toIntOrNull(bat.fielder_id)
        battingRows.push({
          match_id: matchId,
          season,
          team_batting_id: inn.team_batting_id || null,
          innings_number: inn.innings_number,
          position: toIntOrNull(bat.position),
          batsman_name: bat.batsman_name || null,
          batsman_id: toIntOrNull(bat.batsman_id),
          how_out: bat.how_out || null,
          fielder_name: bat.fielder_name || null,
          fielder_id: fielderId,
          bowler_name: bat.bowler_name || null,
          bowler_id: toIntOrNull(bat.bowler_id),
          runs: toIntOrNull(bat.runs),
          fours: toIntOrNull(bat.fours),
          sixes: toIntOrNull(bat.sixes),
          balls: toIntOrNull(bat.balls),
          is_our_batsman: isOurBatting,
          // fielder is considered "ours" if they are in our lineup and they took the wicket
          is_our_fielder: fielderId != null && ourLineupIds.has(String(fielderId)),
        })
      }
    }
    if (battingRows.length > 0) {
      const { error: batErr } = await supabase.from('batting_entries').insert(battingRows)
      if (batErr) {
        stats.error_count++
        stats.matches.push({ match_id: matchId, status: `batting error: ${batErr.message}` })
        continue
      }
    }

    // Insert bowling entries
    const bowlingRows: Record<string, unknown>[] = []
    for (const inn of detail.innings ?? []) {
      // Bowling team is the opposite of batting team
      const bowlingTeamId = inn.team_batting_id === ourTeamId ? oppTeamId : ourTeamId
      const isOurBowling = bowlingTeamId === ourTeamId
      for (const bowl of inn.bowl ?? []) {
        bowlingRows.push({
          match_id: matchId,
          season,
          team_bowling_id: bowlingTeamId || null,
          innings_number: inn.innings_number,
          bowler_name: bowl.bowler_name || null,
          bowler_id: toIntOrNull(bowl.bowler_id),
          overs: parsePCOvers(bowl.overs),
          maidens: toIntOrNull(bowl.maidens),
          runs: toIntOrNull(bowl.runs),
          wickets: toIntOrNull(bowl.wickets),
          wides: toIntOrNull(bowl.wides),
          no_balls: toIntOrNull(bowl.no_balls),
          is_our_bowler: isOurBowling,
        })
      }
    }
    if (bowlingRows.length > 0) {
      const { error: bowlErr } = await supabase.from('bowling_entries').insert(bowlingRows)
      if (bowlErr) {
        stats.error_count++
        stats.matches.push({ match_id: matchId, status: `bowling error: ${bowlErr.message}` })
        continue
      }
    }

    // Insert league points
    const pointsRows: Record<string, unknown>[] = []
    for (const pt of detail.points ?? []) {
      const teamId = String(pt.team_id)
      const teamName = teamId === detail.home_team_id ? detail.home_team_name : detail.away_team_name
      pointsRows.push({
        match_id: matchId,
        team_id: teamId,
        team_name: teamName || null,
        game_points: toNumOrNull(pt.game_points),
        bonus_batting: toNumOrNull(pt.bonus_points_batting),
        bonus_bowling: toNumOrNull(pt.bonus_points_bowling),
        bonus_together: toNumOrNull(pt.bonus_points_together),
        penalty_points: toNumOrNull(pt.penalty_points),
      })
    }
    if (pointsRows.length > 0) {
      const { error: ptErr } = await supabase.from('league_points').insert(pointsRows)
      if (ptErr) {
        // Non-fatal: log but continue
        console.error(`league_points insert error for match ${matchId}: ${ptErr.message}`)
      }
    }

    stats.matches.push({ match_id: matchId, status: 'synced' })
  }

  return stats
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const target = url.searchParams.get('target') ?? 'all'
  const seasonParam = url.searchParams.get('season')
  const season = seasonParam ? parseInt(seasonParam, 10) : new Date().getFullYear()

  const out: Record<string, unknown> = { target, season, started_at: new Date().toISOString() }

  try {
    if (target === 'players' || target === 'all') {
      out.players = await syncPlayers()
    }
    if (target === 'fixtures' || target === 'all') {
      out.fixtures = await syncFixtures(season)
    }
    if (target === 'scorecards' || target === 'all') {
      out.scorecards = await syncScorecards(season)
    }
    out.finished_at = new Date().toISOString()
    return NextResponse.json(out)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ...out, error: msg }, { status: 500 })
  }
}
