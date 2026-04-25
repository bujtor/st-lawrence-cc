import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { todayLondon, londonWallTimeToUtc } from '@/lib/london-time'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isLiveMatch(fixture: {
  match_date: string
  result_text: string | null
  start_time: string | null
}): boolean {
  if (fixture.result_text) return false
  if (!fixture.start_time) return false

  // Use Europe/London for the match-day comparison. KCVL matches happen in
  // BST/GMT — server UTC date can flip mid-evening UK time and falsely flag
  // a match as "not today".
  if (fixture.match_date !== todayLondon()) return false

  const now = Date.now()
  // Treat fixture.match_date + start_time as a London wall-clock time. We don't
  // need millisecond accuracy — just a lower-bound and a generous end-of-day cap.
  const startUtc = londonWallTimeToUtc(fixture.match_date, fixture.start_time)
  const endUtc = londonWallTimeToUtc(fixture.match_date, '23:30:00')
  if (startUtc == null || endUtc == null) return false
  return now >= startUtc && now <= endUtc
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const fixtureId = url.searchParams.get('fixture_id')

  if (!fixtureId) {
    return NextResponse.json({ error: 'fixture_id required' }, { status: 400 })
  }

  const { data: fixture, error: fixtureErr } = await supabase
    .from('fixtures')
    .select('id, play_cricket_match_id, match_date, result_text, start_time, opponent, home_away')
    .eq('id', fixtureId)
    .single()

  if (fixtureErr || !fixture) {
    return NextResponse.json({ error: 'fixture not found' }, { status: 404 })
  }

  const live = isLiveMatch(fixture)

  // If past match with a result — look up key players
  if (fixture.result_text && fixture.play_cricket_match_id) {
    const matchId = fixture.play_cricket_match_id

    // Scorecard to know our_team_id
    const { data: sc } = await supabase
      .from('match_scorecards')
      .select('our_team_id, home_team_id, away_team_id')
      .eq('match_id', matchId)
      .single()

    if (!sc) {
      return NextResponse.json({ isLive: false, keyPlayers: undefined })
    }

    // Top scorer for us
    const { data: ourTopBat } = await supabase
      .from('batting_entries')
      .select('batsman_name, runs')
      .eq('match_id', matchId)
      .eq('is_our_batsman', true)
      .order('runs', { ascending: false, nullsFirst: false })
      .limit(1)

    // Top wicket-taker for us (tiebreak: fewer runs conceded)
    const { data: ourTopBowl } = await supabase
      .from('bowling_entries')
      .select('bowler_name, wickets, overs, runs')
      .eq('match_id', matchId)
      .eq('is_our_bowler', true)
      .order('wickets', { ascending: false, nullsFirst: false })
      .order('runs', { ascending: true, nullsFirst: false })
      .limit(1)

    // Top scorer for them
    const { data: themTopBat } = await supabase
      .from('batting_entries')
      .select('batsman_name, runs')
      .eq('match_id', matchId)
      .eq('is_our_batsman', false)
      .order('runs', { ascending: false, nullsFirst: false })
      .limit(1)

    // Top wicket-taker for them (bowling against us; tiebreak: fewer runs conceded)
    const { data: themTopBowl } = await supabase
      .from('bowling_entries')
      .select('bowler_name, wickets, overs, runs')
      .eq('match_id', matchId)
      .eq('is_our_bowler', false)
      .order('wickets', { ascending: false, nullsFirst: false })
      .order('runs', { ascending: true, nullsFirst: false })
      .limit(1)

    return NextResponse.json({
      isLive: false,
      keyPlayers: {
        us: {
          topScorer: ourTopBat?.[0]
            ? { name: ourTopBat[0].batsman_name ?? '?', runs: ourTopBat[0].runs ?? 0 }
            : undefined,
          topBowler: ourTopBowl?.[0]
            ? {
                name: ourTopBowl[0].bowler_name ?? '?',
                wkts: ourTopBowl[0].wickets ?? 0,
                overs: ourTopBowl[0].overs ?? 0,
                runs: ourTopBowl[0].runs ?? 0,
              }
            : undefined,
        },
        them: {
          topScorer: themTopBat?.[0]
            ? { name: themTopBat[0].batsman_name ?? '?', runs: themTopBat[0].runs ?? 0 }
            : undefined,
          topBowler: themTopBowl?.[0]
            ? {
                name: themTopBowl[0].bowler_name ?? '?',
                wkts: themTopBowl[0].wickets ?? 0,
                overs: themTopBowl[0].overs ?? 0,
                runs: themTopBowl[0].runs ?? 0,
              }
            : undefined,
        },
      },
    })
  }

  // If upcoming (no result_text) — compute H2H
  if (!fixture.result_text) {
    const opponent = fixture.opponent
    // H2H: match_scorecards stores team names like "1st XI" / "2nd XI" (not club
    // names), so we can't filter on those directly. Instead, look up all past
    // fixtures against this opponent by club name, then join to scorecards via
    // play_cricket_match_id.
    const { data: priorFixtures } = await supabase
      .from('fixtures')
      .select('play_cricket_match_id')
      .eq('opponent', opponent)
      .not('play_cricket_match_id', 'is', null)

    const priorMatchIds = (priorFixtures ?? [])
      .map(f => f.play_cricket_match_id)
      .filter((x): x is number => typeof x === 'number')

    const { data: h2hMatches } = priorMatchIds.length > 0
      ? await supabase
          .from('match_scorecards')
          .select('match_id, result_text')
          .in('match_id', priorMatchIds)
      : { data: [] as { match_id: number; result_text: string | null }[] }

    const h2hFiltered = h2hMatches ?? []

    const matchIds = h2hFiltered.map(sc => sc.match_id)

    let won = 0, lost = 0
    for (const sc of h2hFiltered) {
      if (sc.result_text === 'Won') won++
      else if (sc.result_text === 'Lost') lost++
    }

    // Top scorer ever vs this opponent (our batters)
    let topScorerEver: { name: string; runs: number; matchDate: string } | undefined
    let topBowlerEver: { name: string; wkts: number; runs: number; matchDate: string } | undefined

    if (matchIds.length > 0) {
      const { data: h2hBat } = await supabase
        .from('batting_entries')
        .select('batsman_name, runs, match_id')
        .in('match_id', matchIds)
        .eq('is_our_batsman', true)
        .order('runs', { ascending: false, nullsFirst: false })
        .limit(1)

      const { data: h2hBowl } = await supabase
        .from('bowling_entries')
        .select('bowler_name, wickets, runs, match_id')
        .in('match_id', matchIds)
        .eq('is_our_bowler', true)
        .order('wickets', { ascending: false, nullsFirst: false })
        .order('runs', { ascending: true, nullsFirst: false })
        .limit(1)

      // Get dates for those matches
      if (h2hBat?.[0]) {
        const { data: fx } = await supabase
          .from('fixtures')
          .select('match_date')
          .eq('play_cricket_match_id', h2hBat[0].match_id)
          .single()
        topScorerEver = {
          name: h2hBat[0].batsman_name ?? '?',
          runs: h2hBat[0].runs ?? 0,
          matchDate: fx?.match_date ?? '',
        }
      }

      if (h2hBowl?.[0]) {
        const { data: fx } = await supabase
          .from('fixtures')
          .select('match_date')
          .eq('play_cricket_match_id', h2hBowl[0].match_id)
          .single()
        topBowlerEver = {
          name: h2hBowl[0].bowler_name ?? '?',
          wkts: h2hBowl[0].wickets ?? 0,
          runs: h2hBowl[0].runs ?? 0,
          matchDate: fx?.match_date ?? '',
        }
      }
    }

    return NextResponse.json({
      isLive: live,
      h2h: {
        played: h2hFiltered.length,
        won,
        lost,
        topScorerEver,
        topBowlerEver,
      },
    })
  }

  return NextResponse.json({ isLive: live })
}
