import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normaliseResult } from '@/lib/result-normalisation'
import {
  fetchPlayers,
  fetchMatches,
  fetchResults,
  fetchMatchDetail,
  fetchLeagueTable,
  parsePCDate,
  parsePCTime,
  parsePCOvers,
  toIntOrNull,
  toNumOrNull,
  type PCMatch,
  type PCResult,
  type PCLeagueTableRow,
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

function matchToFixtureRow(m: PCMatch, resultByMatchId: Map<number, PCResult>): FixtureUpsert | null {
  const matchDate = parsePCDate(m.match_date)
  if (!matchDate) return null
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
    match_date: matchDate,
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

  const incoming = matches
    .map(m => matchToFixtureRow(m, resultByMatchId))
    .filter((r): r is FixtureUpsert => r !== null)
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
    const homePlayers = detail.players?.[0]?.home_team ?? []
    const awayPlayers = detail.players?.[1]?.away_team ?? []
    const homeLineup = homePlayers.map(p => String(p.player_id))
    const awayLineup = awayPlayers.map(p => String(p.player_id))
    const ourLineupIds = new Set<string>(isHome ? homeLineup : awayLineup)

    // Captain + keeper IDs per team (for the (c) and † markers in the scorecard)
    const homeCaptain = homePlayers.find(p => p.captain)?.player_id
    const homeKeeper  = homePlayers.find(p => p.wicket_keeper)?.player_id
    const awayCaptain = awayPlayers.find(p => p.captain)?.player_id
    const awayKeeper  = awayPlayers.find(p => p.wicket_keeper)?.player_id

    // Per-innings extras + fall-of-wickets, keyed by team_batting_id
    const extrasByTeam: Record<string, {
      byes: number; leg_byes: number; wides: number; no_balls: number;
      penalty: number; total: number;
    }> = {}
    const fowByTeam: Record<string, Array<{
      runs: number; wickets: number;
      batsman_out_id: string | null; batsman_out_name: string | null;
      batsman_in_id: string | null;  batsman_in_name: string | null;
      batsman_in_runs: number | null;
    }>> = {}
    for (const inn of detail.innings ?? []) {
      const tid = inn.team_batting_id
      if (!tid) continue
      extrasByTeam[tid] = {
        byes: toIntOrNull(inn.extra_byes) ?? 0,
        leg_byes: toIntOrNull(inn.extra_leg_byes) ?? 0,
        wides: toIntOrNull(inn.extra_wides) ?? 0,
        no_balls: toIntOrNull(inn.extra_no_balls) ?? 0,
        penalty: toIntOrNull((inn as { extra_penalty_runs?: string }).extra_penalty_runs) ?? 0,
        total: toIntOrNull(inn.total_extras) ?? 0,
      }
      const fowRaw = (inn as { fow?: Array<{
        runs: string | number; wickets: string | number;
        batsman_out_id?: string; batsman_out_name?: string;
        batsman_in_id?: string;  batsman_in_name?: string;
        batsman_in_runs?: string | number;
      }> }).fow ?? []
      fowByTeam[tid] = fowRaw.map(f => ({
        runs: toIntOrNull(String(f.runs)) ?? 0,
        wickets: toIntOrNull(String(f.wickets)) ?? 0,
        batsman_out_id: f.batsman_out_id || null,
        batsman_out_name: f.batsman_out_name || null,
        batsman_in_id: f.batsman_in_id || null,
        batsman_in_name: f.batsman_in_name || null,
        batsman_in_runs: toIntOrNull(String(f.batsman_in_runs ?? '')),
      }))
    }

    // Upsert match_scorecards
    const scorecardRow = {
      match_id: matchId,
      fixture_id: fixtureByMatchId.get(matchId) ?? null,
      season,
      home_club_id: detail.home_club_id || null,
      home_team_id: detail.home_team_id || null,
      home_team_name: detail.home_team_name || null,
      home_club_name: detail.home_club_name || null,
      away_club_id: detail.away_club_id || null,
      away_team_id: detail.away_team_id || null,
      away_team_name: detail.away_team_name || null,
      away_club_name: detail.away_club_name || null,
      competition_id: detail.competition_id || null,
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
      home_captain_id: homeCaptain ? String(homeCaptain) : null,
      home_wicket_keeper_id: homeKeeper ? String(homeKeeper) : null,
      away_captain_id: awayCaptain ? String(awayCaptain) : null,
      away_wicket_keeper_id: awayKeeper ? String(awayKeeper) : null,
      match_notes: (detail as { match_notes?: string }).match_notes || null,
      fow: fowByTeam,
      extras: extrasByTeam,
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

    // Insert league points. Store combined "Club - XI" name for display.
    const pointsRows: Record<string, unknown>[] = []
    for (const pt of detail.points ?? []) {
      const teamId = String(pt.team_id)
      const isHomeTeam = teamId === detail.home_team_id
      const clubName = isHomeTeam ? detail.home_club_name : detail.away_club_name
      const teamName = isHomeTeam ? detail.home_team_name : detail.away_team_name
      const fullName = clubName && teamName ? `${clubName} - ${teamName}` : (clubName || teamName || null)
      pointsRows.push({
        match_id: matchId,
        team_id: teamId,
        team_name: fullName,
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

// One-call standings via Play-Cricket's official League Table API. Returns the
// authoritative division table with all PC's columns including wcn (opposition
// conceded) and lcn (team conceded), which we couldn't derive from result_summary.
async function syncLeagueStandings(season: number) {
  const supabase = supabaseAdmin()

  // Identify our division_id for this season — the competition_id stored on our
  // league matches. (Friendlies/cups have empty competition_id.)
  const { data: ourScorecards } = await supabase
    .from('match_scorecards')
    .select('competition_id, home_club_id, away_club_id, home_club_name, away_club_name, home_team_id, away_team_id')
    .eq('season', season)
    .not('competition_id', 'is', null)
    .neq('competition_id', '')

  if (!ourScorecards || ourScorecards.length === 0) {
    return { status: 'skipped', reason: 'no league scorecards synced yet for this season' }
  }

  const compCounts = new Map<string, number>()
  for (const sc of ourScorecards) {
    if (sc.competition_id) compCounts.set(sc.competition_id, (compCounts.get(sc.competition_id) ?? 0) + 1)
  }
  const competitionId = [...compCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]

  // Build a team_id -> {club_id, club_name} map from our scorecards so we can
  // attach club info to the table rows (the league_table API only gives us team_name).
  const clubByTeamId = new Map<string, { club_id: string; club_name: string }>()
  for (const sc of ourScorecards) {
    if (sc.home_team_id && sc.home_club_id) {
      clubByTeamId.set(sc.home_team_id, {
        club_id: sc.home_club_id,
        club_name: sc.home_club_name ?? '',
      })
    }
    if (sc.away_team_id && sc.away_club_id) {
      clubByTeamId.set(sc.away_team_id, {
        club_id: sc.away_club_id,
        club_name: sc.away_club_name ?? '',
      })
    }
  }

  const table = await fetchLeagueTable(competitionId)
  if (!table) {
    return { status: 'failed', reason: 'league_table.json returned empty', competition_id: competitionId }
  }

  // The headings map is column_N -> label (e.g. 'p', 'w', 'wcn', 'BatP'). Find each
  // label's column key so we can look up the value per row.
  const headingToCol = new Map<string, string>()
  for (const [col, label] of Object.entries(table.headings ?? {})) {
    headingToCol.set(String(label).toLowerCase(), col)
  }
  const get = (row: PCLeagueTableRow, label: string): string => {
    const col = headingToCol.get(label.toLowerCase())
    return col ? (row as Record<string, string>)[col] ?? '' : ''
  }
  const getNum = (row: PCLeagueTableRow, label: string): number => {
    const v = get(row, label)
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }

  // Map the table values into our league_standings schema.
  const rows = table.values.map((v) => {
    const teamName = get(v, 'team') || (v as Record<string, string>).column_1 || ''
    const clubInfo = clubByTeamId.get(v.team_id)
    const won = getNum(v, 'w')
    const wcn = getNum(v, 'wcn')
    const lost = getNum(v, 'l')
    const lcn = getNum(v, 'lcn')
    const bonus_batting = getNum(v, 'batp')
    const bonus_bowling = getNum(v, 'bowlp')
    const position = parseInt(v.position ?? '', 10)
    return {
      season,
      competition_id: competitionId,
      team_id: v.team_id,
      team_name: teamName || v.team_id,
      club_id: clubInfo?.club_id ?? null,
      club_name: clubInfo?.club_name ?? null,
      position: Number.isFinite(position) ? position : null,
      played: getNum(v, 'p'),
      won,
      lost,
      tied: getNum(v, 't'),
      drew: 0, // PC's KCVL table doesn't expose 'd' separately
      abandoned: getNum(v, 'a'),
      cancelled: getNum(v, 'c'),
      wcn,
      lcn,
      bonus_batting,
      bonus_bowling,
      bonus_together: bonus_batting + bonus_bowling,
      penalty_points: getNum(v, 'pen'),
      points: getNum(v, 'pts'),
      synced_at: new Date().toISOString(),
    }
  })

  await supabase.from('league_standings').delete().eq('season', season).eq('competition_id', competitionId)
  if (rows.length > 0) {
    const { error } = await supabase.from('league_standings').insert(rows)
    if (error) throw new Error(`insert league_standings: ${error.message}`)
  }

  return {
    season,
    competition_id: competitionId,
    division_name: table.name,
    teams: rows.length,
    source: 'league_table.json',
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const target = url.searchParams.get('target') ?? 'all'
  const VALID_TARGETS = new Set(['all', 'players', 'fixtures', 'scorecards', 'standings'])
  if (!VALID_TARGETS.has(target)) {
    return NextResponse.json(
      { error: `invalid target '${target}'`, valid: [...VALID_TARGETS] },
      { status: 400 }
    )
  }
  const seasonParam = url.searchParams.get('season')
  const season = seasonParam ? parseInt(seasonParam, 10) : new Date().getFullYear()
  if (!Number.isFinite(season) || season < 2000 || season > 2100) {
    return NextResponse.json({ error: `invalid season '${seasonParam}'` }, { status: 400 })
  }

  const startedAt = new Date().toISOString()
  const out: Record<string, unknown> = { target, season, started_at: startedAt }

  // Create sync_run record
  // Allow cron handler to override trigger via header
  const triggerHeader = req.headers.get('x-sync-trigger')
  const trigger = triggerHeader === 'cron' ? 'cron' : 'manual'
  const syncDb = supabaseAdmin()
  const { data: runRow } = await syncDb
    .from('sync_runs')
    .insert({ trigger, target, season, status: 'success', started_at: startedAt })
    .select('id')
    .single()
  const runId: number | null = runRow?.id ?? null

  let errorMsg: string | null = null
  let hasErrors = false

  try {
    if (target === 'players' || target === 'all') {
      out.players = await syncPlayers()
    }
    if (target === 'fixtures' || target === 'all') {
      out.fixtures = await syncFixtures(season)
    }
    if (target === 'scorecards' || target === 'all') {
      out.scorecards = await syncScorecards(season)
      const sc = out.scorecards as { error_count?: number } | undefined
      if (sc && typeof sc.error_count === 'number' && sc.error_count > 0) hasErrors = true
    }
    if (target === 'standings' || target === 'all') {
      out.standings = await syncLeagueStandings(season)
    }
    out.finished_at = new Date().toISOString()

    if (runId) {
      await syncDb.from('sync_runs').update({
        finished_at: out.finished_at,
        status: hasErrors ? 'partial' : 'success',
        result_summary: out,
      }).eq('id', runId)
    }

    return NextResponse.json(out)
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e)
    out.finished_at = new Date().toISOString()

    if (runId) {
      await syncDb.from('sync_runs').update({
        finished_at: out.finished_at,
        status: 'error',
        error: errorMsg,
        result_summary: out,
      }).eq('id', runId)
    }

    return NextResponse.json({ ...out, error: errorMsg }, { status: 500 })
  }
}
